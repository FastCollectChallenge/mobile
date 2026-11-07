// mobile.js : adaptation téléphone (mode paysage). Script classique.
// À charger APRÈS le script du jeu, i18n.js et craft-machine.js (voir fin de index.html).
// S'active tout seul sur téléphone/tablette tactile, ou sur mobile.fastcollectchallenge.com, ou avec ?mobile=1.
(function () {
  const q = new URLSearchParams(location.search);
  if (q.get("mobile") === "0") return;
  const IS_MOBILE = q.get("mobile") === "1" || /^mobile\./.test(location.hostname) ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (matchMedia("(pointer:coarse)").matches && matchMedia("(hover:none)").matches) ||
    (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 900);
  if (!IS_MOBILE) return;

  /* ---------- réglages ---------- */
  const UI_SCALE = 0.75;         // 1 = taille normale, 0.75 = 25 % plus petit, 0.6 = encore plus petit
  const TOUCH_OFFSET_Y = 56;     // le joystick 🕹️ est décalé au-dessus du doigt pour rester visible
  const NO_GLOW = true;          // supprime les halos (shadowBlur) autour des pommes : gros gain de fluidité
  const CAP_60FPS = true;        // évite que la balle aille 2x plus vite sur les écrans 120 Hz
  const AUTO_FULLSCREEN = false;  // plein écran + paysage au clic sur un mode (Android ; iPhone ne le permet pas)

  const root = document.documentElement;
  root.classList.add("fcm");
  const $ = id => document.getElementById(id);
  const isFr = () => root.classList.contains("fr");

  /* ---------- viewport (au cas où la balise meta n'a pas été modifiée) ---------- */
  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
  meta.content = "width=device-width, initial-scale=" + UI_SCALE + ", minimum-scale=" + UI_SCALE + ", maximum-scale=" + UI_SCALE + ", user-scalable=no, viewport-fit=cover";

  /* ---------- CSS ---------- */
  const SAFE_L = "env(safe-area-inset-left,0px)", SAFE_R = "env(safe-area-inset-right,0px)";
  const css = document.createElement("style");
  css.textContent = `
  html.fcm,html.fcm body{overscroll-behavior:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
  html.fcm canvas{width:100vw;height:100vh;height:100dvh}
  html.fcm #gameCanvas{touch-action:none}
  html.fcm input,html.fcm select,html.fcm textarea{font-size:16px!important}

  /* accueil : on remplace l'échelle 1920x1080 par une échelle adaptée aux petits écrans */
  html.fcm #home-screen{height:100vh!important;height:100dvh!important;--u:min(calc(100vw / 1000),calc(100vh / 520));--u:min(calc(100vw / 1000),calc(100dvh / 520))}
  html.fcm #hm-root{--hu:min(calc(100vw / 1300),calc(100vh / 600));--hu:min(calc(100vw / 1300),calc(100dvh / 600))}
  html.fcm .home-disclaimer{font-size:8px;bottom:6px;right:8px}
  html.fcm .home-disclaimer img{height:14px;width:auto}

  /* HUD en jeu */
  html.fcm #adventure-hud{left:calc(8px + ${SAFE_L});top:8px}
  html.fcm .hud-row{gap:8px}
  html.fcm #open-inv-btn{font-size:9px;padding:8px 12px;border-width:2px;border-radius:10px}
  html.fcm .pinned-money{font-size:10px;padding:6px 12px}
  html.fcm #score,html.fcm #timer-display{font-size:13px;top:8px}
  html.fcm #score{left:calc(10px + ${SAFE_L})}
  html.fcm #timer-display{right:calc(10px + ${SAFE_R})}
  html.fcm #spawn-panel{top:8px;right:calc(8px + ${SAFE_R});font-size:10px;padding:3px 8px;border-radius:10px}
  html.fcm .spawn-row{gap:10px;padding:2px 0}
  html.fcm .spawn-icons{min-width:40px}
  html.fcm .spawn-icons img{width:18px;height:18px}
  html.fcm #money-hud{left:calc(10px + ${SAFE_L});bottom:10px}
  html.fcm #money-display{font-size:28px;-webkit-text-stroke:1.5px #fff}
  html.fcm #hud-events{right:calc(8px + ${SAFE_R});bottom:78px;gap:8px;transform:scale(.7);transform-origin:bottom right}
  html.fcm #msg-container-top{top:36px}
  html.fcm #msg-container-bottom{bottom:70px}
  html.fcm .admin-msg{max-width:92vw}

  /* boutons latéraux : plus de survol sur tactile (l'icône reste affichée) */
  html.fcm #side-buttons{left:calc(8px + ${SAFE_L});gap:8px}
  html.fcm .side-btn{width:48px;height:48px;border-radius:12px}
  html.fcm .side-btn:hover{transform:none}
  html.fcm .side-btn:hover img{display:block}
  html.fcm .side-btn:hover .side-btn-label{display:none}
  html.fcm .side-btn.no-img img{display:none}
  html.fcm .side-btn.no-img .side-btn-label,html.fcm .side-btn.no-img:hover .side-btn-label{display:block;font-size:7px!important}
  html.fcm #leave-game-btn{left:calc(10px + ${SAFE_L});bottom:10px;padding:8px 12px;font-size:9px;border-width:2px}
  html.fcm #leave-game-btn .leave-icon,html.fcm #leave-game-btn:hover .leave-icon{display:none}
  html.fcm #leave-game-btn .leave-label,html.fcm #leave-game-btn:hover .leave-label{display:inline}

  /* écrans Inventaire / Boutique / Index */
  html.fcm #inventory-screen,html.fcm #shop-screen,html.fcm #index-screen{top:2vh;top:2dvh;left:2vw;width:96vw;height:96vh;height:96dvh;border-radius:16px;padding:10px 14px}
  html.fcm .screen-header{margin-bottom:8px;padding-bottom:8px}
  html.fcm .money-badge{font-size:11px;padding:6px 16px}
  html.fcm .close-screen-btn{font-size:9px;padding:8px 14px}
  html.fcm .tabs-container{margin-bottom:8px}
  html.fcm .tab-btn{font-size:9px;padding:8px 12px}
  html.fcm #inventory-grid,html.fcm #shop-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding-right:4px;touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
  html.fcm #index-grid{grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:10px;padding-right:4px;touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
  html.fcm .index-item-card{padding:8px;border-radius:14px;gap:6px}
  html.fcm .index-item-img{max-width:56px}
  html.fcm .index-item-name{font-size:9px}
  html.fcm .inv-item-card{height:64px;border-radius:16px;padding:0 10px}
  html.fcm .inv-item-info{gap:8px;font-size:11px}
  html.fcm .inv-item-icon-img{width:32px;height:32px}
  html.fcm .inv-item-count{font-size:11px}
  html.fcm .sell-btn{width:36px;height:36px;font-size:15px;right:8px}
  html.fcm .shop-item-card{height:120px;border-radius:14px}
  html.fcm #inv-bar{left:14px;right:14px;bottom:8px}
  html.fcm .bar-btn{font-size:11px;padding:8px 12px;border-radius:10px}
  html.fcm .bar-half{font-size:11px;padding:8px 14px}
  html.fcm #inventory-grid{padding-bottom:56px!important}

  /* popups */
  html.fcm #sell-modal .sell-box{width:min(440px,94vw)!important;max-height:96vh;max-height:96dvh;overflow:auto;padding:12px 16px}
  html.fcm #sell-modal .sell-box h3{margin:0 0 4px;font-size:13px}
  html.fcm #sell-modal .sell-box>div:has(.qty-col){margin:6px 0!important;gap:8px!important}
  html.fcm .qty-col{gap:3px}
  html.fcm .qty-btn{padding:6px 0;font-size:11px}
  html.fcm #qty-num{font-size:20px!important}
  html.fcm .confirm-box{max-width:92vw}
  html.fcm #account-panel{max-width:94vw;max-height:94vh;max-height:94dvh;overflow-y:auto}
  html.fcm .acc-btn{font-size:9px;padding:10px 14px}
  html.fcm #autosell-modal>div{padding:14px!important;max-height:92vh!important;max-height:92dvh!important}
  html.fcm #auto-grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))!important;gap:8px!important}
  html.fcm .auto-card{font-size:10px;padding:6px;gap:3px}
  html.fcm .auto-card img{width:36px;height:36px}

  /* machine de craft */
  html.fcm #cm-machine{height:32vh;height:32dvh}
  html.fcm #cm-title{bottom:calc(32dvh + 6px);font-size:16px;-webkit-text-stroke:2px #f4ecff}
  html.fcm #cm-recipes{top:8px;bottom:calc(32dvh + 40px);gap:8px;padding:4px 12px}
  html.fcm .cm-rc{padding:6px 10px;gap:8px;border-radius:12px}
  html.fcm .cm-ri img{width:30px;height:30px}
  html.fcm .cm-out img{width:36px;height:36px}
  html.fcm .cm-cb{padding:8px 12px;font-size:10px}
  html.fcm #cm-exit{left:calc(12px + ${SAFE_L});bottom:12px;padding:10px 14px}
  html.fcm #cm-result img{width:80px;height:80px}
  html.fcm #cm-result .box{padding:16px 24px;gap:8px}
  html.fcm #cm-prompt{padding:8px 12px 8px 8px;font-size:10px}

  /* message "tourne ton téléphone" */
  @media (orientation:portrait){
    html.fcm #home-screen{--u:min(calc(100vw / 600),calc(100dvh / 900))}
    html.fcm #hm-root{--hu:min(calc(100vw / 700),calc(100dvh / 1000))}
    html.fcm #hm-title{top:calc(190 * var(--hu))}
    html.fcm #hm-modes{flex-direction:column;gap:calc(30 * var(--u));top:calc(50% + 60px)}
    html.fcm #spawn-panel{top:56px}
    html.fcm #msg-container-top{top:90px}
  }`;
  document.head.appendChild(css);

  /* ---------- contrôles tactiles : le doigt remplace la souris ---------- */
  const cv = $("gameCanvas");
  const OVERLAYS = ["inventory-screen", "shop-screen", "index-screen", "trade-screen", "trading-screen", "profile-page", "sell-modal", "custom-confirm-modal", "autosell-modal", "add-modal", "account-modal"];
  const overlayOpen = () => OVERLAYS.some(id => { const e = $(id); return e && getComputedStyle(e).display !== "none"; });
  let touchId = null, ignore = false;
  const moveTo = t => {
    if (typeof player === "undefined") return;
    player.x = Math.max(0, Math.min(window.innerWidth, t.clientX));
    player.y = Math.max(0, Math.min(window.innerHeight, t.clientY - TOUCH_OFFSET_Y));
  };
  if (cv) {
    cv.addEventListener("touchstart", e => {
      if (overlayOpen()) { ignore = true; return; }   // un menu est ouvert : on laisse le tap normal (fermer, etc.)
      ignore = false; e.preventDefault();
      const t = e.changedTouches[0]; touchId = t.identifier; moveTo(t);
    }, { passive: false });
    cv.addEventListener("touchmove", e => {
      if (ignore) return; e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === touchId) { moveTo(t); break; }
    }, { passive: false });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === touchId) touchId = null; };
    cv.addEventListener("touchend", end); cv.addEventListener("touchcancel", end);
  }
  window.addEventListener("contextmenu", e => e.preventDefault());   // pas de menu au appui long

  /* ---------- machine de craft : "E" n'existe pas sur téléphone ---------- */
  const k = document.querySelector("#cm-prompt .cm-k"); if (k) k.textContent = "👆";

  /* ---------- performances ---------- */
  if (NO_GLOW && cv) {
    try { const c = cv.getContext("2d"); Object.defineProperty(c, "shadowBlur", { get() { return 0; }, set() { }, configurable: true }); } catch (e) { }
  }
  if (CAP_60FPS) {
    const raf = window.requestAnimationFrame.bind(window), last = new WeakMap();
    window.requestAnimationFrame = cb => raf(function tick(t) {
      const l = last.get(cb) || 0;
      if (t - l < 14) return raf(tick);   // image trop rapprochée (écran 90/120 Hz) : on saute
      last.set(cb, t); cb(t);
    });
  }

  /* ---------- plein écran + paysage (Android) ---------- */
  if (AUTO_FULLSCREEN) {
    const go = () => {
      const el = document.documentElement;
      if (document.fullscreenElement || !el.requestFullscreen) return;
      el.requestFullscreen().then(() => { try { return screen.orientation.lock("landscape"); } catch (e) { } }).catch(() => { });
    };
    ["hm-adv", "hm-arc"].forEach(id => { const b = $(id); if (b) b.addEventListener("click", go); });
  }
})();