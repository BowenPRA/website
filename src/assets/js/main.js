// Palm River Academy — small helpers. No framework.

(function () {
  // Mobile nav sheet
  var toggle = document.querySelector(".menu-toggle");
  var sheet = document.getElementById("sheet");
  if (toggle && sheet) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      sheet.hidden = open;
      document.body.classList.toggle("sheet-open", !open);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && !sheet.hidden) {
        toggle.setAttribute("aria-expanded", "false");
        sheet.hidden = true;
        document.body.classList.remove("sheet-open");
      }
    });
  }

  // Age picker (Academics overview)
  var picker = document.querySelector("[data-picker]");
  if (picker) {
    var chips = picker.querySelectorAll(".chip");
    var grid = picker.querySelector(".programs");
    var cards = grid.querySelectorAll(".program");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var key = chip.getAttribute("data-key");
        var already = chip.getAttribute("aria-pressed") === "true";
        chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
        if (already) {
          cards.forEach(function (c) { c.hidden = false; });
          grid.classList.remove("is-filtered");
          return;
        }
        chip.setAttribute("aria-pressed", "true");
        cards.forEach(function (c) { c.hidden = c.getAttribute("data-key") !== key; });
        grid.classList.add("is-filtered");
      });
    });
  }

  // Timetable tabs (Schedule page)
  var tt = document.querySelector("[data-tt]");
  if (tt) {
    var tabs = tt.querySelectorAll('[role="tab"]');
    var panels = tt.querySelectorAll(".tt-panel");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-key");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.setAttribute("aria-pressed", String(on));
        });
        panels.forEach(function (p) { p.hidden = p.id !== "panel-" + key; });
      });
    });
  }
})();
