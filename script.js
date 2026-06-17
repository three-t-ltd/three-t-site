/* three.T — Kinetic Edition */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- phrase stagger index ---------- */
document.querySelectorAll(".reveal-mask, .hero-title").forEach((group) => {
  group.querySelectorAll(".w > i, .w > em").forEach((el, i) => {
    el.style.setProperty("--i", i);
  });
});

/* ---------- preloader ---------- */
const preloader = document.getElementById("preloader");
const preloaderNum = document.getElementById("preloader-num");
const preloaderFill = document.getElementById("preloader-fill");

const finishLoad = () => {
  document.body.classList.add("is-loaded");
  setTimeout(() => preloader && preloader.remove(), 1400);
};

if (prefersReduced || !preloader) {
  document.body.classList.add("is-loaded");
} else {
  let progress = 0;
  const tick = () => {
    progress = Math.min(100, progress + Math.random() * 17 + 5);
    const shown = Math.floor(progress);
    preloaderNum.textContent = shown;
    preloaderFill.style.width = `${shown}%`;
    if (progress < 100) {
      setTimeout(tick, 90 + Math.random() * 110);
    } else {
      setTimeout(finishLoad, 250);
    }
  };
  tick();
}

/* ---------- text scramble for hero accent ---------- */
const scrambleEl = document.querySelector(".scramble");
if (scrambleEl && !prefersReduced) {
  const finalText = scrambleEl.dataset.text || scrambleEl.textContent;
  const glyphs = "▌▐│┃◢◣╱╲┤├＿——＋×÷=≠《》«»0101";
  let frame = 0;
  const total = 26;
  const run = () => {
    frame += 1;
    const settled = Math.floor((frame / total) * finalText.length);
    let out = "";
    for (let i = 0; i < finalText.length; i += 1) {
      out += i < settled ? finalText[i] : glyphs[Math.floor(Math.random() * glyphs.length)];
    }
    scrambleEl.textContent = out;
    if (frame < total) {
      requestAnimationFrame(run);
    } else {
      scrambleEl.textContent = finalText;
    }
  };
  setTimeout(() => requestAnimationFrame(run), 900);
  // RAFが停止していても（バックグラウンドタブ等）必ず最終テキストに確定させる
  setTimeout(() => { scrambleEl.textContent = finalText; }, 4000);
}

/* ---------- custom cursor ---------- */
if (finePointer && !prefersReduced) {
  const cursor = document.getElementById("cursor");
  const dot = document.getElementById("cursor-dot");
  let cx = -100; let cy = -100; let tx = -100; let ty = -100;

  document.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.left = `${tx}px`;
    dot.style.top = `${ty}px`;
  });
  const loop = () => {
    cx += (tx - cx) * 0.16;
    cy += (ty - cy) * 0.16;
    cursor.style.left = `${cx}px`;
    cursor.style.top = `${cy}px`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener("mousedown", () => cursor.classList.add("is-down"));
  document.addEventListener("mouseup", () => cursor.classList.remove("is-down"));
  document.querySelectorAll("[data-hover], a, button, summary").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
}

