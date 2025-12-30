(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const eq = params.get("eq") || ""; // ✅ STEP 3: equipment id from URL

  if (!id || !window.FORMS || !window.FORMS[id]) {
    document.body.innerHTML =
      '<div style="background:#b60000;color:white;padding:40px;font-family:Arial">' +
      "<h2>Invalid or missing form ID</h2>" +
      "<p>Example: <code>form.html?id=rif</code></p>" +
      "</div>";
    return;
  }

  const cfg = window.FORMS[id];

  document.title = cfg.title || "Form";
  document.getElementById("page-title").textContent = cfg.title || "";
  document.getElementById("section-title").textContent = cfg.sectionTitle || "";

  // ✅ STEP 3: show equipment label (if element exists in form.html)
  const eqLabel = document.getElementById("eqLabel");
  if (eqLabel) eqLabel.textContent = eq ? `Equipment: ${eq}` : "";

  if (cfg.backgroundImage) {
    document.body.style.backgroundImage = `url("${cfg.backgroundImage}")`;
  }

  const buttonsWrap = document.getElementById("buttonsWrap");
  const buttonsEl = document.getElementById("buttons");
  const mediaEl = document.getElementById("media");

  function markDone() {
    if (cfg.completedKey) localStorage.setItem(cfg.completedKey, "true");
  }

  // ===== EMBED MODE (kept for other pages if you use it) =====
  if (cfg.embedUrl) {
    buttonsWrap.style.display = "none";
    mediaEl.style.display = "block";
    mediaEl.innerHTML = `<iframe class="embed" src="${cfg.embedUrl}" title="${cfg.title || ""}"></iframe>`;
    markDone();
    return;
  }

  // ===== IMAGE MODE + OPTIONAL MAGNIFIER =====
  if (cfg.imageUrl) {
    buttonsWrap.style.display = "none";
    mediaEl.style.display = "block";

    // Fast render: show image inline
    mediaEl.innerHTML = `
      <img id="mainImg" src="${cfg.imageUrl}" alt="${cfg.title || "Image"}" style="max-width:100%;border-radius:18px;cursor:zoom-in;">
      <div style="margin-top:12px;">
        <a class="btn" href="${cfg.imageUrl}" target="_blank" rel="noopener noreferrer">Open Image in New Tab</a>
      </div>
    `;

    markDone();

    // If magnifier enabled, open modal + lens on click (fast, no iframe)
    if (cfg.magnifier) {
      const img = document.getElementById("mainImg");
      const zoom = Number(cfg.zoom || 4);

      // Build modal once
      const modal = document.createElement("div");
      modal.className = "nx-modal";
      modal.innerHTML = `
        <div class="nx-modal-content">
          <button class="nx-return-home" type="button">Return to Home</button>
          <button class="nx-close" type="button" aria-label="Close">&times;</button>
          <img id="nxModalImg" src="${cfg.imageUrl}" alt="${cfg.title || "Image"}">
          <div class="nx-magnifier" id="nxMagnifier"></div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector(".nx-close");
      const homeBtn = modal.querySelector(".nx-return-home");
      const modalImg = modal.querySelector("#nxModalImg");
      const magnifier = modal.querySelector("#nxMagnifier");

      let moveFn = null;

      function getCursorPos(e) {
        const a = modalImg.getBoundingClientRect();
        const pageX = (e.touches && e.touches[0]) ? e.touches[0].pageX : e.pageX;
        const pageY = (e.touches && e.touches[0]) ? e.touches[0].pageY : e.pageY;
        const x = pageX - a.left - window.pageXOffset;
        const y = pageY - a.top - window.pageYOffset;
        return { x, y };
      }

      function magnify(imgEl, z) {
        const glass = magnifier;
        const bw = 6;

        const iw = imgEl.width;
        const ih = imgEl.height;

        glass.style.backgroundImage = `url('${imgEl.src}')`;
        glass.style.backgroundRepeat = "no-repeat";
        glass.style.backgroundSize = (iw * z) + "px " + (ih * z) + "px";
        glass.style.display = "block";

        const w = glass.offsetWidth / 2;
        const h = glass.offsetHeight / 2;

        moveFn = function (e) {
          e.preventDefault();
          const pos = getCursorPos(e);
          let x = pos.x;
          let y = pos.y;

          if (x > iw - (w / z)) x = iw - (w / z);
          if (x < w / z) x = w / z;
          if (y > ih - (h / z)) y = ih - (h / z);
          if (y < h / z) y = h / z;

          glass.style.left = (x - w) + "px";
          glass.style.top = (y - h) + "px";
          glass.style.backgroundPosition =
            "-" + ((x * z) - w + bw) + "px -" + ((y * z) - h + bw) + "px";
        };

        imgEl.addEventListener("mousemove", moveFn, { passive: false });
        glass.addEventListener("mousemove", moveFn, { passive: false });
        imgEl.addEventListener("touchmove", moveFn, { passive: false });
      }

      function removeMagnifier() {
        magnifier.style.display = "none";
        if (moveFn) {
          modalImg.removeEventListener("mousemove", moveFn);
          magnifier.removeEventListener("mousemove", moveFn);
          modalImg.removeEventListener("touchmove", moveFn);
          moveFn = null;
        }
      }

      function openModal() {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        requestAnimationFrame(() => magnify(modalImg, zoom));
      }

      function closeModal() {
        modal.style.display = "none";
        document.body.style.overflow = "";
        removeMagnifier();
      }

      img.addEventListener("click", openModal);
      closeBtn.addEventListener("click", closeModal);

      homeBtn.addEventListener("click", () => {
        closeModal();
        window.location.href = "index.html";
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") closeModal();
      });
    }

    return;
  }

  // ===== BUTTON MODE =====
  buttonsWrap.style.display = "inline-block";
  mediaEl.style.display = "none";
  buttonsEl.innerHTML = "";

  (cfg.buttons || []).forEach((b) => {
    const a = document.createElement("a");
    a.className = "btn";
    a.textContent = b.text || "Open";
    a.href = b.href || "#";

    // ✅ Carry eq through internal links created in config (e.g. "?id=transformer")
    if (eq) {
      // If config uses "?id=xyz" (internal jump)
      if (typeof b.href === "string" && b.href.startsWith("?id=")) {
        a.href = `form.html${b.href}&eq=${encodeURIComponent(eq)}`;
      }

      // If config uses "form.html?id=xyz"
      if (a.href.includes("form.html?id=")) {
        const u = new URL(a.href, location.href);
        u.searchParams.set("eq", eq);
        a.href = u.pathname + u.search;
      }
    }

    if (/^https?:\/\//i.test(a.href)) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }

    a.addEventListener("click", markDone);
    buttonsEl.appendChild(a);
  });
})();
