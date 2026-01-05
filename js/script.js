/* =========================
   CONFIG “DATOS”
   Cambia aquí títulos, precio y rutas de imágenes.
   ========================= */

const PRODUCT = {
  title: "PRODUCTO",
  edition: "001",
  price: "1000€",

  // IMPORTANTE: el “label” es el texto que sale como NEGRO / etc.
  // “swatch” es el color del rectángulo.
  // “images” es el set que se pinta en el carrusel para ese color.
  variants: [
    {
      id: "negro",
      label: "NEGRO",
      swatch: "#FFBFCC",
      images: [
        "media/img/productonegro01.jpg",
        "media/img/productonegro02.jpg",
        "media/img/productonegro03.jpg",
        "media/img/productonegro04.jpg",
        "media/img/productonegro05.jpg",
        "media/img/productonegro06.jpg",
      ],
    },
    {
      id: "verde",
      label: "VERDE",
      swatch: "#768269",
      images: [
        "media/img/productoverde01.jpg",
        "media/img/productoverde02.jpg",
        "media/img/productoverde03.jpg",
        "media/img/productoverde04.jpg",
        "media/img/productoverde05.jpg",
        "media/img/productoverde06.jpg",
      ],
    },
    {
      id: "arcilla",
      label: "ARCILLA",
      swatch: "#D28068",
      images: [
        "media/img/productoarcilla01.jpg",
        "media/img/productoarcilla02.jpg",
        "media/img/productoarcilla03.jpg",
        "media/img/productoarcilla04.jpg",
        "media/img/productoarcilla05.jpg",
        "media/img/productoarcilla06.jpg",
      ],
    },
    {
      id: "azul",
      label: "AZUL",
      swatch: "#003980",
      images: [
        "media/img/productoazul01.jpg",
        "media/img/productoazul02.jpg",
        "media/img/productoazul03.jpg",
        "media/img/productoazul04.jpg",
        "media/img/productoazul05.jpg",
        "media/img/productoazul06.jpg",
      ],
    },
  ],
};

/* =========================
   ELEMENTOS
   ========================= */
const elTitle = document.getElementById("productTitle");
const elEdition = document.getElementById("editionNumber");
const elPrice = document.getElementById("priceTag");
const elColorLabel = document.getElementById("colorLabel");

const swatchesWrap = document.getElementById("swatches");
const carouselWrap = document.getElementById("carouselWrap");
const track = document.getElementById("carouselTrack");

/* =========================
   ESTADO
   ========================= */
let activeVariant = PRODUCT.variants[0];

let x = 0;
let loopWidth = 0;
let wrapX = (v) => v;

let isDragging = false;
let dragStartX = 0;
let dragStartTrackX = 0;

// velocidad “constante”
const pxPerSecond = 42;

/* =========================
   UTILS
   ========================= */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true }); // no rompas si falta una imagen
      });
    })
  );
}

function setActiveSwatchButton(variantId) {
  const btns = swatchesWrap.querySelectorAll(".swatch");
  btns.forEach((b) => {
    const isActive = b.dataset.variant === variantId;
    b.classList.toggle("is-active", isActive);
    b.setAttribute("aria-selected", String(isActive));
    b.tabIndex = isActive ? 0 : -1;
  });
}

/* =========================
   RENDER
   ========================= */
function renderMeta() {
  elTitle.textContent = PRODUCT.title;
  elEdition.textContent = PRODUCT.edition;
  elPrice.textContent = PRODUCT.price;
}

function renderSwatches() {
  swatchesWrap.innerHTML = "";

  PRODUCT.variants.forEach((v, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.style.background = v.swatch;
    btn.dataset.variant = v.id;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `Color ${v.label}`);
    btn.tabIndex = idx === 0 ? 0 : -1;

    btn.addEventListener("click", () => setVariant(v.id));
    btn.addEventListener("keydown", (e) => {
      // accesible: flechas izquierda/derecha cambian color
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const currentIndex = PRODUCT.variants.findIndex((vv) => vv.id === activeVariant.id);
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const nextIndex = clamp(currentIndex + dir, 0, PRODUCT.variants.length - 1);
      setVariant(PRODUCT.variants[nextIndex].id);
      swatchesWrap.querySelector(`[data-variant="${PRODUCT.variants[nextIndex].id}"]`)?.focus();
    });

    swatchesWrap.appendChild(btn);
  });
}

async function renderCarousel(images) {
  track.innerHTML = "";

  // Duplicamos para loop infinito sin “saltos”
  const list = [...images, ...images];

  list.forEach((src) => {
    const slide = document.createElement("div");
    slide.className = "slide";

    const img = document.createElement("img");
    img.src = src;
    img.alt = PRODUCT.title;
    img.draggable = false;

    slide.appendChild(img);
    track.appendChild(slide);
  });

  await waitForImages(track);
  measureLoop();
  // resetea a una posición limpia
  x = 0;
  gsap.set(track, { x });
}

function measureLoop() {
  // El track tiene 2 bloques iguales => loopWidth es la mitad
  loopWidth = track.scrollWidth / 2;

  // Evita wrap roto si hay 0 (por ejemplo si no cargaron imágenes)
  if (!loopWidth || !Number.isFinite(loopWidth)) {
    loopWidth = 1;
  }

  wrapX = gsap.utils.wrap(-loopWidth, 0);
  x = wrapX(x);
  gsap.set(track, { x });
}

/* =========================
   CAMBIO DE VARIANTE
   ========================= */
async function setVariant(variantId) {
  const v = PRODUCT.variants.find((vv) => vv.id === variantId);
  if (!v || v.id === activeVariant.id) return;

  activeVariant = v;

  elColorLabel.textContent = v.label;
  setActiveSwatchButton(v.id);

  // micro animación al cambiar (limpia y rápida)
  gsap.to(track, { opacity: 0, duration: 0.18, ease: "power1.out" });
  await renderCarousel(v.images);
  gsap.to(track, { opacity: 1, duration: 0.18, ease: "power1.out" });
}

/* =========================
   LOOP AUTO (GSAP ticker)
   ========================= */
function startAutoLoop() {
  gsap.ticker.add(() => {
    if (isDragging) return;

    // deltaRatio(60) -> 1 si estás a 60fps
    const ratio = gsap.ticker.deltaRatio(60);
    const step = (pxPerSecond / 60) * ratio;

    x -= step;
    x = wrapX(x);
    gsap.set(track, { x });
  });
}

/* =========================
   DRAG (sin Draggable plugin)
   ========================= */
function setupDrag() {
  carouselWrap.addEventListener("pointerdown", (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartTrackX = Number(gsap.getProperty(track, "x")) || 0;

    carouselWrap.setPointerCapture?.(e.pointerId);
  });

  carouselWrap.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartX;
    x = wrapX(dragStartTrackX + dx);
    gsap.set(track, { x });
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    carouselWrap.releasePointerCapture?.(e.pointerId);
  };

  carouselWrap.addEventListener("pointerup", endDrag);
  carouselWrap.addEventListener("pointercancel", endDrag);
  carouselWrap.addEventListener("pointerleave", endDrag);
}

/* =========================
   INIT
   ========================= */
async function init() {
  renderMeta();
  renderSwatches();

  // estado inicial
  elColorLabel.textContent = activeVariant.label;
  setActiveSwatchButton(activeVariant.id);

  await renderCarousel(activeVariant.images);

  setupDrag();
  startAutoLoop();

  // responsive: recalcula el loop al redimensionar
  let resizeT;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      measureLoop();
    }, 120);
  });
}

init();