/* ---------- hero canvas : forward particle field ---------- */
const canvas = document.getElementById("hero-canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let w = 0; let h = 0; let points = [];
  let mouseX = 0.5; let mouseY = 0.5;
  const DENSITY = 0.00008;

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = prefersReduced ? 0 : Math.floor(w * h * DENSITY);
    points = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0.14 + Math.random() * 0.3,
      vy: (Math.random() - 0.5) * 0.08,
      r: Math.random() < 0.12 ? 2.1 : 1.2,
      green: Math.random() < 0.16
    }));
  };
  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  const LINK = 130;
  const drawStatic = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(183,255,42,0.5)";
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w, h * 0.3);
    ctx.stroke();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const ox = (mouseX - 0.5) * 18;
    const oy = (mouseY - 0.5) * 18;

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x > w + 20) { p.x = -20; p.y = Math.random() * h; }
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const b = points[j];
        const dx = a.x - b.x; const dy = a.y - b.y;
        const dist = dx * dx + dy * dy;
        if (dist < LINK * LINK) {
          const alpha = (1 - Math.sqrt(dist) / LINK) * 0.16;
          ctx.strokeStyle = (a.green || b.green)
            ? `rgba(183,255,42,${alpha * 1.4})`
            : `rgba(245,247,245,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x + ox, a.y + oy);
          ctx.lineTo(b.x + ox, b.y + oy);
          ctx.stroke();
        }
      }
    }
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      ctx.fillStyle = p.green ? "rgba(183,255,42,0.9)" : "rgba(245,247,245,0.45)";
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y + oy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  if (prefersReduced) { drawStatic(); } else { requestAnimationFrame(draw); }
}

/* ---------- header / scroll progress / mobile cta ---------- */
const header = document.getElementById("site-header");
const progressFill = document.getElementById("scroll-progress-fill");
const mobileCta = document.querySelector(".mobile-fixed-cta");
const contactSection = document.getElementById("contact");

const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("is-solid", y > 40);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progressFill && max > 0) progressFill.style.width = `${(y / max) * 100}%`;
  if (mobileCta) {
    const past = y > window.innerHeight * 0.6;
    const nearContact = contactSection &&
      contactSection.getBoundingClientRect().top < window.innerHeight * 0.85;
    mobileCta.classList.toggle("is-visible", past && !nearContact);
  }
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* ---------- mobile menu ---------- */
const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");
menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "メニューを開く" : "メニューを閉じる");
  document.body.classList.toggle("menu-open", !isOpen);
});
mobileNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll(".reveal, .reveal-mask, .result-card").forEach((el) => io.observe(el));

/* ---------- counters ---------- */
const counterIo = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count || 0);
    counterIo.unobserve(el);
    if (prefersReduced) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1500;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.5 });
document.querySelectorAll("[data-count]").forEach((el) => counterIo.observe(el));

/* ---------- story horizontal scroll ---------- */
const story = document.getElementById("story");
const storyTrack = document.getElementById("story-track");
const storyFill = document.getElementById("story-progress-fill");
const storyPanels = storyTrack ? [...storyTrack.querySelectorAll(".story-panel")] : [];
const isDesktop = () => window.innerWidth >= 1024;

const updateStory = () => {
  if (!story || !storyTrack || !isDesktop()) return;
  const rect = story.getBoundingClientRect();
  const total = story.offsetHeight - window.innerHeight;
  const progress = Math.min(1, Math.max(0, -rect.top / total));
  const maxShift = storyTrack.scrollWidth - window.innerWidth + 48;
  if (!prefersReduced) {
    storyTrack.style.transform = `translateX(${-progress * Math.max(0, maxShift)}px)`;
  }
  if (storyFill) storyFill.style.width = `${progress * 100}%`;
  const active = Math.min(storyPanels.length - 1, Math.floor(progress * storyPanels.length));
  storyPanels.forEach((panel, i) => panel.classList.toggle("is-active", i <= active));
};
if (story) {
  window.addEventListener("scroll", updateStory, { passive: true });
  window.addEventListener("resize", updateStory);
  updateStory();
  if (!isDesktop()) storyPanels.forEach((p) => p.classList.add("is-active"));
  window.addEventListener("resize", () => {
    if (!isDesktop()) storyPanels.forEach((p) => p.classList.add("is-active"));
  });
}

/* ---------- process rail progress ---------- */
const processRail = document.querySelector(".process-rail");
if (processRail) {
  const updateRail = () => {
    const rect = processRail.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - rect.top) / (window.innerHeight * 0.6)));
    processRail.style.setProperty("--p", p.toFixed(3));
  };
  window.addEventListener("scroll", updateRail, { passive: true });
  updateRail();
}

/* ---------- giant ghost parallax ---------- */
const ghost = document.querySelector(".giant-ghost");
if (ghost && !prefersReduced) {
  window.addEventListener("scroll", () => {
    const rect = ghost.parentElement.getBoundingClientRect();
    const p = rect.top / window.innerHeight;
    ghost.style.transform = `translateX(${p * 90}px)`;
  }, { passive: true });
}

/* ---------- tilt + glow ---------- */
if (finePointer && !prefersReduced) {
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      card.style.transform =
        `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 5}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  /* ---------- magnetic buttons ---------- */
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.22}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ---------- service modal ---------- */
const SERVICE_DATA = {
  no3: {
    index: "01 / CORE",
    title: "No.3代行",
    desc: "経営者のための伴走型パートナー。企業のNo.3ポジションを担い、経営者の構想を整理し、実行と仕組み化まで一気通貫で前進させます。チームに入り込み、リーダーと共にTeam創りを行います。",
    points: [
      "経営課題の言語化・優先順位づけ",
      "プロジェクト設計と推進管理",
      "経営者と現場のあいだの社内調整・翻訳",
      "業務フロー・役割分担の仕組み化",
      "経営者のスキマづくり（業務負荷を軽減し、戦略に集中できる環境を創る）"
    ],
    cases: ["現在、10社以上の中小企業をパラレルワーク型で継続伴走中"]
  },
  keikaku: {
    index: "02",
    title: "経営計画策定",
    desc: "目標を具体的な数字と行動へ落とし込み、進捗管理の仕組みをつくります。計画書を「つくって終わり」にせず、現場で回る形まで伴走します。",
    points: [
      "5ヵ年・10ヵ年事業計画書の立案",
      "目標の数値化と行動計画への分解",
      "進捗管理の仕組みづくり（定例・見える化）",
      "計画の社内浸透と実行支援"
    ],
    cases: ["機械メーカー｜中長期事業計画書立案"]
  },
  dx: {
    index: "03",
    title: "DX推進",
    desc: "現状業務を可視化し、ツール選定、導入、運用定着まで支援します。導入で止まらず、現場に定着して属人化が解消されるまでが支援範囲です。",
    points: [
      "業務の可視化と課題の整理",
      "ノーコードツール・SaaSの選定と導入（kintone・Notion等）",
      "ITサポート・情報システム改善",
      "運用定着までの伴走と属人化の解消"
    ],
    cases: ["旅行会社｜業務改善支援（kintone導入・仕組み化）"]
  },
  ai: {
    index: "04",
    title: "AI活用",
    desc: "生成AIを日常業務に組み込み、時間短縮と品質向上を実現します。ツール紹介で終わらせず、自社の業務に合わせた活用の型をつくります。",
    points: [
      "生成AIの業務組み込み設計",
      "社内向けAI活用研修・セミナー",
      "AIツールの選定・導入支援",
      "業務効率化・自動化の伴走"
    ],
    cases: [
      "AI×ビジネスセミナーを150回以上開催、延べ25,000人超が参加（AI Dreamers Production共同運営）",
      "Genspark Japan公式アンバサダー（2025年2月〜）"
    ]
  },
  sales: {
    index: "05",
    title: "営業支援",
    desc: "営業戦略、提案資料、案件管理、営業プロセスを改善します。大手機械メーカーでの営業12年の経験を活かし、戦略から商談まで実務で支援します。",
    points: [
      "営業戦略設計（認知拡大〜マーケティング）",
      "Sales代行・営業窓口代行",
      "提案資料づくりと商談支援",
      "SNS・Web・広報を含めた販路開拓"
    ],
    cases: ["製造業｜営業支援（広報・SNS・販路開拓）"]
  },
  saiyo: {
    index: "06",
    title: "採用支援",
    desc: "採用要件、求人設計、母集団形成、選考フローを整えます。採用して終わりではなく、育成・定着まで見据えて設計します。",
    points: [
      "採用要件の整理と求人設計",
      "母集団形成と選考フローの構築",
      "人材育成・定着の支援"
    ],
    cases: []
  },
  shinki: {
    index: "07",
    title: "新規事業立上げ",
    desc: "アイデア整理から検証、事業設計、初期営業まで推進します。既存業務に押し戻されがちな新規事業を、責任者の隣で前に進めます。",
    points: [
      "アイデアの言語化と事業仮説の検証",
      "事業設計・収支計画",
      "初期営業・販路開拓の実行支援"
    ],
    cases: []
  },
  hojokin: {
    index: "08",
    title: "補助金支援",
    desc: "事業計画と投資内容を整理し、活用可能な制度への申請を支援します。補助金ありきではなく、経営計画と一体で設計します。",
    points: [
      "投資計画と事業計画の整理",
      "活用可能な補助金・助成制度の選定",
      "申請書類の作成支援"
    ],
    cases: ["中小企業｜補助金申請支援"]
  },
  team: {
    index: "09",
    title: "チームコンサルティング",
    desc: "「Total Trust with Teams」。リーダーだけでなくフォロワーが育ち、チームでたたかえる組織をつくる、three.Tのメイン領域です。",
    points: [
      "チーム全体のコンサルティング",
      "リーダーとフォロワーの役割設計",
      "マネジメント・組織運営の改善",
      "営業・経理・企画など分野別の個別コンサルティング"
    ],
    cases: []
  }
};

