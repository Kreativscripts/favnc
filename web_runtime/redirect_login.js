(function () {
  try {
    var username = null;
    try { username = localStorage.getItem("favnc_username"); } catch (e) {}
    if (username) return;
    var d = document, head = d.head || d.documentElement;
    var style = d.createElement("style");
    style.textContent =
      "html,body{height:100%!important}" +
      "#favnc_rl_back{position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;opacity:0;animation:favnc_in .55s ease forwards}" +
      "#favnc_rl_img{position:absolute;inset:-80px;pointer-events:none;background:url(https://favnc.pages.dev/assets/angry_nezuko.png) center/cover no-repeat;opacity:.12;mix-blend-mode:screen;filter:grayscale(1) contrast(1.25) brightness(.8);animation:favnc_flicker 1.75s infinite}" +
      "#favnc_rl_v{position:absolute;inset:0;pointer-events:none;background:radial-gradient(900px 650px at 50% 35%,rgba(255,255,255,.08),transparent 55%),repeating-linear-gradient(0deg,rgba(255,255,255,.05),rgba(255,255,255,.05) 1px,transparent 1px,transparent 4px);opacity:.14;mix-blend-mode:screen}" +
      "#favnc_rl_txt{position:relative;z-index:2;color:rgba(255,255,255,.92);text-align:center;font-weight:950;letter-spacing:1.2px;font-size:24px;line-height:1.15;text-transform:uppercase;text-shadow:0 0 18px rgba(255,255,255,.18)}" +
      "#favnc_rl_txt small{display:block;margin-top:10px;font-size:12px;letter-spacing:.35px;color:rgba(255,255,255,.55);font-weight:750}" +
      "#favnc_rl_back.fading{animation:favnc_out .65s ease forwards}" +
      "@keyframes favnc_in{from{opacity:0}to{opacity:1}}" +
      "@keyframes favnc_out{from{opacity:1}to{opacity:0}}" +
      "@keyframes favnc_flicker{0%,100%{opacity:.08;filter:grayscale(1) contrast(1.2) brightness(.7)}4%{opacity:.22;filter:grayscale(1) contrast(1.45) brightness(1)}7%{opacity:.06;filter:grayscale(1) contrast(1.15) brightness(.65)}13%{opacity:.18}16%{opacity:.05}31%{opacity:.16}35%{opacity:.08}52%{opacity:.20}55%{opacity:.06}73%{opacity:.17}79%{opacity:.10}92%{opacity:.23}}";
    head.appendChild(style);
    var back = d.createElement("div");
    back.id = "favnc_rl_back";
    var img = d.createElement("div");
    img.id = "favnc_rl_img";
    var v = d.createElement("div");
    v.id = "favnc_rl_v";
    var txt = d.createElement("div");
    txt.id = "favnc_rl_txt";
    txt.innerHTML = "I DON\u2019T KNOW WHO YOU ARE.<small>YOU DO NOT BELONG HERE.</small>";
    back.appendChild(img);
    back.appendChild(v);
    back.appendChild(txt);
    var mount = function () { try { (d.body || d.documentElement).appendChild(back); } catch (e) {} };
    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", mount, { once: true });
    else mount();
    setTimeout(function () { try { back.classList.add("fading"); } catch (e) {} }, 1400);
    setTimeout(function () {
      try { location.replace("https://favnc.pages.dev"); }
      catch (e) { location.href = "https://favnc.pages.dev"; }
    }, 1950);
  } catch (e) {
    try { location.replace("https://favnc.pages.dev"); }
    catch (x) { location.href = "https://favnc.pages.dev"; }
  }
})();
