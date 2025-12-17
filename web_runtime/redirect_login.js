(function () {
  try {
    var username = null;
    try { username = localStorage.getItem("favnc_username"); } catch (e) {}
    if (username) return;
    var d = document;
    var head = d.head || d.documentElement;
    var style = d.createElement("style");
    style.textContent =
      "html,body{height:100%!important}" +
      "#favnc_rl_back{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}" +
      "#favnc_rl_wrap{position:relative;width:min(920px,92vw);padding:22px 18px 18px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(0,0,0,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:0 30px 90px rgba(0,0,0,.65);overflow:hidden}" +
      "#favnc_rl_img{position:absolute;inset:-40px;pointer-events:none;background:url(https://favnc.pages.dev/assets/angry_nezuko.png) center/cover no-repeat;opacity:.14;mix-blend-mode:screen;filter:grayscale(1) contrast(1.1) brightness(.85);animation:favnc_rl_flicker 2.15s infinite}" +
      "#favnc_rl_v{position:absolute;inset:0;pointer-events:none;background:radial-gradient(900px 650px at 50% 35%,rgba(255,255,255,.08),transparent 55%),repeating-linear-gradient(0deg,rgba(255,255,255,.04),rgba(255,255,255,.04) 1px,transparent 1px,transparent 4px);opacity:.12;mix-blend-mode:screen}" +
      "#favnc_rl_txt{position:relative;z-index:2;color:rgba(255,255,255,.92);text-align:center;font-weight:850;letter-spacing:.5px;font-size:22px;line-height:1.25;text-transform:uppercase}" +
      "#favnc_rl_sub{position:relative;z-index:2;margin-top:10px;color:rgba(255,255,255,.62);text-align:center;font-weight:650;font-size:13px;letter-spacing:.2px}" +
      "#favnc_rl_bar{position:relative;z-index:2;margin:16px auto 0;width:min(520px,100%);height:10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);overflow:hidden}" +
      "#favnc_rl_fill{height:100%;width:0%;background:rgba(255,255,255,.75);filter:drop-shadow(0 0 14px rgba(255,255,255,.25));animation:favnc_rl_load 2.2s ease-in-out forwards}" +
      "@keyframes favnc_rl_load{0%{width:0%}100%{width:100%}}" +
      "@keyframes favnc_rl_flicker{0%,100%{opacity:.10;filter:grayscale(1) contrast(1.1) brightness(.8)}6%{opacity:.22;filter:grayscale(1) contrast(1.25) brightness(1)}8%{opacity:.08;filter:grayscale(1) contrast(1.05) brightness(.75)}14%{opacity:.18}16%{opacity:.06}33%{opacity:.16}36%{opacity:.09}52%{opacity:.19}54%{opacity:.07}71%{opacity:.17}78%{opacity:.11}92%{opacity:.21}}";
    head.appendChild(style);
    var back = d.createElement("div");
    back.id = "favnc_rl_back";
    var wrap = d.createElement("div");
    wrap.id = "favnc_rl_wrap";
    var img = d.createElement("div");
    img.id = "favnc_rl_img";
    var v = d.createElement("div");
    v.id = "favnc_rl_v";
    var txt = d.createElement("div");
    txt.id = "favnc_rl_txt";
    txt.textContent = "I do not know who you are.";
    var sub = d.createElement("div");
    sub.id = "favnc_rl_sub";
    sub.textContent = "Redirecting to favnc.pages.dev...";
    var bar = d.createElement("div");
    bar.id = "favnc_rl_bar";
    var fill = d.createElement("div");
    fill.id = "favnc_rl_fill";
    bar.appendChild(fill);
    wrap.appendChild(img);
    wrap.appendChild(v);
    wrap.appendChild(txt);
    wrap.appendChild(sub);
    wrap.appendChild(bar);
    back.appendChild(wrap);
    var mount = function () { try { (d.body || d.documentElement).appendChild(back); } catch (e) {} };
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", mount, { once: true });
    else mount();
    setTimeout(function () {
      try { location.replace("https://favnc.pages.dev"); }
      catch (e) { location.href = "https://favnc.pages.dev"; }
    }, 2300);
  } catch (e) {
    try { location.replace("https://favnc.pages.dev"); }
    catch (x) { location.href = "https://favnc.pages.dev"; }
  }
})();
