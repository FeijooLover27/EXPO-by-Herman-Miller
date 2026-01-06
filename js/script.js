/* global gsap, ScrollTrigger, Flip */
(() => {
  // ================================
  // GSAP
  // ================================
  if (typeof gsap === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, Flip);

  // ================================
  // ELEMENTS
  // ================================
  const main = document.querySelector(".hm-product");
  const hero = document.querySelector("#product-hero");

  const bar = document.querySelector("#productBar");

  const viewport = document.querySelector("#carouselViewport");
  const track = document.querySelector("#carouselTrack");

  const swatches = Array.from(document.querySelectorAll(".hm-swatch"));
  const labelEl = document.querySelector(".hm-bar__label");
  const addBtn = document.querySelector("#addToCart");

  if (!main || !hero || !bar || !viewport || !track) return;

  // ================================
  // HELPERS
  // ================================
  const getFramePadPx = () => {
    const frame = document.querySelector(".hm-product__frame");
    return frame ? parseFloat(getComputedStyle(frame).paddingLeft) : 24;
  };

  const getLeftbarWPx = () => {
    const v = getComputedStyle(main).getPropertyValue("--leftbar-w").trim();
    return parseFloat(v) || 240;
  };

  const setContentOffsetInstant = (px) => {
    main.style.setProperty("--content-pl", `${px}px`);
  };

  const animateContentOffset = (toLeft) => {
    const framePad = getFramePadPx();
    const leftW = getLeftbarWPx();
    const target = toLeft ? (leftW + framePad) : framePad;

    gsap.to(main, {
      duration: 0.55,
      ease: "power2.inOut",
      "--content-pl": `${target}px`
    });
  };

  // Estado inicial
  setContentOffsetInstant(getFramePadPx());

  // ================================
  // 1) BAR TRANSITION (BOTTOM -> LEFT) con FLIP
  // ================================
  let isLeft = false;

  function goLeft() {
    if (isLeft) return;
    isLeft = true;

    const flipState = Flip.getState(bar);

    bar.classList.add("is-left");
    main.classList.add("has-leftbar");

    Flip.from(flipState, {
      duration: 0.55,
      ease: "power2.inOut",
      absolute: true
    });

    animateContentOffset(true);
  }

  function goBottom() {
    if (!isLeft) return;
    isLeft = false;

    const flipState = Flip.getState(bar);

    bar.classList.remove("is-left");
    main.classList.remove("has-leftbar");

    Flip.from(flipState, {
      duration: 0.55,
      ease: "power2.inOut",
      absolute: true
    });

    animateContentOffset(false);
  }

  ScrollTrigger.create({
    trigger: hero,
    start: "bottom top+=1",
    onEnter: goLeft,
    onLeaveBack: goBottom
  });

  // Recalcular offsets en resize (y reconstruir carrusel)
  window.addEventListener("resize", () => {
    clearTimeout(window.__hmResizeAllT);
    window.__hmResizeAllT = setTimeout(() => {
      const framePad = getFramePadPx();
      const leftW = getLeftbarWPx();
      setContentOffsetInstant(isLeft ? (leftW + framePad) : framePad);
      buildCarousel();
    }, 120);
  });

  // ================================
  // 2) CAROUSEL LOOP + DRAG
  // ================================
  const loop = {
    x: 0,
    isDragging: false,
    pointerId: null,
    startClientX: 0,
    startX: 0,
    speedPxPerSec: 110,
    loopWidth: 0,
    wrapX: (v) => v
  };

  function measureLoopWidth() {
    const baseItems = Array.from(track.querySelectorAll('[data-base="true"]'));
    const gap = parseFloat(getComputedStyle(track).gap || "0") || 0;

    const widths = baseItems.map(el => el.getBoundingClientRect().width);
    const sum = widths.reduce((acc, w) => acc + w, 0);

    loop.loopWidth = sum + gap * Math.max(0, baseItems.length - 1);
    loop.wrapX = gsap.utils.wrap(-loop.loopWidth, 0);
  }

  function ensureClones() {
    track.querySelectorAll('[data-clone="true"]').forEach(n => n.remove());

    const baseItems = Array.from(track.querySelectorAll('[data-base="true"]'));
    if (!baseItems.length) return;

    const viewportW = viewport.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap || "0") || 0;

    const baseWidth =
      baseItems.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0) +
      gap * Math.max(0, baseItems.length - 1);

    let total = baseWidth;
    while (total < viewportW * 2.2) {
      baseItems.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.dataset.clone = "true";
        clone.removeAttribute("data-base");
        track.appendChild(clone);
      });
      total += baseWidth;
    }
  }

  function applyX() {
    const wrapped = loop.wrapX(loop.x);
    gsap.set(track, { x: wrapped });
  }

  function buildCarousel() {
    loop.x = 0;
    ensureClones();
    measureLoopWidth();
    applyX();
  }

  gsap.ticker.add(() => {
    if (loop.isDragging) return;
    const dt = gsap.ticker.deltaRatio(60);
    const step = (loop.speedPxPerSec / 60) * dt;
    loop.x = loop.wrapX(loop.x - step);
    applyX();
  });

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;

    loop.isDragging = true;
    loop.pointerId = e.pointerId ?? null;
    loop.startClientX = e.clientX;
    loop.startX = loop.x;

    track.classList.add("is-grabbing");
    viewport.setPointerCapture?.(e.pointerId);

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!loop.isDragging) return;
    if (loop.pointerId !== null && e.pointerId !== loop.pointerId) return;

    const dx = e.clientX - loop.startClientX;
    loop.x = loop.wrapX(loop.startX + dx);
    applyX();
  }

  function endDrag(e) {
    if (!loop.isDragging) return;
    if (loop.pointerId !== null && e.pointerId !== loop.pointerId) return;

    loop.isDragging = false;
    loop.pointerId = null;

    track.classList.remove("is-grabbing");
    viewport.releasePointerCapture?.(e.pointerId);
  }

  viewport.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", endDrag, { passive: true });
  window.addEventListener("pointercancel", endDrag, { passive: true });

  window.addEventListener("load", buildCarousel);

  // ================================
  // 3) SWATCHES + swap imágenes opcional
  // ================================
  const imageSets = {
    rosa: ["media/img/productonegro01.jpg", "media/img/productonegro02.jpg", "media/img/productonegro03.jpg"],
    verde: ["media/img/green-01.jpg", "media/img/green-02.jpg", "media/img/green-03.jpg"],
    terracota: ["media/img/terracota-01.jpg", "media/img/terracota-02.jpg", "media/img/terracota-03.jpg"],
    azul: ["media/img/blue-01.jpg", "media/img/blue-02.jpg", "media/img/blue-03.jpg"]
  };

  function swapBaseImages(colorKey) {
    const urls = imageSets[colorKey];
    if (!urls) return;

    const baseImgs = Array.from(track.querySelectorAll('[data-base="true"] img'));
    baseImgs.forEach((img, i) => {
      if (!urls[i]) return;
      img.src = urls[i];
    });

    buildCarousel();
  }

  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const colorKey = btn.dataset.colorKey;
      const colorName = btn.dataset.colorName || "";

      swatches.forEach(b => {
        b.classList.remove("is-active");
        b.setAttribute("aria-checked", "false");
      });

      btn.classList.add("is-active");
      btn.setAttribute("aria-checked", "true");

      if (labelEl) labelEl.textContent = colorName;

      swapBaseImages(colorKey);
    });
  });

  // ================================
  // 4) ADD TO CART (feedback)
  // ================================
  addBtn?.addEventListener("click", () => {
    gsap.fromTo(addBtn, { y: 0 }, { y: -2, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
    const plus = addBtn.querySelector(".hm-add__plus");
    if (plus) gsap.fromTo(plus, { rotate: 0 }, { rotate: 90, duration: 0.18, ease: "power2.out" });
  });
})();
