// 段階2の図解ブロック：画面に入ったら動きを始める（動かなくても最初から最終の形で見えている）
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      if (el.matches('.v2-tri, .v2-cmp')) el.classList.add('play');
      io.unobserve(el);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.v2-tri, .v2-cmp, .v2-do, .v2-filter, .v2-areas .area, .v2-steps li').forEach(function (el) { io.observe(el); });
})();
