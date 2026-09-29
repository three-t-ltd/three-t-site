(function(){
  // 旧トップ内の場所（/#about など）で来た人を、移設先のページへ案内する
  var MOVE={"about": "/no3.html#about", "beforeafter": "/no3.html#beforeafter", "story": "/no3.html#story", "results": "/no3.html#results", "profile": "/no3.html#profile", "mind": "/no3.html#mind", "services": "/services.html", "process": "/services.html#process", "contact": "/contact.html", "topics": "/column/", "column": "/column/"};
  var h=location.hash.replace('#','');
  if(MOVE[h]){ location.replace(MOVE[h]); }
})();

(function(){
  // 三角形のアニメーションをもう一度再生
  var btn=document.getElementById('replay'), tri=document.getElementById('tri');
  btn.addEventListener('click',function(){
    tri.querySelectorAll('.drop,.tri-fill').forEach(function(el){
      var c=el.getAttribute('class'); el.setAttribute('class',''); void el.getBBox(); el.setAttribute('class',c);
    });
  });



  // ===== オープニング動画 =====
  var intro=document.getElementById('intro'), iv=document.getElementById('introVideo'),
      isound=document.getElementById('introSound'), iskip=document.getElementById('introSkip'),
      ibar=document.getElementById('introBar'), hero=document.querySelector('.hero');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function seen(){ try{ return sessionStorage.getItem('introSeen')==='1'; }catch(e){ return false; } }
  function markSeen(){ try{ sessionStorage.setItem('introSeen','1'); }catch(e){} }
  var closing=false;
  function closeIntro(){
    if(closing||intro.hidden) return; closing=true; markSeen();
    intro.classList.add('out'); document.body.classList.remove('intro-open');
    ['main','header','footer'].forEach(function(t){ var el=document.querySelector(t); if(el) el.inert=false; }); clearTimeout(window.__introGuard);
    hero.classList.remove('wait');
    setTimeout(function(){ iv.pause(); intro.hidden=true; intro.classList.remove('out'); closing=false; },900);
  }
  // 縦長の画面（スマホ縦持ち）では縦型、それ以外は横型
  var portrait=window.matchMedia('(max-aspect-ratio: 4/5)').matches;
  function openIntro(withSound){
    if(!iv.getAttribute('src')){ iv.poster=portrait?'/assets/reel-poster-v.jpg':'/assets/reel-poster.jpg'; iv.src=portrait?'/assets/reel-v.mp4':'/assets/reel.mp4'; }
    intro.hidden=false; document.body.classList.add('intro-open'); hero.classList.add('wait');
    ['main','header','footer'].forEach(function(t){ var el=document.querySelector(t); if(el) el.inert=true; });
    // 4秒たっても再生が始まらない（回線が遅い等）ときは、待たせずに本文へ
    clearTimeout(window.__introGuard); window.__introGuard=setTimeout(function(){ if(iv.currentTime<0.1) closeIntro(); },4000);
    iv.currentTime=0; iv.muted=!withSound;
    function label(){ isound.textContent=iv.muted?'音を出す':'音を消す'; isound.setAttribute('aria-pressed',String(!iv.muted)); isound.classList.toggle('pulse',iv.muted); }
    label();
    // 音つきで再生を試す → ブラウザに止められたら音なしで続け、「音を出す」を点滅 → それも止められたらホームページへ
    var p=iv.play();
    if(p&&p.catch) p.catch(function(){
      if(iv.muted){ closeIntro(); return; }
      iv.muted=true; label();
      var p2=iv.play(); if(p2&&p2.catch) p2.catch(function(){ closeIntro(); });
    });
    iskip.focus({preventScroll:true});
  }
  iv.addEventListener('ended',closeIntro);
  // 再生途中で8秒以上止まったら本文へ
  var stallT; iv.addEventListener('waiting',function(){ clearTimeout(stallT); stallT=setTimeout(function(){ if(!intro.hidden) closeIntro(); },8000); });
  iv.addEventListener('playing',function(){ clearTimeout(stallT); });
  if(window.matchMedia('(pointer: coarse)').matches){ document.getElementById('introHint').textContent='タップでホームページへ'; }
  iv.addEventListener('timeupdate',function(){ if(iv.duration) ibar.style.width=(iv.currentTime/iv.duration*100)+'%'; });
  intro.addEventListener('click',function(e){ if(e.target===isound) return; closeIntro(); });
  isound.addEventListener('click',function(e){
    e.stopPropagation(); iv.muted=!iv.muted; isound.classList.remove('pulse');
    isound.textContent=iv.muted?'音を出す':'音を消す'; isound.setAttribute('aria-pressed',String(!iv.muted));
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!intro.hidden) closeIntro(); });
  document.getElementById('replayIntro').addEventListener('click',function(){ window.scrollTo(0,0); openIntro(true); });
  // 1回の訪問で1回だけ。ページ内リンクで来たとき・動きを減らす設定のときは流さない
  if(!reduce && !seen() && !location.hash){ openIntro(true); }


  // ===== noteの最新3件（GitHub Actionsが毎日更新する /assets/blog.json） =====
  fetch('/assets/blog.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(list){
    var ul=document.getElementById('blogList'); if(!ul||!Array.isArray(list)) return;
    list.slice(0,6).forEach(function(p){
      var li=document.createElement('li'), a=document.createElement('a');
      a.href=p.url; a.target='_blank'; a.rel='noopener';
      if(p.thumb){ var img=document.createElement('img'); img.src=p.thumb; img.alt=''; img.loading='lazy'; a.appendChild(img); }
      var t=document.createElement('time'); t.textContent=p.date||''; a.appendChild(t);
      var s=document.createElement('span'); s.textContent=p.title||''; a.appendChild(s);
      li.appendChild(a); ul.appendChild(li);
    });
  }).catch(function(){});

  // ===== スクロール登場 =====
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mark(sel,cls,stagger){
    document.querySelectorAll(sel).forEach(function(el,i){
      el.classList.add('rv'); if(cls) el.classList.add(cls);
      if(stagger) el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentNode.children, el));
    });
  }
  mark('.sec-head h2');
  mark('.sec-head p');
  mark('.imp li','pop',true);
  mark('.manga figure',null,true);
  mark('.stop',null,true);
  mark('.area',null,true);
  mark('.tags a','pop',true);
  mark('.num','pop',true);
  mark('.card',null,true);
  mark('.faq details',null,true);
  mark('.cta-box',null);
  mark('.desk',null);
  if(!reduce && 'IntersectionObserver' in window){
    var vh=window.innerHeight;
    var rio=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.remove('pre'); rio.unobserve(e.target); } });
    },{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.rv').forEach(function(el){
      if(el.getBoundingClientRect().top>vh){ el.classList.add('pre'); rio.observe(el); }
    });
    // 念のため：何かで発火しなくても3秒後以降のスクロールで必ず見せる
    window.addEventListener('scroll',function(){ document.querySelectorAll('.rv.pre').forEach(function(el){ if(el.getBoundingClientRect().top<window.innerHeight) el.classList.remove('pre'); }); },{passive:true});
    // 三角形：画面に入った瞬間に No.3 を落とす
    var tio=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ btn.click(); tio.disconnect(); } },{threshold:.5});
    tio.observe(tri);
  }

  // 道のり：スクロール量に合わせて車を進め、通過した地点を点灯
  var road=document.getElementById('road'), stops=road.querySelectorAll('.stop');
  function onScroll(){
    var r=road.getBoundingClientRect(), vh=window.innerHeight;
    var p=(vh*0.75-r.top)/(r.height+vh*0.25);
    p=Math.max(0,Math.min(1,p));
    road.style.setProperty('--p',p.toFixed(3));
    stops.forEach(function(s,i){ s.classList.toggle('on', p>=i/(stops.length-1)-0.02); });
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);
  onScroll();

  // 数字のカウントアップ（静止状態では最終値を表示）
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return; io.unobserve(e.target);
        var b=e.target, to=+b.dataset.to, unit=b.querySelector('small').outerHTML, t0=null;
        function f(t){ if(!t0)t0=t; var k=Math.min(1,(t-t0)/900); b.innerHTML=Math.round(to*k)+unit; if(k<1)requestAnimationFrame(f); }
        requestAnimationFrame(f);
      });
    },{threshold:.6});
    document.querySelectorAll('.num b').forEach(function(b){ io.observe(b); });
  }
})();
