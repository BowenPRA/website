// Palm River Academy — small helpers. No framework.

(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile nav sheet
  var toggle = document.querySelector(".menu-toggle");
  var sheet = document.getElementById("sheet");
  function setSheet(open) {
    toggle.setAttribute("aria-expanded", String(open));
    sheet.hidden = !open;
    document.body.classList.toggle("sheet-open", open);
  }
  if (toggle && sheet) {
    toggle.addEventListener("click", function () {
      setSheet(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) { setSheet(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && !sheet.hidden) setSheet(false);
    });
  }

  // Header: firmer shadow once scrolled; slides away on the way down, back on the way up.
  // The floating contact button (phones) appears once the hero is behind you.
  var header = document.querySelector(".site-header");
  var floatCta = document.querySelector(".float-cta");
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      var menuOpen = sheet && !sheet.hidden;
      var focusInside = header.contains(document.activeElement) && document.activeElement !== document.body;
      if (y > lastY + 4 && y > 320 && !menuOpen && !focusInside) header.classList.add("is-hidden");
      else if (y < lastY - 4 || y < 320) header.classList.remove("is-hidden");
    }
    if (floatCta) floatCta.classList.toggle("is-shown", y > window.innerHeight * 0.5);
    lastY = y;
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  if (header) header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  onScroll();

  // Yearbook film: the big play button starts the video and gets out of the way
  document.querySelectorAll(".film__player").forEach(function (player) {
    var video = player.querySelector("video");
    var play = player.querySelector(".film__play");
    if (!video || !play) return;
    video.controls = false; // the poster stays clean; the browser controls come back once the film starts
    play.addEventListener("click", function () { video.play(); });
    video.addEventListener("play", function () { player.classList.add("is-playing"); video.controls = true; });
    video.addEventListener("ended", function () { player.classList.remove("is-playing"); });
  });

  // Photos fade in over a shimmer while they load
  document.querySelectorAll(".photo img").forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    var box = img.parentElement;
    box.classList.add("is-loading");
    function done() { box.classList.remove("is-loading"); }
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });

  // Count-up numbers (stats band)
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.textContent.replace(/^[\d\s]+/, "");
    if (reduceMotion || !target) return;
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / 1400, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    el.textContent = "0" + suffix;
    window.requestAnimationFrame(step);
  }

  // Scroll reveal. Only things that start below the fold get hidden, so nothing flashes,
  // and without JS (or with reduced motion) everything is simply there.
  var revealSelector = [
    "main section .center.narrow", ".two > *", ".method > *", ".cards > *", ".tiles > *",
    // on phones the gallery is a swipe strip, so it rises as one piece instead of photo by photo
    window.innerWidth < 720 ? ".gallery" : ".gallery > *",
    ".values > li", ".steps > li", ".team > li", ".stats > *", ".cal > *", ".programs > *", ".notices > li",
    ".faq details", ".table-wrap", ".picker__chips", ".cta__inner", ".faq h2",
    ".dayplan__row", ".daynotes > li", ".stages > *", ".dayline li"
  ].join(",");
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
        e.target.querySelectorAll("[data-count]").forEach(countUp);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

    var fold = window.innerHeight * 0.92;
    document.querySelectorAll(revealSelector).forEach(function (el) {
      if (el.getBoundingClientRect().top < fold) return;
      var siblings = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty("--i", String(Math.min(siblings, 5)));
      el.classList.add("reveal");
      io.observe(el);
    });

    // counters that were already on screen, or not inside a revealed block
    counters.forEach(function (c) {
      if (c.closest(".reveal")) return;
      var once = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { countUp(c); once.disconnect(); }
      }, { threshold: 0.5 });
      once.observe(c);
    });
  }

  // Age picker (Academics overview)
  var picker = document.querySelector("[data-picker]");
  if (picker) {
    var chips = picker.querySelectorAll(".chip");
    var grid = picker.querySelector(".programs");
    var cards = grid.querySelectorAll(".program");
    function pop(c) { c.classList.remove("pop", "reveal"); void c.offsetWidth; c.classList.add("pop"); }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var key = chip.getAttribute("data-key");
        var already = chip.getAttribute("aria-pressed") === "true";
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        if (already) {
          cards.forEach(function (c) { c.hidden = false; pop(c); });
          grid.classList.remove("is-filtered");
          return;
        }
        chip.setAttribute("aria-pressed", "true");
        cards.forEach(function (c) {
          c.hidden = c.getAttribute("data-key") !== key;
          if (!c.hidden) pop(c);
        });
        grid.classList.add("is-filtered");
      });
    });
  }

  // One lightbox, shared by the photo galleries and the staff cards. A "set" is
  // just a list of <img> elements; opening one takes over the arrows and swipes,
  // so each gallery and each member stays its own run of photos.
  var lightbox = null;
  function useLightbox() {
    if (lightbox || typeof HTMLDialogElement !== "function") return lightbox;
    var icon = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    var box = document.createElement("dialog");
    box.className = "lightbox";
    box.setAttribute("aria-label", "Photo viewer");
    box.innerHTML =
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox__close" type="button" aria-label="Close">' + icon("M6 6l12 12M18 6 6 18") + "</button>" +
      '<button class="lightbox__prev" type="button" aria-label="Previous photo">' + icon("M15 5l-7 7 7 7") + "</button>" +
      '<button class="lightbox__next" type="button" aria-label="Next photo">' + icon("M9 5l7 7-7 7") + "</button>";
    document.body.appendChild(box);

    var bigImg = box.querySelector("img");
    var caption = box.querySelector("figcaption");
    var items = [];
    var current = 0;
    function largest(img) {
      var set = (img.getAttribute("srcset") || "").split(",").map(function (s) { return s.trim().split(" ")[0]; });
      return set[set.length - 1] || img.currentSrc || img.src;
    }
    function show(i) {
      current = (i + items.length) % items.length;
      var img = items[current];
      bigImg.src = largest(img);
      bigImg.alt = img.alt;
      caption.textContent = img.alt;
    }
    box.querySelector(".lightbox__close").addEventListener("click", function () { box.close(); });
    box.querySelector(".lightbox__prev").addEventListener("click", function () { show(current - 1); });
    box.querySelector(".lightbox__next").addEventListener("click", function () { show(current + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) box.close(); });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    var touchX = null;
    box.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });

    lightbox = function (set, i) {
      items = set;
      box.classList.toggle("is-single", set.length < 2);
      show(i);
      box.showModal();
    };
    return lightbox;
  }

  // Photo galleries: every tile opens its own gallery's set.
  var galleries = document.querySelectorAll(".gallery");
  if (galleries.length && useLightbox()) {
    galleries.forEach(function (gallery) {
      var set = Array.prototype.slice.call(gallery.querySelectorAll(".photo img"));
      set.forEach(function (img, i) {
        var tile = img.parentElement;
        tile.setAttribute("tabindex", "0");
        tile.setAttribute("role", "button");
        tile.setAttribute("aria-label", "View larger: " + img.alt);
        function open() { useLightbox()(set, i); }
        tile.addEventListener("click", open);
        tile.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        });
      });
    });
    document.querySelectorAll(".gallery__hint").forEach(function (hint) { hint.hidden = false; });
  }

  // Announcement flyers: the poster and the "See the flyer" button both open the flyer full size,
  // and the arrows move between the flyers on the page.
  var posters = Array.prototype.slice.call(document.querySelectorAll(".notice__poster"))
    .filter(function (p) { return p.querySelector("img"); });
  if (posters.length && useLightbox()) {
    var flyers = posters.map(function (p) { return p.querySelector("img"); });
    posters.forEach(function (poster, i) {
      function open() { useLightbox()(flyers, i); }
      poster.addEventListener("click", open);
      var button = poster.closest(".notice").querySelector(".notice__flyer");
      if (button) button.addEventListener("click", open);
    });
  }

  // Staff cards: the card opens that member's own photos. On a mouse the fan of
  // thumbnails along the bottom previews them first; on a touch screen the badge
  // is the only cue, so the whole card is the tap target.
  var staff = document.querySelectorAll(".tcard--shots");
  if (staff.length && useLightbox()) {
    staff.forEach(function (card) {
      var button = card.querySelector(".tcard__open");
      var set = Array.prototype.slice.call(card.querySelectorAll(".tcard__shots img"));
      if (!button || !set.length) return;
      button.addEventListener("click", function () { useLightbox()(set, 0); });
    });
    document.querySelectorAll(".team__hint").forEach(function (hint) { hint.hidden = false; });
  }
})();