/* ---------- problem (課題) modal data ---------- */
const PROBLEM_DATA = {
  stuck: {
    index: "課題 01",
    title: "やりたいことはある。でも、進まない。",
    desc: "新規事業、DX、採用、組織づくり。重要だと分かっているのに、目の前の業務に追われて構想が頭の中に留まったまま。「いつかやる」が積み上がり、会社の未来に必要な一手が動き出さない状態です。",
    pointsTitle: "よくある状況",
    points: [
      "アイデアはメモやスライドにあるが、着手されないまま数か月が過ぎている",
      "自分が動かないと何も進まず、通常業務との両立で手が回らない",
      "「重要だが緊急ではない」テーマが、毎回後回しになる"
    ],
    solveTitle: "three.Tの打ち手",
    solve: [
      "構想を言語化し、取り組む順番・担当・期限まで一緒に決める",
      "経営参謀として実務を推進し、計画を「動くプロジェクト」に変える",
      "進捗を見える化し、社長が動かなくても前進する状態をつくる"
    ]
  },
  migi: {
    index: "課題 02",
    title: "参謀役がいない",
    desc: "経営者の意図を正しく汲み取り、判断の背景まで理解したうえで実行まで担える人材が社内にいない。だから重要な意思決定や推進を、結局すべて社長一人が抱えてしまう状態です。",
    pointsTitle: "よくある状況",
    points: [
      "相談できる相手がおらず、経営判断を一人で背負っている",
      "指示を出しても意図が伝わりきらず、自分でやり直すことが多い",
      "右腕候補を採用・育成する時間も仕組みもない"
    ],
    solveTitle: "three.Tの打ち手",
    solve: [
      "No.3＝経営参謀として、意図を理解したうえで実行まで担う",
      "経営者と現場のあいだに入り、判断を現場で動く形に翻訳する",
      "属人化させず、社内に参謀機能が残る仕組みづくりまで伴走"
    ]
  },
  saiyo: {
    index: "課題 03",
    title: "採用できない",
    desc: "欲しい人材像が言語化できていなかったり、求人を出しても応募が集まらなかったり。採用活動そのものを回す人手と知見が不足し、組織拡大のボトルネックになっている状態です。",
    pointsTitle: "よくある状況",
    points: [
      "求める人物像や要件が曖昧なまま募集している",
      "求人を出しても応募が集まらない／ミスマッチが多い",
      "選考・面接・フォローまで手が回らず、採用活動が止まりがち"
    ],
    solveTitle: "three.Tの打ち手",
    solve: [
      "採用要件の整理と、魅力が伝わる求人設計",
      "母集団形成と選考フローの構築・運用支援",
      "採用後の育成・定着まで見据えた設計"
    ]
  },
  dx: {
    index: "課題 04",
    title: "DXが進まない",
    desc: "ツールを導入したものの現場に定着しない、属人化が解消されない、何から手をつければいいか分からない。「導入」がゴールになってしまい、業務が本当に楽になっていない状態です。",
    pointsTitle: "よくある状況",
    points: [
      "ツールを入れたが一部の人しか使わず、結局元の業務に戻っている",
      "業務が属人化していて、担当者しか分からない作業が多い",
      "何から着手し、どう社内に広めればいいか分からない"
    ],
    solveTitle: "three.Tの打ち手",
    solve: [
      "現状業務を可視化し、課題の優先順位をつける",
      "ノーコードツール・SaaS（kintone・Notion等）の選定と導入",
      "運用定着まで伴走し、属人化を解消する"
    ]
  },
  shinki: {
    index: "課題 05",
    title: "新規事業を進めたい",
    desc: "新しい挑戦の必要性は感じているが、既存業務が優先されて時間が割けない。任せられる責任者もおらず、アイデアが検証や事業化のフェーズまで進まない状態です。",
    pointsTitle: "よくある状況",
    points: [
      "アイデアはあるが、既存業務に押し戻されて検証まで進まない",
      "新規事業を任せられる責任者・推進役がいない",
      "何をどの順番で進めれば形になるのか整理できていない"
    ],
    solveTitle: "three.Tの打ち手",
    solve: [
      "アイデアの言語化と、事業仮説の検証設計",
      "事業設計・収支計画づくりの伴走",
      "初期営業・販路開拓まで一緒に手を動かして推進"
    ]
  },
  ai: {
    index: "課題 06",
    title: "AIを活用したい",
    desc: "生成AIに興味はあるが、何から始め、どう自社の業務に組み込めばいいか分からない。情報が多すぎて、結局「使えていない」状態のまま時間だけが過ぎていく。",
    pointsTitle: "よくある状況",
    points: [
      "AIを試したいが、自社の業務にどう活かせるか分からない",
      "情報や新ツールが多すぎて、何が自社に合うか判断できない",
      "一部で使い始めたが、社内に広がらず定着しない"
    ],
    solveTitle: "three.Tの打ち手",
    solve: [
      "自社の業務に合わせたAI活用の型を設計",
      "生成AIの業務組み込みと、社内向け研修・浸透支援",
      "時間短縮・品質向上につながる形まで伴走（ADP・Gensparkでの知見を活用）"
    ]
  }
};

