/* 授業ライブ — 線画アイコン・単元の紋章・ロゴ（Astra の線画スタイル。色は currentColor） */
(function (root) {
  "use strict";
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    home: '<path d="M4 11l8-7 8 7v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
    book: '<path d="M12 6.6C10.4 5.1 7.8 4.6 3.8 4.9V18.2c4-.3 6.6.2 8.2 1.7 1.6-1.5 4.2-2 8.2-1.7V4.9c-4-.3-6.6.2-8.2 1.7z"/><path d="M12 6.6v13.2"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.2 2.2M13.8 9.2l2 2"/>',
    moon: '<path d="M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
    logout: '<path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    task: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12.2l2.8 2.8L16.5 9"/>',
    quiz: '<path d="M7 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M15 3.5V8h4M9 12h6M9 15.5h6M9 9h3"/>',
    quill: '<path d="M20 4C13.5 5 9.2 9.2 7.3 15.2L6 20l4.7-1.4C16.7 16.7 19.8 12 20 4z"/><path d="M7.5 16.5l5.5-5.5"/>',
    poll: '<path d="M5 20v-8M12 20V5M19 20v-5"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20c.3-3.4 2.8-5.8 6-5.8s5.7 2.4 6 5.8"/><circle cx="17.2" cy="9" r="2.5"/><path d="M16.3 14.2c2.6.2 4.3 2.2 4.7 5"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.9 1.9M17.5 17.5l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.9-1.9M17.5 6.5l1.9-1.9"/>',
    screen: '<rect x="3" y="4" width="18" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>',
    star: '<path d="M12 3.3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.7l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    sparkle: '<path d="M12 2.8l1.9 5.5 5.5 1.9-5.5 1.9L12 17.6l-1.9-5.5-5.5-1.9 5.5-1.9z"/><path d="M19 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    pin: '<path d="M9 3.5h6l-1 6 3.2 3.2H6.8L10 9.5z"/><path d="M12 12.7V21"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.5 6.2c.5-.1 1-.2 1.5-.2 5 0 8.5 4 9.5 6-.5 1-1.5 2.5-3 3.8M6.3 7.8C4.5 9 3.4 10.7 2.5 12c1 2 4.5 6 9.5 6 1.4 0 2.6-.3 3.7-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/>',
    refresh: '<path d="M20 11.5a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5V10h-5.5"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
    print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7.5" rx="2"/><path d="M7 14h10v6H7z"/>',
    copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    megaphone: '<path d="M4 10v4l11 5V5L4 10z"/><path d="M15 9a3 3 0 0 1 0 6M7 14.5l1 5h3l-1-3.8"/>',
    flag: '<path d="M5.5 21V4M5.5 4h11l-2 4 2 4h-11"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M4 5.5h16v10.5H9.5L5 19.5v-3.5H4z"/>',
    question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.7"/><circle cx="12" cy="16.8" r=".9" fill="currentColor"/>',
    lifebuoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/><path d="M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5"/>',
    hand: '<path d="M8.2 13V6.6a1.5 1.5 0 0 1 3 0V11.5M11.2 11V5.2a1.5 1.5 0 0 1 3 0V11M14.2 11.2V6.8a1.5 1.5 0 0 1 3 0V14c0 4-2.4 7-6 7-2.4 0-3.9-1.1-5.1-2.9L4 14.6a1.5 1.5 0 0 1 2.5-1.7l1.7 1.8"/>',
    orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-25 12 12)"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
    chart: '<path d="M4 19.5h16M6.5 16l4-5 3 3 4.5-6.5"/>',
    wave: '<path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0"/>',
    ai: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 7V4M9.5 12h.01M14.5 12h.01M9.5 15h5"/><circle cx="12" cy="3.5" r="1"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
  };
  function svg(name, cls, title) {
    const body = P[name] || P.sparkle;
    return `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" aria-hidden="${title ? "false" : "true"}" ${title ? `role="img" aria-label="${title}"` : ""} fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  }

  // 単元の紋章（線画）
  const UNIT = {
    1: '<path d="M3 15h18"/><path d="M18.5 12.5L21 15l-2.5 2.5"/><path d="M6 13v4M12 13v4"/><path d="M6 5v5M3.5 7.5h5M15 7.5h5"/>',
    2: '<text x="12" y="17" text-anchor="middle" font-family="Times New Roman, serif" font-style="italic" font-size="15" fill="currentColor" stroke="none">ax</text>',
    3: '<path d="M12 4v15M7 20h10M5 8h14"/><path d="M5 8l-2.6 5.4h5.2zM19 8l-2.6 5.4h5.2z"/>',
    4: '<path d="M4.5 20V4M4.5 20H20"/><path d="M4.5 20L18.5 6"/><circle cx="11.5" cy="13" r="1.1" fill="currentColor"/>',
    5: '<path d="M12 4L4 19.5h16z"/><path d="M8.5 13.5a4.5 4.5 0 0 1 7 0"/>',
    6: '<path d="M12 3.5l7.8 4.3v8.4L12 20.5l-7.8-4.3V7.8z"/><path d="M12 12l7.8-4.2M12 12v8.5M12 12L4.2 7.8"/>',
    7: '<path d="M3.5 20h17"/><path d="M6.5 20v-7M10.5 20V8M14.5 20v-5M18.5 20v-9" stroke-width="2.6"/>',
  };
  function unit(no, cls) {
    return `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${UNIT[no] || UNIT[1]}</svg>`;
  }

  // ロゴ（菱形の紋章＋きらめき）
  function emblem(cls) {
    return `<svg class="emblem ${cls || ""}" viewBox="0 0 40 40" aria-hidden="true">
      <defs><linearGradient id="emg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#ffd26e"/><stop offset="1" stop-color="#c47a26"/></linearGradient></defs>
      <rect x="8" y="8" width="24" height="24" rx="2" transform="rotate(45 20 20)" fill="rgba(8,14,48,.85)" stroke="url(#emg)" stroke-width="1.6"/>
      <rect x="12.5" y="12.5" width="15" height="15" rx="1" transform="rotate(45 20 20)" fill="none" stroke="rgba(255,220,132,.35)" stroke-width="1"/>
      <path d="M20 11.5l1.9 6.6 6.6 1.9-6.6 1.9L20 28.5l-1.9-6.6-6.6-1.9 6.6-1.9z" fill="url(#emg)"/>
    </svg>`;
  }

  root.IC = { svg, unit, emblem, names: Object.keys(P) };
})(window);
