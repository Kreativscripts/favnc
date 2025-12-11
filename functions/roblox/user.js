const USERS_BASE = "https://users.roproxy.com";
const THUMB_BASE = "https://thumbnails.roproxy.com";
const FRIENDS_BASE = "https://friends.roproxy.com";
const PRESENCE_BASE = "https://presence.roproxy.com";
const GAMES_BASE = "https://games.roproxy.com";
const BADGES_BASE = "https://badges.roproxy.com";

function esc(str = "") {
  return str.toString()
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function fmtNum(n) {
  if (n == null) return "0";
  try { return Number(n).toLocaleString("en-US"); }
  catch { return String(n); }
}

function truncate(str = "", max = 220) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!+d) return "—";
  return d.toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });
}

async function safeJson(url, init) {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("fetch fail", url, e);
    return null;
  }
}

async function fetchUserByName(username) {
  return await safeJson(
    `${USERS_BASE}/v1/usernames/users`,
    {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body:JSON.stringify({ usernames:[username], excludeBannedUsers:true })
    }
  );
}

async function fetchCoreUser(id) {
  return await safeJson(`${USERS_BASE}/v1/users/${id}`);
}

async function fetchAvatarThumb(id) {
  const d = await safeJson(
    `${THUMB_BASE}/v1/users/avatar?userIds=${id}&size=352x352&format=Png&isCircular=false`
  );
  if (!d || !d.data || !d.data[0]) return null;
  return d.data[0].imageUrl || null;
}

async function fetchCounts(id) {
  const [f, fo, fi] = await Promise.all([
    safeJson(`${FRIENDS_BASE}/v1/users/${id}/friends/count`),
    safeJson(`${FRIENDS_BASE}/v1/users/${id}/followers/count`),
    safeJson(`${FRIENDS_BASE}/v1/users/${id}/followings/count`)
  ]);
  return {
    friends: (f && f.count) || 0,
    followers: (fo && fo.count) || 0,
    following: (fi && fi.count) || 0
  };
}

async function fetchPresence(id) {
  const d = await safeJson(
    `${PRESENCE_BASE}/v1/presence/users`,
    {
      method:"POST",
      headers:{ "content-type":"application/json" },
      body:JSON.stringify({ userIds:[id] })
    }
  );
  if (!d || !d.userPresences || !d.userPresences[0]) return null;
  return d.userPresences[0];
}

function presenceLabel(p) {
  if (!p) return { text:"Unknown", cls:"" };
  const t = p.userPresenceType;
  if (t === 3) return { text:p.lastLocation || "In-Game", cls:"ingame" };
  if (t === 4) return { text:p.lastLocation || "Studio", cls:"ingame" };
  if (t === 2) return { text:"Online", cls:"online" };
  if (t === 1) return { text:"Offline", cls:"offline" };
  return { text:"Unknown", cls:"" };
}

async function fetchGames(id) {
  const d = await safeJson(
    `${GAMES_BASE}/v2/users/${id}/games?limit=6&sortOrder=Desc`
  );
  if (!d || !d.data) return [];
  return d.data.map(g => ({
    id:g.id,
    universeId:g.rootPlaceId || g.placeId || g.id,
    name:g.name || "Untitled",
    visits:g.visits || 0,
    playing:g.playing || 0
  }));
}

async function fetchBadges(id) {
  const d = await safeJson(
    `${BADGES_BASE}/v1/users/${id}/badges?limit=6&sortOrder=Desc`
  );
  if (!d || !d.data) return [];
  return d.data.map(b => ({
    id:b.id,
    name:b.name || "Badge",
    description:b.description || "",
    displayName:b.displayName || b.name || "Badge"
  }));
}

async function fetchGameThumbs(universeIds) {
  if (!universeIds.length) return {};
  const qs = universeIds.join(",");
  const d = await safeJson(
    `${THUMB_BASE}/v1/games/icons?universeIds=${qs}&size=150x150&format=Png&isCircular=false`
  );
  const out = {};
  if (!d || !d.data) return out;
  d.data.forEach(t => { out[t.targetId] = t.imageUrl; });
  return out;
}

async function fetchBadgeIcons(badgeIds) {
  if (!badgeIds.length) return {};
  const qs = badgeIds.join(",");
  const d = await safeJson(
    `${THUMB_BASE}/v1/badges/icons?badgeIds=${qs}&size=150x150&format=Png&isCircular=false`
  );
  const out = {};
  if (!d || !d.data) return out;
  d.data.forEach(t => { out[t.targetId] = t.imageUrl; });
  return out;
}