const modal = document.getElementById("service-modal");
if (modal) {
  const titleEl = document.getElementById("modal-title");
  const indexEl = document.getElementById("modal-index");
  const descEl = document.getElementById("modal-desc");
  const pointsTitleEl = document.getElementById("modal-points-title");
  const pointsEl = document.getElementById("modal-points");
  const casesTitleEl = document.getElementById("modal-cases-title");
  const casesEl = document.getElementById("modal-cases");
  const caseBlock = document.getElementById("modal-case-block");
  const ctaEl = modal.querySelector(".modal-cta");
  let lastFocus = null;

  const fillModal = (cfg) => {
    indexEl.textContent = cfg.index;
    titleEl.textContent = cfg.title;
    descEl.textContent = cfg.desc;
    pointsTitleEl.textContent = cfg.pointsTitle;
    pointsEl.innerHTML = cfg.points.map((p) => `<li>${p}</li>`).join("");
    if (cfg.subItems && cfg.subItems.length) {
      caseBlock.hidden = false;
      casesTitleEl.textContent = cfg.subTitle;
      casesEl.innerHTML = cfg.subItems.map((c) => `<li>${c}</li>`).join("");
    } else {
      caseBlock.hidden = true;
    }
    ctaEl.firstChild.textContent = cfg.ctaLabel;
  };

  const open = (cfg) => {
    if (!cfg) return;
    lastFocus = document.activeElement;
    fillModal(cfg);
    modal.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add("is-open")));
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close").focus();
  };

  const openService = (key) => {
    const d = SERVICE_DATA[key];
    if (!d) return;
    open({
      index: `SERVICE ${d.index}`, title: d.title, desc: d.desc,
      pointsTitle: "支援内容", points: d.points,
      subTitle: "支援例", subItems: d.cases,
      ctaLabel: "この内容で話を聞いてみる "
    });
  };

  const openProblem = (key) => {
    const d = PROBLEM_DATA[key];
    if (!d) return;
    open({
      index: d.index, title: d.title, desc: d.desc,
      pointsTitle: d.pointsTitle, points: d.points,
      subTitle: d.solveTitle, subItems: d.solve,
      ctaLabel: "この課題を相談してみる "
    });
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    setTimeout(() => { modal.hidden = true; }, 380);
    if (lastFocus) lastFocus.focus();
  };

  document.querySelectorAll(".service-card[data-service]").forEach((card) => {
    card.addEventListener("click", () => openService(card.dataset.service));
  });
  document.querySelectorAll(".problem-card[data-problem]").forEach((card) => {
    card.addEventListener("click", () => openProblem(card.dataset.problem));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProblem(card.dataset.problem); }
    });
  });
  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  ctaEl.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}

