(function () {
  "use strict";

  const data = window.ZODIAC;
  if (!data) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const ICONS = {
    maps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 3h-2.2C10.1 3 9 4.5 9 7v2H7v3h2v9h3.5v-9H15l.5-3H12.5V7.3c0-.8.2-1.3 1.3-1.3H15V3z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 3c.3 2.4 1.6 4.1 4.3 4.4v2.7c-1.5 0-2.9-.5-4.1-1.3v6.6c0 3.5-2.6 6.1-6.2 6.1S2 18.9 2 15.4c0-3.3 2.5-5.9 5.8-6.1v2.8c-1.7.2-3 1.6-3 3.3 0 1.8 1.5 3.3 3.3 3.3s3.3-1.5 3.3-3.3V3h2.8z"/></svg>'
  };

  function copyText(text) {
    return new Promise(function (resolve) {
      if (!text) return resolve(false);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { resolve(true); }).catch(function () {
          resolve(fallbackCopy(text));
        });
        return;
      }
      resolve(fallbackCopy(text));
    });
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.setAttribute("aria-hidden", "true");
      ta.style.cssText = "position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-show"); }, 1800);
  }

  function flashBtn(btn, doneLabel) {
    if (!btn) return;
    var prev = btn.textContent;
    btn.classList.add("is-done");
    btn.textContent = doneLabel || "Copied ✓";
    setTimeout(function () {
      btn.classList.remove("is-done");
      btn.textContent = prev;
    }, 1600);
  }

  /* ----- render static chrome ----- */
  $$("[data-brand]").forEach(function (el) { el.textContent = data.name; });
  $$("[data-tagline]").forEach(function (el) { el.textContent = data.tagline || "Menu & Official Links"; });

  var menuCount = (data.menu && data.menu.length) || 0;
  var menuMeta = $("[data-menu-meta]");
  if (menuMeta) {
    menuMeta.textContent = menuCount ? (menuCount + " Photos") : "Coming Soon";
  }

  var linksRoot = $("#links");
  if (linksRoot) {
    linksRoot.innerHTML = data.links.map(function (link, i) {
      var pending = !link.url || link.pending;
      var href = pending ? "#" : link.url;
      var icon = ICONS[link.icon] || ICONS.maps;
      var badge = link.badge ? '<span class="badge">' + escapeHtml(link.badge) + "</span>" : "";
      return (
        '<article class="link-card' + (pending ? " is-pending" : "") + '" data-link-index="' + i + '">' +
          '<a class="link-main" href="' + escapeAttr(href) + '"' +
            (pending ? ' role="button"' : ' target="_blank" rel="noopener noreferrer"') + ">" +
            '<span class="brand-icon">' + icon + "</span>" +
            '<span class="link-text">' +
              '<span class="link-title">' + escapeHtml(link.title) + badge + "</span>" +
              '<span class="link-sub">' + escapeHtml(link.subtitle || "") + "</span>" +
            "</span>" +
          "</a>" +
          '<button type="button" class="copy-btn' + (pending ? " is-disabled" : "") + '"' +
            (pending ? " disabled" : "") + ">" + (pending ? (link.badge || "Coming Soon") : "Copy Link") + "</button>" +
        "</article>"
      );
    }).join("");
  }

  var pageUrlEl = $("[data-page-url]");
  if (pageUrlEl) pageUrlEl.textContent = data.pageUrl;

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  /* ----- copy / pending handlers ----- */
  document.addEventListener("click", function (e) {
    var copyBtn = e.target.closest(".copy-btn");
    if (copyBtn && copyBtn.closest(".link-card")) {
      var card = copyBtn.closest(".link-card");
      var link = data.links[Number(card.getAttribute("data-link-index"))];
      if (!link) return;
      if (!link.url || link.pending) {
        toast(link.pendingToast || "This link will be added soon.");
        return;
      }
      copyText(link.url).then(function (ok) {
        if (ok) { flashBtn(copyBtn); toast("Link copied!"); }
        else toast("Couldn't copy. Please long-press the link to copy.");
      });
      return;
    }

    var main = e.target.closest(".link-main");
    if (main && main.closest(".link-card.is-pending")) {
      e.preventDefault();
      var card2 = main.closest(".link-card");
      var link2 = data.links[Number(card2.getAttribute("data-link-index"))];
      toast((link2 && link2.pendingToast) || "This link will be added soon.");
    }
  });

  var shareBtn = $("#share-copy");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      copyText(data.pageUrl).then(function (ok) {
        if (ok) { flashBtn(shareBtn, "Copied ✓"); toast("Page link copied!"); }
        else toast("Couldn't copy the link.");
      });
    });
  }

  /* ----- menu modal + lightbox ----- */
  var modal = $("#menu-modal");
  var lightbox = $("#lightbox");
  var gallery = $("#gallery");
  var chips = $("#chips");
  var lbImg = $("#lb-img");
  var lbCap = $("#lb-cap");
  var lbStage = $("#lb-stage");
  var galleryBuilt = false;
  var filter = "all";
  var visible = [];
  var currentIndex = 0;
  var currentLayer = "none";

  function visibleItems() {
    var items = data.menu || [];
    if (filter === "all") return items.slice();
    return items.filter(function (it) { return it.category === filter; });
  }

  function buildGallery() {
    if (galleryBuilt) return;
    galleryBuilt = true;
    var items = data.menu || [];
    if (!items.length) {
      gallery.innerHTML =
        '<div class="placeholder"><strong>Menu photos coming soon.</strong></div>';
      if (chips) chips.style.display = "none";
      return;
    }
    if (chips && data.categories) {
      chips.innerHTML = data.categories.map(function (c, i) {
        var count = c.id === "all" ? items.length : items.filter(function (it) { return it.category === c.id; }).length;
        return '<button type="button" class="chip' + (i === 0 ? " is-active" : "") + '" data-filter="' + c.id + '">' +
          escapeHtml(c.label) + " (" + count + ")</button>";
      }).join("");
    }
    renderGallery();
  }

  function renderGallery() {
    var items = data.menu || [];
    if (!items.length) return;
    visible = visibleItems();
    gallery.innerHTML = visible.map(function (it) {
      var abs = items.indexOf(it);
      return (
        '<figure class="gallery-item" data-index="' + abs + '">' +
          '<img alt="' + escapeAttr(it.title) + '" data-src="' + escapeAttr(it.src) + '" />' +
          '<figcaption class="gallery-cap"><span class="ttl">' + escapeHtml(it.title) + "</span>" +
          '<span class="idx">' + (abs + 1) + " / " + items.length + "</span></figcaption>" +
        "</figure>"
      );
    }).join("");
    $$(".gallery-item img", gallery).forEach(function (img) {
      img.src = img.getAttribute("data-src");
    });
  }

  function applyLayer(layer, index, push) {
    if (layer === "lightbox") {
      if (currentLayer === "none") openMenu(false);
      showLightbox(index);
    } else if (layer === "menu") {
      hideLightbox();
      openMenu(false);
    } else {
      hideLightbox();
      closeMenu(false);
    }
    currentLayer = layer || "none";
    if (push) {
      var hash = layer === "lightbox" ? ("#photo-" + (index + 1)) : layer === "menu" ? "#menu" : location.pathname + location.search;
      var url = layer === "none" ? (location.pathname + location.search) : hash;
      history.pushState({ layer: layer || "none", index: index || 0 }, "", url);
    }
  }

  function openMenu(push) {
    buildGallery();
    modal.classList.add("is-open");
    document.body.classList.add("no-scroll");
    if (push) applyLayer("menu", 0, true);
    else currentLayer = currentLayer === "lightbox" ? "lightbox" : "menu";
  }

  function closeMenu() {
    modal.classList.remove("is-open");
    if (!lightbox.classList.contains("is-open")) document.body.classList.remove("no-scroll");
  }

  function showLightbox(index) {
    var items = data.menu || [];
    if (!items[index]) return;
    currentIndex = index;
    var it = items[index];
    if (lbImg.getAttribute("src") !== it.src) lbImg.src = it.src;
    lbImg.alt = it.title;
    lbCap.textContent = it.title + "  ·  " + (index + 1) + " / " + items.length;
    lbStage.classList.remove("is-zoomed");
    lightbox.classList.add("is-open");
    document.body.classList.add("no-scroll");
  }

  function hideLightbox() {
    lightbox.classList.remove("is-open");
    lbStage.classList.remove("is-zoomed");
  }

  function requestClose() {
    if (currentLayer === "none") return;
    history.back();
  }

  var menuBtn = $("#menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      if (currentLayer === "none") applyLayer("menu", 0, true);
    });
  }

  var closeMenuBtn = $("#close-menu");
  if (closeMenuBtn) closeMenuBtn.addEventListener("click", requestClose);

  if (chips) {
    chips.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      filter = chip.getAttribute("data-filter") || "all";
      $$(".chip", chips).forEach(function (c) { c.classList.toggle("is-active", c === chip); });
      renderGallery();
    });
  }

  if (gallery) {
    gallery.addEventListener("click", function (e) {
      var item = e.target.closest(".gallery-item");
      if (!item) return;
      var index = Number(item.getAttribute("data-index"));
      applyLayer("lightbox", index, true);
    });
  }

  $("#lb-close") && $("#lb-close").addEventListener("click", requestClose);
  $("#lb-prev") && $("#lb-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
  $("#lb-next") && $("#lb-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
  $("#lb-zoom") && $("#lb-zoom").addEventListener("click", function () {
    lbStage.classList.toggle("is-zoomed");
  });
  if (lbImg) {
    lbImg.addEventListener("click", function (e) {
      e.stopPropagation();
      lbStage.classList.toggle("is-zoomed");
    });
  }

  function step(dir) {
    var items = data.menu || [];
    if (!items.length) return;
    var next = (currentIndex + dir + items.length) % items.length;
    currentIndex = next;
    showLightbox(next);
    history.replaceState({ layer: "lightbox", index: next }, "", "#photo-" + (next + 1));
  }

  /* swipe */
  var startX = 0, startY = 0, tracking = false;
  if (lbStage) {
    lbStage.addEventListener("touchstart", function (e) {
      if (lbStage.classList.contains("is-zoomed")) return;
      var t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY; tracking = true;
    }, { passive: true });
    lbStage.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  document.addEventListener("keydown", function (e) {
    if (currentLayer === "none") return;
    if (e.key === "Escape") { e.preventDefault(); requestClose(); }
    if (currentLayer === "lightbox") {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    }
  });

  window.addEventListener("popstate", function (e) {
    var state = e.state || {};
    var layer = state.layer || "none";
    if (layer === "lightbox") {
      if (!modal.classList.contains("is-open")) openMenu(false);
      showLightbox(state.index || 0);
    } else if (layer === "menu") {
      hideLightbox();
      openMenu(false);
    } else {
      hideLightbox();
      closeMenu();
    }
    currentLayer = layer;
    if (layer === "none") document.body.classList.remove("no-scroll");
  });

  function bootFromHash() {
    var hash = location.hash || "";
    if (hash.indexOf("#photo-") === 0 && data.menu && data.menu.length) {
      var i = parseInt(hash.slice(7), 10) - 1;
      if (isNaN(i) || i < 0 || i >= data.menu.length) i = 0;
      history.replaceState({ layer: "lightbox", index: i }, "", "#photo-" + (i + 1));
      openMenu(false);
      showLightbox(i);
      currentLayer = "lightbox";
    } else if (hash === "#menu") {
      history.replaceState({ layer: "menu", index: 0 }, "", "#menu");
      openMenu(false);
      currentLayer = "menu";
    } else {
      history.replaceState({ layer: "none" }, "", location.pathname + location.search);
      currentLayer = "none";
    }
  }

  bootFromHash();
})();
