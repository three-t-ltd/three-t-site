// 全ページ共通：スマホメニューの開閉と、今いるページのメニューに印を付ける
(function () {
  var btn = document.querySelector('.gh-menu'), drawer = document.getElementById('gh-drawer');
  if (btn && drawer) {
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.querySelector('.sr').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
      drawer.hidden = !open;
      document.body.classList.toggle('gh-open', open);
      if (open) { var first = drawer.querySelector('a'); if (first) first.focus(); }
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) { set(false); btn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 980 && !drawer.hidden) set(false); });
  }
  var norm = function (u) { return u.replace(/index\.html$/, '').replace(/\.html$/, ''); };
  var here = norm(location.pathname);
  document.querySelectorAll('.gh-nav a').forEach(function (a) {
    var href = a.getAttribute('href'); if (href.indexOf('#') !== -1) return;
    var p = norm(href);
    if (p && p !== '/' && (here === p || (p === '/column/' && here.indexOf('/column/') === 0))) a.setAttribute('aria-current', 'page');
  });
})();

(function () {
  var fc = document.querySelector('.mobile-fixed-cta');
  if (!fc) return;
  if (/contact/.test(location.pathname) || document.getElementById('contact-form')) { document.body.classList.add('no-fixed-cta'); return; }
  var band = document.querySelector('.gcta');
  if (band && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { document.body.classList.toggle('gcta-visible', es[0].isIntersecting); }, { threshold: 0.1 }).observe(band);
  }
  document.addEventListener('focusin', function (e) { if (e.target.matches('input, textarea, select')) document.body.classList.add('typing'); });
  document.addEventListener('focusout', function () { document.body.classList.remove('typing'); });
})();

(function () {
  var last = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (Math.abs(y - last) > 6) { document.body.classList.toggle('scroll-up', y < last); last = y; }
  }, { passive: true });
})();

// ページ内リンク（#story など）で畳まれた区画に来たら、自動で開く
(function () {
  function openFor(hash) {
    if (!hash || hash.length < 2) return;
    var t = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!t) return;
    var d = t.closest('details') || t.querySelector('details.fold');
    if (d && !d.open) { d.open = true; t.scrollIntoView(); }
  }
  openFor(location.hash);
  window.addEventListener('hashchange', function () { openFor(location.hash); });
})();
