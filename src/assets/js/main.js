// Palm River Academy — small helpers. No framework.

(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The few words this script writes into the page, in the page's language (VIETNAMESE.md).
  var words = document.documentElement.lang === "vi"
    ? { viewer: "Xem ảnh", close: "Đóng", prev: "Ảnh trước", next: "Ảnh tiếp theo", larger: "Phóng to ảnh: " }
    : { viewer: "Photo viewer", close: "Close", prev: "Previous photo", next: "Next photo", larger: "View larger: " };

  // Email boxes on the forms: a slip after the @ ("gmai.com") is pointed out when the box is
  // left, with a button that puts it right. Only a warning: the form sends what is in the box.
  // The words are on the form (data-say-slip, data-say-fix). The same list of domains is in The
  // Current (admin repo, src/lib/emailCheck.js); keep the two alike.
  var KNOWN = ["gmail.com", "googlemail.com", "yahoo.com", "yahoo.com.vn", "yahoo.co.uk", "yahoo.fr", "yahoo.de",
    "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de", "hotmail.it", "outlook.com", "outlook.fr", "outlook.de",
    "live.com", "live.co.uk", "live.fr", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com",
    "protonmail.com", "proton.me", "gmx.de", "gmx.net", "gmx.at", "web.de", "t-online.de", "orange.fr", "free.fr", "wanadoo.fr",
    "mail.ru", "yandex.ru", "bk.ru", "inbox.ru", "list.ru", "qq.com", "163.com", "126.com", "naver.com", "daum.net",
    "bigpond.com", "bigpond.net.au", "optusnet.com.au", "xtra.co.nz", "comcast.net", "verizon.net",
    "fpt.vn", "vnn.vn", "pra.edu.vn", "palmriveracademy.edu.vn"];
  var ONE_DOMAIN = { gmail: "gmail.com", googlemail: "googlemail.com", icloud: "icloud.com" };
  function edits(a, b) {
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; for (j = 1; j <= b.length; j++) d[i][j] = i ? 0 : j; }
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }
  function domainSlip(domain) {
    if (!domain || KNOWN.indexOf(domain) > -1) return "";
    var name = domain.split(".")[0];
    if (ONE_DOMAIN[name]) return ONE_DOMAIN[name];
    var best = "", bestD = 9;
    KNOWN.forEach(function (k) { var n = edits(domain, k); if (n < bestD) { best = k; bestD = n; } });
    if (bestD === 1 && best.length >= 8) return best;
    if (bestD === 2 && best.length >= 9 && domain.length >= 7) return best;
    return "";
  }
  document.querySelectorAll("form[data-say-slip]").forEach(function (form) {
    var say = form.getAttribute("data-say-slip");
    var fixSay = form.getAttribute("data-say-fix");
    form.querySelectorAll("input[type=email]").forEach(function (box) {
      var note = document.createElement("p");
      note.className = "form__note form__slip";
      note.setAttribute("role", "status");
      note.hidden = true;
      box.insertAdjacentElement("afterend", note);
      function check() {
        var value = box.value.trim();
        var at = value.lastIndexOf("@");
        var domain = at > 0 ? value.slice(at + 1).toLowerCase().replace(/\.+$/, "") : "";
        var suggestion = domain.indexOf(".") > 0 ? domainSlip(domain) : "";
        note.textContent = "";
        note.hidden = !suggestion;
        if (!suggestion) return;
        var fixed = value.slice(0, at + 1) + suggestion;
        note.appendChild(document.createTextNode(say.replace("{typed}", domain).replace("{suggestion}", suggestion) + " "));
        var fix = document.createElement("button");
        fix.type = "button";
        fix.className = "form__slip-fix";
        fix.textContent = fixSay.replace("{email}", fixed);
        fix.addEventListener("click", function () {
          box.value = fixed;
          box.dispatchEvent(new Event("input", { bubbles: true }));
          box.focus();
        });
        note.appendChild(fix);
      }
      box.addEventListener("blur", check);
      box.addEventListener("input", function () { if (!note.hidden) check(); });
    });
  });

  // Contact form. This site has no server of its own, so the form hands the message
  // straight to the office system (The Current), which files it under Leads. The address
  // and key on the form are public on purpose: they allow this one call and nothing else.
  // The words a family reads (thank you, could not send) are in the page, not here.
  document.querySelectorAll("form[data-web-form]").forEach(function (form) {
    var button = form.querySelector("button[type=submit]");
    var error = form.querySelector(".form__error");
    var visit = form.querySelector(".form__visit");
    var done = form.parentElement.querySelector(".form__done");
    var want = form.elements.want;
    var day = form.elements.visit_date;
    function two(n) { return (n < 10 ? "0" : "") + n; }
    function iso(d) { return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()); }
    function wantsVisit() { return want.value === "tour" || want.value === "call"; }
    // Tours and calls are on weekdays. The office confirms the day, so holidays are left to them.
    function checkDay() {
      var weekday = wantsVisit() && day.value ? new Date(day.value + "T12:00:00").getDay() : 1;
      day.setCustomValidity(weekday === 0 || weekday === 6 ? day.getAttribute("data-weekend") : "");
    }
    function showVisit() { visit.hidden = !wantsVisit(); checkDay(); }
    function text(name) { return String(form.elements[name].value || "").trim(); }

    var now = new Date();
    day.min = iso(now);
    day.max = iso(new Date(now.getFullYear(), now.getMonth() + 6, now.getDate()));
    day.addEventListener("input", checkDay);
    want.addEventListener("change", showVisit);
    showVisit();
    button.disabled = false; // off in the page, so the form cannot be sent the old way without this script

    function sent() {
      form.hidden = true;
      done.hidden = false;
      done.focus();
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (button.disabled) return;
      var message = {
        want: want.value,
        name: text("name"),
        email: text("email"),
        phone: text("phone"),
        child_age: text("child_age"),
        visit_date: wantsVisit() ? day.value : "",
        visit_time: wantsVisit() ? form.elements.visit_time.value : "",
        message: text("message"),
        lang: document.documentElement.lang === "vi" ? "vi" : "en",
        website: text("website")
      };
      button.disabled = true;
      error.hidden = true;
      fetch(form.getAttribute("data-endpoint"), {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: form.getAttribute("data-key") },
        body: JSON.stringify({ p: message })
      }).then(function (reply) {
        if (!reply.ok) throw new Error(String(reply.status));
        sent();
      }).catch(function () {
        error.hidden = false;
        button.disabled = false;
      });
    });
  });

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
    ".values > li", ".steps > li", ".team > li", ".stats > *", ".cal > *", ".programs > *",
    // and on phones the noticeboard is a swipe strip, so it rises as one piece too
    window.innerWidth < 900 ? ".notices" : ".notices > li",
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
    box.setAttribute("aria-label", words.viewer);
    box.innerHTML =
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lightbox__close" type="button" aria-label="' + words.close + '">' + icon("M6 6l12 12M18 6 6 18") + "</button>" +
      '<button class="lightbox__prev" type="button" aria-label="' + words.prev + '">' + icon("M15 5l-7 7 7 7") + "</button>" +
      '<button class="lightbox__next" type="button" aria-label="' + words.next + '">' + icon("M9 5l7 7-7 7") + "</button>";
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
      // the album hangs the file names off the photo, and wants them under it
      if (img.dataset.meta) {
        var meta = document.createElement("span");
        meta.className = "lightbox__meta";
        meta.textContent = img.dataset.meta;
        caption.appendChild(meta);
      }
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

  // Photo galleries and pinned-up collages: every tile opens its own set.
  var galleries = document.querySelectorAll(".gallery, .collage");
  if (galleries.length && useLightbox()) {
    galleries.forEach(function (gallery) {
      var set = Array.prototype.slice.call(gallery.querySelectorAll(".photo img"));
      set.forEach(function (img, i) {
        var tile = img.parentElement;
        tile.setAttribute("tabindex", "0");
        tile.setAttribute("role", "button");
        tile.setAttribute("aria-label", words.larger + img.alt);
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

  // The album (/album/): search, filter, sort and copy. Every card is already on
  // the page with its tags on it, so nothing here fetches or rebuilds anything —
  // it only hides what does not match. A group of chips is an "any of these",
  // and the groups narrow each other: Primary AND 2026-27, not either.
  var album = document.getElementById("album");
  if (album) {
    var cards = Array.prototype.slice.call(album.querySelectorAll(".acard"));
    var query = document.getElementById("album-q");
    var tally = document.getElementById("album-count");
    var empty = document.getElementById("album-empty");
    var sorter = document.getElementById("album-sort");
    var chips = Array.prototype.slice.call(document.querySelectorAll("#album-filters .chip"));
    var pressed = function (chip) { return chip.getAttribute("aria-pressed") === "true"; };

    function apply() {
      var groups = {};
      chips.filter(pressed).forEach(function (chip) {
        var group = chip.dataset.f.split(":")[0];
        (groups[group] = groups[group] || []).push(chip.dataset.f);
      });
      var q = query.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var ok = !q || card.dataset.q.indexOf(q) > -1;
        var tokens = " " + card.dataset.f + " ";
        for (var group in groups) {
          if (!ok) break;
          ok = groups[group].some(function (token) { return tokens.indexOf(" " + token + " ") > -1; });
        }
        card.hidden = !ok;
        if (ok) shown++;
      });
      tally.textContent = shown === cards.length ? cards.length + " photos" : shown + " of " + cards.length + " photos";
      empty.hidden = shown > 0;
      remember(q);
    }

    // the filters live in the address bar too, so a useful view can be bookmarked
    // or sent to someone ("#f=use:not-on-the-site")
    function remember(q) {
      var parts = [];
      var tokens = chips.filter(pressed).map(function (chip) { return chip.dataset.f; });
      if (q) parts.push("q=" + encodeURIComponent(q));
      if (tokens.length) parts.push("f=" + tokens.join(","));
      history.replaceState(null, "", parts.length ? "#" + parts.join("&") : location.pathname + location.search);
    }
    location.hash.replace(/^#/, "").split("&").forEach(function (part) {
      var at = part.indexOf("=");
      var name = part.slice(0, at);
      var value = part.slice(at + 1);
      if (name === "q") query.value = decodeURIComponent(value);
      if (name === "f") value.split(",").forEach(function (token) {
        chips.forEach(function (chip) { if (chip.dataset.f === token) chip.setAttribute("aria-pressed", "true"); });
      });
    });

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chip.setAttribute("aria-pressed", pressed(chip) ? "false" : "true");
        apply();
      });
    });
    query.addEventListener("input", apply);
    document.querySelectorAll("#album-clear, [data-clear]").forEach(function (button) {
      button.addEventListener("click", function () {
        query.value = "";
        chips.forEach(function (chip) { chip.setAttribute("aria-pressed", "false"); });
        apply();
      });
    });

    var sorts = {
      date: function (a, b) { return (b.dataset.date || "").localeCompare(a.dataset.date || "") || a.dataset.az.localeCompare(b.dataset.az); },
      az: function (a, b) { return a.dataset.az.localeCompare(b.dataset.az); },
      file: function (a, b) { return a.dataset.file.localeCompare(b.dataset.file); },
      unused: function (a, b) { return a.dataset.used - b.dataset.used || sorts.date(a, b); }
    };
    sorter.addEventListener("change", function () {
      cards.slice().sort(sorts[sorter.value] || sorts.date).forEach(function (card) { album.appendChild(card); });
    });

    document.querySelectorAll(".acopy").forEach(function (button) {
      button.addEventListener("click", function () {
        var text = button.dataset.copy;
        function flash() {
          button.classList.add("is-copied");
          window.setTimeout(function () { button.classList.remove("is-copied"); }, 1200);
        }
        function theOldWay() {
          var field = document.createElement("textarea");
          field.value = text;
          field.setAttribute("readonly", "");
          field.style.position = "fixed";
          field.style.opacity = "0";
          document.body.appendChild(field);
          field.select();
          try { document.execCommand("copy"); flash(); } catch (e) { /* nothing to be done */ }
          document.body.removeChild(field);
        }
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(flash, theOldWay);
        else theOldWay();
      });
    });

    // A photo opens full size, and the arrows walk the photos you are looking at
    // rather than all 149 of them.
    if (useLightbox()) {
      cards.forEach(function (card) {
        var tile = card.querySelector(".photo");
        var img = tile && tile.querySelector("img");
        if (!img) return;
        img.dataset.meta = card.dataset.meta;
        tile.setAttribute("tabindex", "0");
        tile.setAttribute("role", "button");
        tile.setAttribute("aria-label", words.larger + img.alt);
        function open() {
          var set = cards.filter(function (c) { return !c.hidden; })
            .map(function (c) { return c.querySelector(".photo img"); })
            .filter(Boolean);
          useLightbox()(set, Math.max(0, set.indexOf(img)));
        }
        tile.addEventListener("click", open);
        tile.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        });
      });
    }

    apply();
  }
})();
