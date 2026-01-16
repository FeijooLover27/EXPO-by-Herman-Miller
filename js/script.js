(() => {
  const COLORS = {
    azul: "AZUL",
    rojo: "ROJO",
    terra: "TERRACOTA"
  };

  let loco = null;

  // =========================
  // Locomotive
  // =========================
  function initLocomotive() {
    const el = document.querySelector("[data-scroll-container]");
    if (!el || typeof LocomotiveScroll === "undefined") return;

    loco = new LocomotiveScroll({
      el,
      smooth: true,
      lerp: 0.08,          // <- más bajo = más “pesado”, más alto = más rápido
      multiplier: 1,
      smartphone: { smooth: true, lerp: 0.12 },
      tablet: { smooth: true, lerp: 0.1 },
      getDirection: true,
      getSpeed: true
    });

    document.documentElement.classList.add("has-scroll-smooth");

    // Si algo cambia el layout (cambiar imágenes, vídeos, fonts), refresca
    setTimeout(() => loco.update(), 200);

    window.__loco = loco;
  }

  function refreshLoco() {
    if (!loco) return;
    // update en RAF para evitar jank
    requestAnimationFrame(() => loco.update());
  }

  // =========================
  // Helpers
  // =========================
  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(src);
      im.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
      im.src = src;
    });
  }

  async function swapImage(img, newSrc) {
    if (!newSrc) return;

    const prev = img.dataset.currentSrc || img.src;
    if (prev && prev.endsWith(newSrc)) return;

    gsap.to(img, { autoAlpha: 0, duration: 0.15, ease: "power1.out" });

    try {
      await preloadImage(newSrc);
      img.src = newSrc;
      img.dataset.currentSrc = newSrc;
    } catch (e) {
      console.warn(e.message);
      img.src = prev;
    }

    gsap.to(img, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
  }

  function waitCanPlay(videoEl) {
    return new Promise((resolve) => {
      const done = () => resolve(true);
      videoEl.addEventListener("canplay", done, { once: true });
      setTimeout(done, 800);
    });
  }

  async function swapVideo(videoEl, newSrc) {
    if (!videoEl || !newSrc) return;

    const prev = videoEl.dataset.currentSrc || videoEl.currentSrc || videoEl.src;
    if (prev && prev.endsWith(newSrc)) return;

    gsap.to(videoEl, { autoAlpha: 0, duration: 0.15, ease: "power1.out" });

    try {
      videoEl.src = newSrc;
      videoEl.dataset.currentSrc = newSrc;
      videoEl.load();
      await waitCanPlay(videoEl);
      const p = videoEl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {
      console.warn("Video swap:", e);
      videoEl.src = prev;
      videoEl.load();
    }

    gsap.to(videoEl, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });

    // el alto del video puede cambiar por metadata: refresca loco
    refreshLoco();
  }

  // =========================
  // Color swatches
  // =========================
  async function setColor(colorKey, animate = true) {
    const label = document.getElementById("colorLabel");
    if (label) label.textContent = COLORS[colorKey] || colorKey.toUpperCase();

    const swatches = Array.from(document.querySelectorAll(".swatch"));
    swatches.forEach((btn) => {
      const isActive = btn.dataset.color === colorKey;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    gsap.to(swatches, {
      flexGrow: (i, el) => (el.dataset.color === colorKey ? 4 : 2),
      duration: animate ? 0.35 : 0,
      ease: "power2.out",
      overwrite: true
    });

    const imgs = Array.from(document.querySelectorAll(".slide__img"));
    const imgAttr = `data-src-${colorKey}`;
    await Promise.all(imgs.map((img) => swapImage(img, img.getAttribute(imgAttr))));

    const vids = Array.from(document.querySelectorAll(".color-video"));
    const vidAttr = `data-src-${colorKey}`;
    await Promise.all(vids.map((v) => swapVideo(v, v.getAttribute(vidAttr))));

    refreshLoco();
  }

  function initSwatches() {
    const swatches = Array.from(document.querySelectorAll(".swatch"));
    if (!swatches.length) return;

    swatches.forEach((btn) => {
      btn.addEventListener("click", () => setColor(btn.dataset.color, true));
    });

    const active = swatches.find((b) => b.classList.contains("is-active")) || swatches[0];
    if (active) setColor(active.dataset.color, false);
  }

  // =========================
  // Carousel (no rompe el scroll vertical)
  // =========================
  function waitImagesLoaded(imgs) {
    return Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.addEventListener("load", res, { once: true });
          img.addEventListener("error", res, { once: true });
        });
      })
    );
  }

  function initCarousel() {
    const viewport = document.getElementById("carouselViewport");
    const track = document.getElementById("carouselTrack");
    if (!viewport || !track || typeof gsap === "undefined") return;

    const setX = gsap.quickSetter(track, "x", "px");

    let x = 0;
    let isDragging = false;
    let pointerStart = 0;
    let xStart = 0;

    let loopWidth = 0;
    let wrap = (v) => v;

    const imgs = Array.from(track.querySelectorAll("img"));
    waitImagesLoaded(imgs).then(() => {
      const slides = Array.from(track.children);
      slides.forEach((s) => track.appendChild(s.cloneNode(true)));

      requestAnimationFrame(() => {
        loopWidth = track.scrollWidth / 2;
        wrap = gsap.utils.wrap(-loopWidth, 0);
        x = wrap(x);
        setX(x);
        refreshLoco();
      });
    });

    const speed = 0.35;
    gsap.ticker.add(() => {
      if (!loopWidth) return;
      if (isDragging) return;
      x = wrap(x - speed);
      setX(x);
    });

    viewport.addEventListener("pointerdown", (e) => {
      isDragging = true;
      viewport.classList.add("is-dragging");
      pointerStart = e.clientX;
      xStart = x;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - pointerStart;
      x = wrap(xStart + dx);
      setX(x);
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove("is-dragging");
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("pointerleave", (e) => { if (isDragging) endDrag(e); });

    // wheel: solo horizontal mueve carrusel. vertical -> deja scroll loco
    viewport.addEventListener("wheel", (e) => {
      if (!loopWidth) return;
      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);
      if (ay >= ax) return; // vertical
      e.preventDefault();   // horizontal
      x = wrap(x - e.deltaX * 0.9);
      setX(x);
    }, { passive: false });
  }

  // =========================
  // Boot
  // =========================
  window.addEventListener("load", () => {
    initLocomotive();
    initSwatches();
    initCarousel();

    // Por si cargan fuentes tarde
    setTimeout(() => refreshLoco(), 800);

    // Extra: si el usuario cambia tamaño
    window.addEventListener("resize", () => refreshLoco());
  });
})();
