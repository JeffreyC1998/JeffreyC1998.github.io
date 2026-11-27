(function () {
  var root = document.documentElement;

  // Theme toggle: follows the system until the visitor picks one, then remembers it.
  // The inline script in <head> sets the initial theme before first paint.
  var toggle = document.querySelector('.theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.content = theme === 'light' ? '#eef2f8' : '#0b1424';
    if (toggle) toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
  function storedTheme() {
    try { var s = localStorage.getItem('theme'); return s === 'dark' || s === 'light' ? s : null; } catch (e) { return null; }
  }
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var onSystemChange = function (e) { if (!storedTheme()) applyTheme(e.matches ? 'light' : 'dark'); };
    if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  // Email link: the address is assembled here so it isn't in the HTML as plain text
  document.querySelectorAll('.email-link').forEach(function (a) {
    var addr = a.dataset.user + '@' + a.dataset.domain;
    a.href = 'mailto:' + addr;
    a.title = addr;
    // mailto: does nothing when no mail app is set up, so also copy the
    // address and show it on the button.
    var label = a.querySelector('.email-label');
    var original = label ? label.textContent : '';
    var timer;
    a.addEventListener('click', function () {
      copyText(addr);
      if (!label) return;
      label.textContent = (a.dataset.copied || '') + addr;
      clearTimeout(timer);
      timer = setTimeout(function () { label.textContent = original; }, 4000);
    });
  });
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(function () { legacyCopy(text); });
    } else {
      legacyCopy(text);
    }
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // Experience filter
  var buttons = document.querySelectorAll('.filters button');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      document.querySelectorAll('.t-item').forEach(function (item) {
        item.hidden = !(f === 'all' || item.dataset.kind === f);
      });
    });
  });

  // Highlight the nav link for the section in view
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  if (links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  }
})();