function buildHtml({ username, data, error }) {
  const baseUrl = "https://favnc.pages.dev/roblox/user";
  const defaultIcon = "https://favnc.pages.dev/assets/icons/roblox.png";

  const hasUser = !!data && !error;

  const titleUser = hasUser
    ? `${data.displayName || data.name} - Roblox profile`
    : "Favnc Roblox Profile Viewer";

  const metaDesc = hasUser
    ? `${data.name} is one of the millions creating and exploring on Roblox. ${truncate(data.description || "", 160)}`
    : "View Roblox profiles with a clean, futuristic viewer powered by Roblox APIs.";

  const metaImage = hasUser && data.avatarUrl ? data.avatarUrl : defaultIcon;
  const metaUrl = username ? `${baseUrl}?${encodeURIComponent(username)}` : baseUrl;

  const presence = hasUser ? presenceLabel(data.presence) : { text:"—", cls:"" };
  const friends = hasUser ? fmtNum(data.friends) : "—";
  const followers = hasUser ? fmtNum(data.followers) : "—";
  const following = hasUser ? fmtNum(data.following) : "—";

  const displayName = hasUser ? (data.displayName || data.name) : "—";
  const actualUser = hasUser ? data.name : (username || "—");
  const bio = hasUser ? (data.description || "No description set.") : "Type a username to load a profile.";
  const joined = hasUser ? fmtDate(data.created) : "—";
  const userId = hasUser ? data.id : "—";
  const verified = hasUser ? (data.hasVerifiedBadge ? "Yes" : "No") : "—";
  const blurb = hasUser ? truncate(data.description || "—", 220) : "—";
  const statusText = hasUser ? (data.status || data.description || "No status.") : "—";

  const gamesHtml = hasUser && data.games && data.games.length
    ? data.games.map(g => (
      `<a class="game-tile" href="https://www.roblox.com/games/${g.id}/" target="_blank" rel="noreferrer">` +
        `<div class="game-thumb">` +
          (g.iconUrl
            ? `<img src="${esc(g.iconUrl)}" alt="${esc(g.name)}">`
            : `<div class="game-thumb-skel"></div>`) +
        `</div>` +
        `<div class="game-meta">` +
          `<div class="game-name">${esc(g.name)}</div>` +
          `<div class="game-sub">${fmtNum(g.visits)} visits • ${fmtNum(g.playing)} playing</div>` +
        `</div>` +
      `</a>`
    )).join("")
    : `<div class="muted">No public games found.</div>`;

  const badgesHtml = hasUser && data.badges && data.badges.length
    ? data.badges.map(b => (
      `<div class="badge-tile">` +
        `<div class="badge-thumb">` +
          (b.iconUrl
            ? `<img src="${esc(b.iconUrl)}" alt="${esc(b.name)}">`
            : `<div class="badge-thumb-skel"></div>`) +
        `</div>` +
        `<div class="badge-meta">` +
          `<div class="badge-name">${esc(b.name)}</div>` +
          `<div class="badge-sub">${esc(truncate(b.description || "—", 90))}</div>` +
        `</div>` +
      `</div>`
    )).join("")
    : `<div class="muted">No badges to show.</div>`;

  const errorBanner = error
    ? `<div class="error-banner glass"><span>${esc(error)}</span></div>`
    : "";

  return (
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(titleUser)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" href="${defaultIcon}">
<meta name="description" content="${esc(metaDesc)}">
<meta property="og:site_name" content="Favnc Roblox Viewer">
<meta property="og:title" content="${esc(titleUser)}">
<meta property="og:type" content="profile">
<meta property="og:url" content="${esc(metaUrl)}">
<meta property="og:image" content="${esc(metaImage)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titleUser)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(metaImage)}">
<link rel="stylesheet" href="https://favnc.pages.dev/css/roblox-user.css">
<script src="https://favnc.pages.dev/web_runtime/console.js" defer></script>
<script src="https://favnc.pages.dev/web_runtime/localstorage.js" defer></script>
<script src="https://favnc.pages.dev/web_runtime/rhtml.js" defer></script>
<script src="https://favnc.pages.dev/web_runtime/webperms.js" defer></script>
</head>
<body>
<video id="bg" src="https://favnc.pages.dev/assets/_bkgrnds_/akashi.mp4" autoplay muted loop playsinline></video>
<div id="shell">
<header id="topbar">
  <div id="brand">
    <span id="logo-dot"></span>
    <span id="brand-text">Favnc · Roblox User</span>
  </div>
  <form id="search" autocomplete="off">
    <input id="search-input" type="text" placeholder="Search username…" spellcheck="false" value="${esc(username || "")}">
    <button id="search-btn" type="submit">View</button>
  </form>
</header>
<main id="layout">
<section id="left">
  <div id="avatar-card" class="glass">
    <div id="avatar-frame">
      ${
        hasUser && data.avatarUrl
          ? `<img id="avatar-img" src="${esc(data.avatarUrl)}" alt="Avatar" loading="lazy">`
          : `<img id="avatar-img" src="" alt="Avatar" style="display:none">`
      }
      <div id="avatar-skeleton"></div>
    </div>
    <div id="identity">
      <div id="display-name">${esc(displayName)}</div>
      <div id="username">@${esc(actualUser)}</div>
      <div id="presence-pill" class="${esc(presence.cls)}">${esc(presence.text)}</div>
    </div>
  </div>
  <div id="about-card" class="glass">
    <div class="card-title">About</div>
    <p id="bio">${esc(bio)}</p>
    <div class="meta-row">
      <span class="meta-label">Joined</span>
      <span class="meta-value" id="joined">${esc(joined)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">UserId</span>
      <span class="meta-value" id="userid">${esc(userId)}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">Verified</span>
      <span class="meta-value" id="verified">${esc(verified)}</span>
    </div>
  </div>
</section>
<section id="right">
  <div id="tabs" class="glass">
    <button class="tab active" data-tab="overview">Overview</button>
    <button class="tab" data-tab="games">Games</button>
    <button class="tab" data-tab="badges">Badges</button>
  </div>
  <div id="panel-overview" class="panel glass active">
    <div class="stat-grid">
      <div class="stat">
        <div class="stat-label">Friends</div>
        <div class="stat-value" id="friends">${friends}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Followers</div>
        <div class="stat-value" id="followers">${followers}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Following</div>
        <div class="stat-value" id="following">${following}</div>
      </div>
    </div>
    <div class="info-block">
      <div class="info-title">Status</div>
      <div class="info-body" id="status">${esc(statusText)}</div>
    </div>
    <div class="info-block">
      <div class="info-title">Blurb</div>
      <div class="info-body" id="blurb">${esc(blurb)}</div>
    </div>
  </div>
  <div id="panel-games" class="panel glass">
    <div class="info-title">Profile games</div>
    <div id="games-list" class="game-list">${gamesHtml}</div>
  </div>
  <div id="panel-badges" class="panel glass">
    <div class="info-title">Featured badges</div>
    <div id="badges-list" class="badge-list">${badgesHtml}</div>
  </div>
</section>
</main>
<footer id="foot">
  <span>Powered by public Roblox web APIs · All data from Roblox</span>
</footer>
<div id="loader" class="hidden">
  <div class="spinner"></div>
  <div class="loader-text">Loading Roblox profile…</div>
</div>
${errorBanner}
</div>
<button id="audio-toggle">Unmute background</button>
<script>
(()=> {
  const form = document.getElementById("search");
  const input = document.getElementById("search-input");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    const base = window.location.origin + window.location.pathname;
    window.location.href = base + "?" + encodeURIComponent(val);
  });
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const t = btn.dataset.tab;
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      const panel = document.getElementById("panel-" + t);
      if (panel) panel.classList.add("active");
    });
  });
  window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("hidden");
    const sk = document.getElementById("avatar-skeleton");
    const img = document.getElementById("avatar-img");
    if (img && img.src) {
      img.style.display = "block";
      if (sk) sk.style.display = "none";
    }
  });
  const bg = document.getElementById("bg");
  const btn = document.getElementById("audio-toggle");
  if (btn && bg) {
    btn.addEventListener("click", () => {
      if (bg.muted) {
        if (confirm("Enable background audio?")) {
          bg.muted = false;
          bg.volume = 0.55;
          btn.textContent = "Mute background";
        }
      } else {
        bg.muted = true;
        btn.textContent = "Unmute background";
      }
    });
  }
})();
</script>
</body>
</html>`
  );
}

export async function onRequest({ request }) {
  const url = new URL(request.url);

  let username =
    url.searchParams.get("user") ||
    url.searchParams.get("u") ||
    url.searchParams.get("name") ||
    url.searchParams.get("username") ||
    "";

  if (!username && url.search && url.search.startsWith("?")) {
    username = decodeURIComponent(url.search.slice(1));
  }

  username = username.trim();

  let data = null;
  let error = "";

  if (username) {
    const lookup = await fetchUserByName(username);
    if (!lookup || !lookup.data || !lookup.data.length) {
      error = "User not found on Roblox.";
    } else {
      const u = lookup.data[0];
      const id = u.id;
      const [core, avatarUrl, counts, pres, games, badges] = await Promise.all([
        fetchCoreUser(id),
        fetchAvatarThumb(id),
        fetchCounts(id),
        fetchPresence(id),
        fetchGames(id),
        fetchBadges(id)
      ]);
      if (!core) {
        error = "Failed to load Roblox profile.";
      } else {
        let gameThumbs = {};
        let badgeThumbs = {};
        try {
          gameThumbs = await fetchGameThumbs(games.map(g => g.universeId));
          badgeThumbs = await fetchBadgeIcons(badges.map(b => b.id));
        } catch (e) {
          console.error("thumbs fail", e);
        }
        games.forEach(g => { g.iconUrl = gameThumbs[g.universeId] || ""; });
        badges.forEach(b => { b.iconUrl = badgeThumbs[b.id] || ""; });
        data = {
          id:core.id,
          name:core.name,
          displayName:core.displayName || core.name,
          description:core.description || "",
          created:core.created,
          hasVerifiedBadge:!!core.hasVerifiedBadge,
          avatarUrl:avatarUrl || "",
          friends:counts.friends,
          followers:counts.followers,
          following:counts.following,
          presence:pres || null,
          status:core.status || "",
          games,
          badges
        };
      }
    }
  }

  const html = buildHtml({ username, data, error });

  return new Response(html, {
    headers:{ "content-type":"text/html; charset=utf-8" }
  });
}
