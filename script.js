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

const modal = document.getElementById("service-modal");
if (modal) {
  const titleEl = document.getElementById("modal-title");
  const indexEl = document.getElementById("modal-index");
  const descEl = document.getElementById("modal-desc");
  const pointsEl = document.getElementById("modal-points");
  const casesEl = document.getElementById("modal-cases");
  const caseBlock = document.getElementById("modal-case-block");
  let lastFocus = null;

  const openModal = (key) => {
    const data = SERVICE_DATA[key];
    if (!data) return;
    lastFocus = document.activeElement;
    indexEl.textContent = `SERVICE ${data.index}`;
    titleEl.textContent = data.title;
    descEl.textContent = data.desc;
    pointsEl.innerHTML = data.points.map((p) => `<li>${p}</li>`).join("");
    if (data.cases.length) {
      caseBlock.hidden = false;
      casesEl.innerHTML = data.cases.map((c) => `<li>${c}</li>`).join("");
    } else {
      caseBlock.hidden = true;
    }
    modal.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add("is-open")));
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close").focus();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    setTimeout(() => { modal.hidden = true; }, 380);
    if (lastFocus) lastFocus.focus();
  };

  document.querySelectorAll(".service-card[data-service]").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.service));
  });
  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });
  modal.querySelector(".modal-cta").addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
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
      const res = await fetch(endpoint, { method: "POST", body: data });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