/* ---------- note blog: 最新記事を表示 ----------
   1次: 同一ドメインの assets/blog.json（GitHub Actionsが定期更新。CORS/プロキシ不要で全員に安定表示）
   2次: 公開プロキシ経由でnote RSSを直接取得（blog.json欠落時のバックアップ）
   3次: HTMLに焼き込んだ記事をそのまま表示                                  */
const blogGrid = document.getElementById("blog-grid");
if (blogGrid) {
  const RSS = "https://note.com/three_t_ltd/rss";
  const PROXIES = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`
  ];

  const fmtDate = (str) => {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return "";
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  };

  const cardHtml = ({ title, url, date, thumb }) =>
    `<a class="blog-card reveal in-view" href="${url}" target="_blank" rel="noopener" data-hover>
      <div class="blog-thumb">${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ""}</div>
      <div class="blog-body"><time>${date}</time><h3>${title}</h3><span class="blog-more">noteで読む ↗</span></div>
    </a>`;

  const renderItems = (items) => {
    if (!items.length) return false;
    blogGrid.innerHTML = items.slice(0, 6).map(cardHtml).join("");
    return true;
  };

  const extractThumb = (item) => {
    const media = item.querySelector("thumbnail, *|thumbnail");
    if (media && media.getAttribute("url")) return media.getAttribute("url");
    const enc = item.querySelector("enclosure");
    if (enc && enc.getAttribute("url")) return enc.getAttribute("url");
    const content = item.textContent || "";
    const m = content.match(/https?:\/\/assets\.st-note\.com\/[^\s"'<>)]+\.(?:png|jpe?g|webp)[^\s"'<>)]*/i);
    return m ? m[0] : "";
  };

  // 1次: 同一ドメインの blog.json
  const fromJson = async () => {
    try {
      const res = await fetch(`./assets/blog.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data) && renderItems(data);
    } catch (e) { return false; }
  };

  // 2次: プロキシ経由でRSSを直接
  const fromProxy = async () => {
    for (const proxy of PROXIES) {
      try {
        const res = await fetch(proxy(RSS), { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined });
        if (!res.ok) continue;
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "text/xml");
        const items = [...doc.querySelectorAll("item")].slice(0, 6).map((it) => ({
          title: (it.querySelector("title")?.textContent || "").trim(),
          url: (it.querySelector("link")?.textContent || "").trim(),
          date: fmtDate(it.querySelector("pubDate")?.textContent || ""),
          thumb: (extractThumb(it) || "").replace(/width=\d+/, "width=600")
        }));
        if (renderItems(items)) return true;
      } catch (e) { /* 次のプロキシへ */ }
    }
    return false;
  };

  (async () => {
    if (await fromJson()) return;
    if (await fromProxy()) return;
    // どちらも失敗 → HTMLの焼き込み記事をそのまま表示
  })();
}

