// functions/roblox/user.js
const USERS_BASE = "https://users.roblox.com";
const THUMB_BASE = "https://thumbnails.roblox.com";
const FRIENDS_BASE = "https://friends.roblox.com";
const PRESENCE_BASE = "https://presence.roblox.com";

function esc(str = "") {
  return str
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const body = { usernames: [username], excludeBannedUsers: true };
  return await safeJson(`${USERS_BASE}/v1/usernames/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function fetchCoreUser(id) {
  return await safeJson(`${USERS_BASE}/v1/users/${id}`);
}

async function fetchAvatarThumb(id) {
  const data = await safeJson(
    `${THUMB_BASE}/v1/users/avatar?userIds=${id}&size=352x352&format=Png&isCircular=false`
  );
  if (!data || !data.data || !data.data[0]) return null;
  return data.data[0].imageUrl || null;
}

async function fetchCounts(id) {
  const [friends, followers, following] = await Promise.all([
    safeJson(`${FRIENDS_BASE}/v1/users/${id}/friends/count`),
    safeJson(`${FRIENDS_BASE}/v1/users/${id}/followers/count`),
    safeJson(`${FRIENDS_BASE}/v1/users/${id}/followings/count`),
  ]);
  return {
    friends: (friends && friends.count) || 0,
    followers: (followers && followers.count) || 0,
    following: (following && following.count) || 0,
  };
}

async function fetchPresence(id) {
  const data = await safeJson(`${PRESENCE_BASE}/v1/presence/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userIds: [id] }),
  });
  if (!data || !data.userPresences || !data.userPresences[0]) return null;
  return data.userPresences[0];
}

function presenceLabel(p) {
  if (!p) return { text: "Unknown", cls: "" };
  const t = p.userPresenceType; // 0 Unknown, 1 Offline, 2 Online, 3 InGame, 4 InStudio
  if (t === 3) return { text: p.lastLocation || "In-Game", cls: "ingame" };
  if (t === 2) return { text: "Online", cls: "online" };
  if (t === 4) return { text: p.lastLocation || "Studio", cls: "ingame" };
  if (t === 1) return { text: "Offline", cls: "offline" };
  return { text: "Unknown", cls: "" };
}

