// ORBIT Platform — gedeelde navigatie. Eén plek voor het menu van álle
// pagina's: een balk met ORBIT links en een Menu-knop rechts, die één
// overzicht met alle pagina's opent. Het bestaande <nav class="platform-nav">
// van elke pagina blijft in de HTML staan als terugval; dit script vervangt
// alleen de inhoud. Zonder JavaScript werkt de oude balk dus gewoon.
(function () {
  var script = document.currentScript;
  var nav = document.querySelector('nav.platform-nav');
  if (!script || !nav) return;

  // Absolute basis van de site, afgeleid van waar dit script zelf vandaan komt
  // (werkt zowel op / als in /pages/).
  var base = script.src.replace(/assets\/nav\.js(\?.*)?$/, '');

  var GROUPS = [
    { label: 'Play', items: [
      { id: 'launch', text: 'Play ORBIT', href: 'pages/launch.html' },
      { id: 'games', text: 'Games', href: 'games.html' }
    ] },
    { label: 'My ORBIT', items: [
      { id: 'scores', text: 'My scores', href: 'pages/scores.html' },
      { id: 'leaderboard', text: 'Leaderboard', href: 'pages/leaderboard.html' },
      { id: 'account', text: 'Account', href: 'pages/account.html' },
      { id: 'feedback', text: 'Feedback', href: 'pages/feedback.html' }
    ] },
    { label: 'About', items: [
      { id: 'about', text: 'About', href: 'pages/about.html' },
      { id: 'demo', text: 'Demo', href: 'pages/demo.html' },
      { id: 'beta', text: 'Beta access', href: 'pages/beta.html' }
    ] }
  ];
  var ADMIN_GROUP = { label: 'Admin', items: [
    { id: 'admin-codes', text: 'Invite codes', href: 'pages/admin-codes.html' }
  ] };

  // Huidige pagina, voor de markering in het menu.
  var path = location.pathname.replace(/\/+$/, '');
  var current = (path.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function groupHtml(g) {
    return '<div class="nav-group"><div class="nav-group-label">' + esc(g.label) + '</div>' +
      g.items.map(function (it) {
        var isCur = it.id === current;
        return '<a class="nav-item' + (isCur ? ' current' : '') + '" href="' + base + it.href + '"' +
          (isCur ? ' aria-current="page"' : '') + '>' + esc(it.text) + '</a>';
      }).join('') + '</div>';
  }

  nav.innerHTML =
    '<a href="' + base + 'index.html" class="wordmark">ORBIT</a>' +
    '<button type="button" class="nav-menu-btn" id="navMenuBtn" aria-haspopup="dialog" aria-expanded="false" aria-controls="navSheet">' +
      '<span class="nav-menu-label">Menu</span>' +
      '<span class="nav-menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>' +
    '</button>';

  var sheet = document.createElement('div');
  sheet.className = 'nav-sheet';
  sheet.id = 'navSheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Menu');
  sheet.innerHTML =
    '<div class="nav-sheet-top">' +
      '<a href="' + base + 'index.html" class="wordmark">ORBIT</a>' +
      '<button type="button" class="nav-menu-btn nav-close" id="navCloseBtn" aria-label="Close menu">' +
        '<span class="nav-menu-label">Close</span>' +
        '<span class="nav-menu-icon open" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '</button>' +
    '</div>' +
    '<div class="nav-sheet-body" id="navSheetBody">' + GROUPS.map(groupHtml).join('') + '</div>';
  document.body.appendChild(sheet);

  var btn = document.getElementById('navMenuBtn');
  var closeBtn = document.getElementById('navCloseBtn');
  var body = document.getElementById('navSheetBody');
  var adminChecked = false;

  function open() {
    sheet.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('nav-locked');
    closeBtn.focus();
    checkAdmin();
  }
  function close() {
    sheet.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('nav-locked');
    btn.focus();
  }

  // Beheer-groep alleen tonen voor beheerders. Uitsluitend een weergave-
  // keuze: de echte controle blijft server-side in api/admin-create-code.js.
  // Firebase wordt pas geladen als het menu voor het eerst opengaat, zodat
  // publieke pagina's er niet zwaarder van worden.
  function checkAdmin() {
    if (adminChecked) return;
    adminChecked = true;
    import(base + 'assets/firebase-init.js').then(function (fb) {
      var off = fb.onAuthStateChanged(fb.auth, function (user) {
        if (typeof off === 'function') off();
        if (!user) return;
        user.getIdToken().then(function (idToken) {
          return fetch('/api/is-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: idToken })
          });
        }).then(function (res) { return res.json(); }).then(function (data) {
          if (data && data.isAdmin) body.insertAdjacentHTML('beforeend', groupHtml(ADMIN_GROUP));
        }).catch(function () {});
      });
    }).catch(function () {});
  }

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  sheet.addEventListener('click', function (e) {
    // Tik naast de lijst (op de lege achtergrond) sluit het menu.
    if (e.target === sheet || e.target === body) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !sheet.hidden) close();
  });
})();