/* ---------- contact form ---------- */
const form = document.getElementById("contact-form");
if (form) {
  const statusBox = form.querySelector(".form-status");
  const fields = ["name", "company", "email", "company_size", "message"];

  const setError = (input, message) => {
    const label = input.closest("label, fieldset");
    const errorEl = label ? label.querySelector(".field-error") : null;
    if (errorEl) errorEl.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.classList.toggle("is-valid", !message && input.value.trim() !== "");
  };

  const validateField = (input) => {
    const value = input.value.trim();
    if (input.required && !value) {
      setError(input, "入力してください。");
      return false;
    }
    if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(input, "メールアドレスの形式が正しくありません。");
      return false;
    }
    setError(input, "");
    return true;
  };

  const validateTopics = () => {
    const fieldset = form.querySelector("fieldset");
    const checked = form.querySelectorAll('input[name="topic"]:checked').length > 0;
    const errorEl = fieldset.querySelector(".field-error");
    errorEl.textContent = checked ? "" : "1つ以上選択してください。";
    return checked;
  };

  fields.forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) validateField(input);
    });
  });
  form.querySelectorAll('input[name="topic"]').forEach((box) => {
    box.addEventListener("change", validateTopics);
  });

  const showStatus = (type, message) => {
    statusBox.textContent = message;
    statusBox.className = `form-status is-visible is-${type}`;
    statusBox.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;
    fields.forEach((name) => {
      const input = form.elements[name];
      if (input && !validateField(input)) valid = false;
    });
    if (!validateTopics()) valid = false;
    const privacy = form.elements.privacy;
    if (!privacy.checked) {
      valid = false;
      showStatus("error", "プライバシーポリシーへの同意が必要です。");
    }
    if (!valid) return;

    const endpoint = form.dataset.endpoint;
    const submitButton = form.querySelector(".submit-button");

    if (!endpoint) {
      showStatus("success", "入力内容を確認しました。送信先APIが未設定のため、公開前に data-endpoint の設定が必要です。");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "送信中…";
    try {
      const data = new FormData(form);
      data.set("topics", [...form.querySelectorAll('input[name="topic"]:checked')].map((b) => b.value).join(", "));
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error(result.message || `HTTP ${res.status}`);
      form.reset();
      form.querySelectorAll(".is-valid").forEach((el) => el.classList.remove("is-valid"));
      showStatus("success", "お問い合わせありがとうございます。内容を確認のうえ、2営業日以内にご連絡します。");
    } catch (err) {
      showStatus("error", "送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = '話を聞いてみる <span>↗</span>';
    }
  });
}