function truncate(str = "", max = 220) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!+d) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildHtml({ username, data, error }) {
  const baseUrl = "https://favnc.pages.dev/roblox/user";
  const defaultIcon = "https://favnc.pages.dev/assets/icons/roblox.png";

  const hasUser = !!data && !error;

  const titleUser = hasUser
    ? `${data.displayName || data.name} - Roblox profile`
    : "Favnc Roblox Profile Viewer";

  const metaDesc = hasUser
    ? `${data.name} is one of the millions creating and exploring on Roblox. ${truncate(
        data.description || "",
        160
      )}`
    : "View Roblox profiles with a clean, futuristic viewer powered by Roblox APIs.";

  const metaImage = hasUser && data.avatarUrl ? data.avatarUrl : defaultIcon;
  const metaUrl = username
    ? `${baseUrl}?${encodeURIComponent(username)}`
    : baseUrl;

  const presence = hasUser ? presenceLabel(data.presence) : { text: "—", cls: "" };

  const friends = hasUser ? data.friends.toLocaleString() : "—";
  const followers = hasUser ? data.followers.toLocaleString() : "—";
  const following = hasUser ? data.following.toLocaleString() : "—";

  const displayName = hasUser ? data.displayName || data.name : "—";
  const actualUser = hasUser ? data.name : username || "—";
  const bio = hasUser
    ? data.description || "No description set."
    : "Type a username to load a profile.";
  const joined = hasUser ? fmtDate(data.created) : "—";
  const userId = hasUser ? data.id : "—";
  const verified = hasUser ? (data.hasVerifiedBadge ? "Yes" : "No") : "—";
  const blurb = hasUser
    ? truncate(data.description || "—", 220)
    : "—";

  const statusText = hasUser
    ? data.status || data.description || "No status."
    : "—";

  const errorBanner = error
    ? `<div class="error-banner glass"><span>${esc(error)}</span></div>`
    : "";

  return (
    "<!DOCTYPE html><html lang=\"en\"><head>" +
    `<meta charset="UTF-8">` +
    `<title>${esc(titleUser)}</title>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1.0">` +
    `<link rel="icon" href="${defaultIcon}">` +
    `<meta name="description" content="${esc(metaDesc)}">` +
    `<meta property="og:site_name" content="Favnc Roblox Viewer">` +
    `<meta property="og:title" content="${esc(titleUser)}">` +
    `<meta property="og:type" content="profile">` +
    `<meta property="og:url" content="${esc(metaUrl)}">` +
    `<meta property="og:image" content="${esc(metaImage)}">` +
    `<meta property="og:description" content="${esc(metaDesc)}">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${esc(titleUser)}">` +
    `<meta name="twitter:description" content="${esc(metaDesc)}">` +
    `<meta name="twitter:image" content="${esc(metaImage)}">` +
    `<link rel="stylesheet" href="https://favnc.pages.dev/css/roblox-user.css">` +
    // your runtime stack
    `<script src="https://favnc.pages.dev/web_runtime/console.js" defer></script>` +
    `<script src="https://favnc.pages.dev/web_runtime/localstorage.js" defer></script>` +
    `<script src="https://favnc.pages.dev/web_runtime/rhtml.js" defer></script>` +
    `<script src="https://favnc.pages.dev/web_runtime/webperms.js" defer></script>` +
    "</head><body>" +
    // background video (Akashi)
    `<video id="bg" src="https://favnc.pages.dev/assets/_bkgrnds_akashi.mp4" autoplay muted loop playsinline></video>` +
    `<div id="shell">` +
    `<header id="topbar"><div id="brand"><span id="logo-dot"></span><span id="brand-text">Favnc · Roblox User</span></div>` +
    `<form id="search" autocomplete="off"><input id="search-input" type="text" placeholder="Search username…" spellcheck="false" value="${esc(
      username || ""
    )}"><button id="search-btn" type="submit">View</button></form></header>` +
    `<main id="layout"><section id="left">` +
    `<div id="avatar-card" class="glass"><div id="avatar-frame">` +
    (hasUser && data.avatarUrl
      ? `<img id="avatar-img" src="${esc(
          data.avatarUrl
        )}" alt="Avatar" loading="lazy">`
      : `<img id="avatar-img" src="" alt="Avatar" style="display:none">`) +
    `<div id="avatar-skeleton"></div></div>` +
    `<div id="identity"><div id="display-name">${esc(
      displayName
    )}</div><div id="username">@${esc(actualUser)}</div>` +
    `<div id="presence-pill" class="${esc(
      presence.cls
    )}">${esc(presence.text)}</div></div></div>` +
    `<div id="about-card" class="glass"><div class="card-title">About</div>` +
    `<p id="bio">${esc(bio)}</p>` +
    `<div class="meta-row"><span class="meta-label">Joined</span><span class="meta-value" id="joined">${esc(
      joined
    )}</span></div>` +
    `<div class="meta-row"><span class="meta-label">UserId</span><span class="meta-value" id="userid">${esc(
      userId
    )}</span></div>` +
    `<div class="meta-row"><span class="meta-label">Verified</span><span class="meta-value" id="verified">${esc(
      verified
    )}</span></div></div>` +
    `</section><section id="right">` +
    `<div id="tabs" class="glass"><button class="tab active" data-tab="overview">Overview</button><button class="tab" data-tab="games">Games</button><button class="tab" data-tab="badges">Badges</button></div>` +
    `<div id="panel-overview" class="panel glass active">` +
    `<div class="stat-grid">` +
    `<div class="stat"><div class="stat-label">Friends</div><div class="stat-value" id="friends">${friends}</div></div>` +
    `<div class="stat"><div class="stat-label">Followers</div><div class="stat-value" id="followers">${followers}</div></div>` +
    `<div class="stat"><div class="stat-label">Following</div><div class="stat-value" id="following">${following}</div></div>` +
    `</div>` +
    `<div class="info-block"><div class="info-title">Status</div><div class="info-body" id="status">${esc(
      statusText
    )}</div></div>` +
    `<div class="info-block"><div class="info-title">Blurb</div><div class="info-body" id="blurb">${esc(
      blurb
    )}</div></div>` +
    `</div>` +
    `<div id="panel-games" class="panel glass"><div class="info-title">Profile games</div><div id="games-list" class="game-list"><div class="muted">Games preview coming soon.</div></div></div>` +
    `<div id="panel-badges" class="panel glass"><div class="info-title">Featured badges</div><div id="badges-list" class="badge-list"><div class="muted">Badges preview coming soon.</div></div></div>` +
    `</section></main>` +
    `<footer id="foot"><span>Powered by public Roblox web APIs · All data from Roblox</span></footer>` +
    `<div id="loader" class="hidden"><div class="spinner"></div><div class="loader-text">Loading Roblox profile…</div></div>` +
    errorBanner +
    `</div>` +
    // audio toggle button (bottom-right)
    `<button id="audio-toggle">Unmute background</button>` +
    // inline JS (one line, like you like)
    `<script>(()=>{const f=document.getElementById("search"),i=document.getElementById("search-input");f.addEventListener("submit",e=>{e.preventDefault();const v=i.value.trim();if(!v)return;const base=window.location.origin+window.location.pathname;window.location.href=base+"?"+encodeURIComponent(v)});document.querySelectorAll(".tab").forEach(btn=>{btn.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");const t=btn.dataset.tab;document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));const panel=document.getElementById("panel-"+t);if(panel)panel.classList.add("active")})});window.addEventListener("load",()=>{const l=document.getElementById("loader");if(l)l.classList.add("hidden");const sk=document.getElementById("avatar-skeleton");const img=document.getElementById("avatar-img");if(img&&img.src){img.style.display="block";if(sk)sk.style.display="none";}});const bg=document.getElementById("bg"),btn=document.getElementById("audio-toggle");if(btn&&bg){btn.addEventListener("click",()=>{if(bg.muted){if(confirm("Enable background audio?")){bg.muted=false;bg.volume=0.55;btn.textContent="Mute background";}}else{bg.muted=true;btn.textContent="Unmute background";}});}})();</script>` +
    "</body></html>"
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
      const [core, avatarUrl, counts, presence] = await Promise.all([
        fetchCoreUser(id),
        fetchAvatarThumb(id),
        fetchCounts(id),
        fetchPresence(id),
      ]);
      if (!core) {
        error = "Failed to load Roblox profile.";
      } else {
        data = {
          id,
          name: core.name,
          displayName: core.displayName || core.name,
          description: core.description || "",
          created: core.created,
          hasVerifiedBadge: !!core.hasVerifiedBadge,
          avatarUrl: avatarUrl || "",
          friends: counts.friends,
          followers: counts.followers,
          following: counts.following,
          presence: presence || null,
          status: core.status || "",
        };
      }
    }
  }

  const html = buildHtml({ username, data, error });
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
