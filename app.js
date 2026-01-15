// app.js

// app.js
(() => {
  function pxToRem(px) {
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return px / root;
  }

  // Envuelve el contenido de cada .cell en <span class="cell-text">...</span>
  function ensureCellTextSpan(cell) {
    if (cell.querySelector(".cell-text")) return;

    const hasContent =
      cell.textContent.trim().length > 0 || cell.children.length > 0;
    if (!hasContent) return;

    const span = document.createElement("span");
    span.className = "cell-text";

    // Mueve TODO (incluye <br> y tags) dentro del span
    while (cell.firstChild) span.appendChild(cell.firstChild);
    cell.appendChild(span);
  }

  // Calcula cuánto hay que mover para que el texto toque "abajo del todo" de la celda
  function computeDy(cell) {
    const span = cell.querySelector(".cell-text");
    if (!span) return;

    // Medición segura: quitamos transform temporalmente
    const prevTransform = span.style.transform;
    span.style.transform = "none";

    const cs = getComputedStyle(cell);
    const padTop = parseFloat(cs.paddingTop) || 0;

    // Alto real del texto
    const textHeight = span.getBoundingClientRect().height;

    /**
     * Queremos que el BOTTOM del texto llegue al final de la celda (clientHeight),
     * y el TOP del texto parte desde paddingTop.
     *
     * padTop + dy + textHeight = cell.clientHeight
     * dy = cell.clientHeight - padTop - textHeight
     */
    const dyPx = Math.max(0, cell.clientHeight - padTop - textHeight);

    // Guardamos en rem (para tu criterio de unidades)
    cell.style.setProperty("--dy", `${pxToRem(dyPx)}rem`);

    span.style.transform = prevTransform;
  }

  function refreshAll() {
    document.querySelectorAll(".cell").forEach((cell) => {
      ensureCellTextSpan(cell);
      computeDy(cell);
    });
  }

  function initToggle() {
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.addEventListener("mouseenter", () => {
        computeDy(cell);
        cell.dataset.pos = cell.dataset.pos === "bottom" ? "top" : "bottom";
        if (cell.dataset.pos === "top") cell.removeAttribute("data-pos");
      });

      // Para móvil / tap
      cell.addEventListener("click", () => {
        computeDy(cell);
        cell.dataset.pos = cell.dataset.pos === "bottom" ? "top" : "bottom";
        if (cell.dataset.pos === "top") cell.removeAttribute("data-pos");
      });
    });
  }

  async function boot() {
    refreshAll();
    initToggle();

    // Espera a fuentes para medir bien
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
        refreshAll();
      } catch {}
    }

    // Recalcular al redimensionar
    window.addEventListener("resize", refreshAll);

    // Un frame extra por si el layout tarda
    requestAnimationFrame(refreshAll);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
