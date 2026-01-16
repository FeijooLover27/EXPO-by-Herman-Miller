(() => {
  const COLORS = {
    azul: "AZUL",
    rojo: "ROJO",
    terra: "TERRACOTA"
  };

  const hasGSAP = typeof gsap !== "undefined";
  const mqMobile = window.matchMedia("(max-width: 767.98px)");

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

    if (hasGSAP) gsap.to(img, { autoAlpha: 0, duration: 0.15, ease: "power1.out" });
    else img.style.opacity = "0";

    try {
      await preloadImage(newSrc);
      img.src = newSrc;
      img.dataset.currentSrc = newSrc;
    } catch (e) {
      console.warn(e.message);
      img.src = prev;
    }

    if (hasGSAP) gsap.to(img, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
    else img.style.opacity = "1";
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

    if (hasGSAP) gsap.to(videoEl, { autoAlpha: 0, duration: 0.15, ease: "power1.out" });
    else videoEl.style.opacity = "0";

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

    if (hasGSAP) gsap.to(videoEl, { autoAlpha: 1, duration: 0.2, ease: "power1.out" });
    else videoEl.style.opacity = "1";
  }

  async function setColor(colorKey, animate = true) {
    const label = document.getElementById("colorLabel");
    if (label) label.textContent = COLORS[colorKey] || colorKey.toUpperCase();

    const swatches = Array.from(document.querySelectorAll(".swatch"));
    swatches.forEach((btn) => {
      const isActive = btn.dataset.color === colorKey;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    // IMPORTANT: en móvil NO tocamos flex-grow (si no, pasa lo de tu captura)
    const isMobile = mqMobile.matches;

    if (!isMobile && hasGSAP) {
      gsap.to(swatches, {
        flexGrow: (i, el) => (el.dataset.color === colorKey ? 4 : 2),
        duration: animate ? 0.35 : 0,
        ease: "power2.out",
        overwrite: true
      });
    } else {
      // limpia cualquier inline style que haya dejado GSAP antes
      swatches.forEach((el) => {
        el.style.flexGrow = "";
      });
    }

    const imgs = Array.from(document.querySelectorAll(".swap-img"));
    const imgAttr = `data-src-${colorKey}`;
    await Promise.all(imgs.map((img) => swapImage(img, img.getAttribute(imgAttr))));

    const vids = Array.from(document.querySelectorAll(".color-video"));
    const vidAttr = `data-src-${colorKey}`;
    await Promise.all(vids.map((v) => swapVideo(v, v.getAttribute(vidAttr))));
  }

  function initSwatches() {
    const swatches = Array.from(document.querySelectorAll(".swatch"));
    if (!swatches.length) return;

    swatches.forEach((btn) => btn.addEventListener("click", () => setColor(btn.dataset.color, true)));

    const active = swatches.find((b) => b.classList.contains("is-active")) || swatches[0];
    if (active) setColor(active.dataset.color, false);
  }

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
    if (!viewport || !track || !hasGSAP) return;

    const mq = window.matchMedia("(max-width: 767.98px)");
    const setX = gsap.quickSetter(track, "x", "px");

    function purgeClones() {
      track.querySelectorAll('[data-carousel-clone="1"]').forEach((n) => n.remove());
      Array.from(track.children).forEach((n) => {
        if (!n.dataset.carouselOriginal) n.dataset.carouselOriginal = "1";
      });
    }

    let cleanup = () => {};

    function setupDesktopLoop() {
      purgeClones();

      let cancelled = false;

      let x = 0;
      let isDragging = false;
      let pointerStart = 0;
      let xStart = 0;

      let loopWidth = 0;
      let wrap = (v) => v;

      const imgs = Array.from(track.querySelectorAll("img"));
      waitImagesLoaded(imgs).then(() => {
        if (cancelled) return;

        const slides = Array.from(track.children).filter((n) => n.dataset.carouselOriginal === "1");
        slides.forEach((s) => {
          const c = s.cloneNode(true);
          c.dataset.carouselClone = "1";
          track.appendChild(c);
        });

        requestAnimationFrame(() => {
          if (cancelled) return;
          loopWidth = track.scrollWidth / 2;
          wrap = gsap.utils.wrap(-loopWidth, 0);
          x = wrap(x);
          setX(x);
        });
      });

      const speed = 0.35;
      const tick = () => {
        if (!loopWidth) return;
        if (isDragging) return;
        x = wrap(x - speed);
        setX(x);
      };
      gsap.ticker.add(tick);

      const onDown = (e) => {
        isDragging = true;
        viewport.classList.add("is-dragging");
        pointerStart = e.clientX;
        xStart = x;
        viewport.setPointerCapture(e.pointerId);
      };

      const onMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - pointerStart;
        x = wrap(xStart + dx);
        setX(x);
      };

      const endDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        viewport.classList.remove("is-dragging");
        try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      };

      const onWheel = (e) => {
        if (!loopWidth) return;

        const ax = Math.abs(e.deltaX);
        const ay = Math.abs(e.deltaY);
        const wantsHorizontal = e.shiftKey || ax > ay * 1.2;
        if (!wantsHorizontal) return;

        e.preventDefault();
        const move = (e.shiftKey ? e.deltaY : e.deltaX) * 0.9;
        x = wrap(x - move);
        setX(x);
      };

      viewport.addEventListener("pointerdown", onDown);
      viewport.addEventListener("pointermove", onMove);
      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
      viewport.addEventListener("pointerleave", (e) => { if (isDragging) endDrag(e); });
      viewport.addEventListener("wheel", onWheel, { passive: false });

      return () => {
        cancelled = true;
        gsap.ticker.remove(tick);
        viewport.classList.remove("is-dragging");

        viewport.removeEventListener("pointerdown", onDown);
        viewport.removeEventListener("pointermove", onMove);
        viewport.removeEventListener("pointerup", endDrag);
        viewport.removeEventListener("pointercancel", endDrag);
        viewport.removeEventListener("wheel", onWheel);

        purgeClones();
        setX(0);
      };
    }

    function setupMobileSingle() {
      purgeClones();
      setX(0);

      const slides = Array.from(track.children).filter((n) => n.dataset.carouselOriginal === "1");
      if (slides.length <= 1) return () => {};

      let index = 0;
      let vw = viewport.clientWidth;

      let timer = null;
      let dragging = false;
      let startX = 0;
      let baseX = 0;

      const updateVW = () => {
        vw = viewport.clientWidth || vw;
        setX(-index * vw);
      };

      const goTo = (i, animate = true) => {
        const n = slides.length;
        index = ((i % n) + n) % n;

        gsap.killTweensOf(track);
        if (!animate) {
          setX(-index * vw);
          return;
        }
        gsap.to(track, {
          x: -index * vw,
          duration: 0.65,
          ease: "power2.inOut",
          overwrite: true
        });
      };

      const startAuto = () => {
        stopAuto();
        timer = setInterval(() => goTo(index + 1, true), 3200);
      };

      const stopAuto = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };

      const onDown = (e) => {
        dragging = true;
        viewport.classList.add("is-dragging");
        startX = e.clientX;
        baseX = -index * vw;

        stopAuto();
        gsap.killTweensOf(track);
        viewport.setPointerCapture(e.pointerId);
      };

      const onMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        setX(baseX + dx);
      };

      const onUp = (e) => {
        if (!dragging) return;
        dragging = false;
        viewport.classList.remove("is-dragging");

        const dx = e.clientX - startX;
        const threshold = vw * 0.18;

        try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}

        if (dx < -threshold) goTo(index + 1, true);
        else if (dx > threshold) goTo(index - 1, true);
        else goTo(index, true);

        startAuto();
      };

      window.addEventListener("resize", updateVW);
      viewport.addEventListener("pointerdown", onDown);
      viewport.addEventListener("pointermove", onMove);
      viewport.addEventListener("pointerup", onUp);
      viewport.addEventListener("pointercancel", onUp);
      viewport.addEventListener("pointerleave", (e) => { if (dragging) onUp(e); });

      goTo(0, false);
      startAuto();

      return () => {
        stopAuto();
        window.removeEventListener("resize", updateVW);

        viewport.classList.remove("is-dragging");
        viewport.removeEventListener("pointerdown", onDown);
        viewport.removeEventListener("pointermove", onMove);
        viewport.removeEventListener("pointerup", onUp);
        viewport.removeEventListener("pointercancel", onUp);

        gsap.killTweensOf(track);
        setX(0);
      };
    }

    const applyMode = () => {
      cleanup();
      cleanup = mq.matches ? setupMobileSingle() : setupDesktopLoop();
    };

    applyMode();

    if (typeof mq.addEventListener === "function") mq.addEventListener("change", applyMode);
    else if (typeof mq.addListener === "function") mq.addListener(applyMode);
  }

  window.addEventListener("load", () => {
    initSwatches();
    initCarousel();
  });
})();
