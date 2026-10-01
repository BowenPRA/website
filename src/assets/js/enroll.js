// Palm River Academy — the enrollment form (/admissions/enroll/ and its Vietnamese twin).
//
// This site has no server of its own. The form puts the documents a parent attaches into a
// private folder of the office system (The Current), then hands over the answers, where they
// are filed under Enrollments and the child becomes a pending student. The address and key on
// the form are public on purpose: they allow adding a document and sending a form, nothing else.
//
// The form is five steps. Answers are kept in this tab (sessionStorage) so a reload, or a
// phone that drops the page while you look for a passport photo, does not lose them; they
// are cleared when the form is sent or the tab is closed. Documents are not kept.
// Every word a parent reads is in the page (src/_data/enroll.json), not here.

(function () {
  var form = document.querySelector("form[data-enroll-form]");
  if (!form) return;

  var DRAFT = "pra-enroll-draft";
  var BUCKET = "adm-enrollment";
  var MAX_FILES = 12;
  var MAX_BYTES = 10 * 1024 * 1024;
  var base = form.getAttribute("data-base");
  var key = form.getAttribute("data-key");
  var say = function (name) { return form.getAttribute("data-say-" + name) || ""; };

  var steps = [].slice.call(form.querySelectorAll(".enroll__step"));
  var count = form.querySelector(".enroll__count");
  var bar = form.querySelector(".enroll__bar span");
  var back = form.querySelector("[data-back]");
  var next = form.querySelector("[data-next]");
  var send = form.querySelector("[data-send]");
  var status = form.querySelector(".enroll__status");
  var error = form.querySelector(".enroll__error");
  var done = form.parentElement.querySelector(".form__done");
  var current = 0;

  // ---------- small helpers ----------

  function two(n) { return (n < 10 ? "0" : "") + n; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate()); }
  function fill(text, values) { return text.replace(/\{(\w+)\}/g, function (m, k) { return k in values ? values[k] : m; }); }
  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = [].map.call(b, function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join("");
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join("-");
  }
  function controls() {
    return [].filter.call(form.elements, function (el) { return el.name && el.type !== "file" && el.name !== "website"; });
  }

  // ---------- answers kept in this tab ----------

  function readDraft() { try { return JSON.parse(sessionStorage.getItem(DRAFT)) || {}; } catch (e) { return {}; } }
  var draft = readDraft();
  var formId = draft.id || newId(); // the form's number: its documents are filed under it, and sending twice counts once

  function saveDraft() {
    var fields = {};
    controls().forEach(function (el) {
      if (el.type === "checkbox") fields[el.name] = el.checked;
      else if (el.type === "radio") { if (el.checked) fields[el.name] = el.value; }
      else fields[el.name] = el.value;
    });
    try { sessionStorage.setItem(DRAFT, JSON.stringify({ id: formId, step: current, fields: fields, sign: signData })); } catch (e) { /* private browsing: carry on without */ }
  }
  function restoreDraft() {
    var fields = draft.fields || {};
    controls().forEach(function (el) {
      if (!(el.name in fields)) return;
      if (el.type === "checkbox") el.checked = !!fields[el.name];
      else if (el.type === "radio") el.checked = el.value === fields[el.name];
      else el.value = fields[el.name];
    });
  }

  // ---------- parts that show or hide ----------

  // A hidden part is switched off as well, so it is neither checked nor sent.
  function setShown(box, shown) {
    box.hidden = !shown;
    [].forEach.call(box.querySelectorAll("input, select, textarea"), function (el) { el.disabled = !shown; });
  }
  function syncParts() {
    [].forEach.call(form.querySelectorAll("[data-hides]"), function (el) { setShown(document.getElementById(el.getAttribute("data-hides")), !el.checked); });
    [].forEach.call(form.querySelectorAll("[data-shows]"), function (el) { setShown(document.getElementById(el.getAttribute("data-shows")), el.checked); });
  }

  // ---------- the five steps ----------

  function show(i, focus) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, n) { s.hidden = n !== current; });
    count.textContent = fill(say("step"), { n: current + 1, total: steps.length }) + ": " + steps[current].querySelector("h2").textContent;
    bar.style.width = ((current + 1) / steps.length) * 100 + "%";
    back.hidden = current === 0;
    next.hidden = current === steps.length - 1;
    send.hidden = current !== steps.length - 1;
    if (focus) {
      form.scrollIntoView({ block: "start" });
      steps[current].querySelector("h2").focus({ preventScroll: true });
    }
  }
  function firstInvalid(step) {
    return [].filter.call(step.querySelectorAll("input, select, textarea"), function (el) { return el.willValidate && !el.checkValidity(); })[0];
  }
  // Shows the first step with a gap and points at the gap. True when there is none up to `last`.
  function checkUpTo(last) {
    for (var i = 0; i <= last; i++) {
      var bad = firstInvalid(steps[i]);
      if (bad) {
        if (i !== current) show(i, true);
        bad.reportValidity();
        return false;
      }
    }
    return true;
  }

  // ---------- documents ----------

  // Each document is its own question (a photo, the student's passport, the parents', a report).
  // A file remembers which question it answers, and the office sees that next to it.
  var files = []; // { file, n, path, kind }
  var seq = 0;
  var docs = [].map.call(form.querySelectorAll(".doc"), function (box) {
    return {
      kind: box.getAttribute("data-doc"),
      needed: box.hasAttribute("data-needed"),
      list: box.querySelector(".files"),
      picker: box.querySelector(".files__input"),
      error: box.querySelector(".files__error")
    };
  });

  function complain(box, text) { box.textContent = text; box.hidden = !text; }
  function FileProblem(text, kind) { this.text = text; this.kind = kind; }
  function isPdf(f) { return f.type === "application/pdf" || /\.pdf$/i.test(f.name); }
  function isPicture(f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name); }
  function of(doc) { return files.filter(function (f) { return f.kind === doc.kind; }); }
  function docOf(kind) { return docs.filter(function (d) { return d.kind === kind; })[0] || docs[0]; }
  function drawFiles(doc) {
    doc.list.textContent = "";
    of(doc).forEach(function (item) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.textContent = item.file.name;
      var remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = say("remove");
      remove.addEventListener("click", function () { files.splice(files.indexOf(item), 1); drawFiles(doc); });
      li.appendChild(name);
      li.appendChild(remove);
      doc.list.appendChild(li);
    });
  }
  docs.forEach(function (doc) {
    doc.picker.addEventListener("change", function () {
      var problems = [];
      [].forEach.call(doc.picker.files, function (f) {
        if (!isPdf(f) && !isPicture(f)) { problems.push(f.name + " " + say("type")); return; }
        if (isPdf(f) && f.size > MAX_BYTES) { problems.push(f.name + " " + say("big")); return; }
        // A question that takes one file (the photo): a new choice takes the place of the old one.
        if (!doc.picker.multiple) files = files.filter(function (x) { return x.kind !== doc.kind; });
        if (files.length >= MAX_FILES) { if (problems.indexOf(say("many")) < 0) problems.push(say("many")); return; }
        files.push({ file: f, n: ++seq, path: "", kind: doc.kind });
      });
      doc.picker.value = "";
      complain(doc.error, problems.join(" "));
      drawFiles(doc);
    });
  });

  // Phone photos are often 3 to 8 MB. Scaled to a size where a passport's print is still sharp
  // and saved as JPEG they are a few hundred KB, which matters on a weak signal. A picture the
  // browser cannot read (HEIC on some phones) goes up as it is.
  function prepare(file) {
    var asIs = { blob: file, type: file.type || (isPdf(file) ? "application/pdf" : /\.hei[cf]$/i.test(file.name) ? "image/heic" : "image/jpeg") };
    if (isPdf(file) || !window.createImageBitmap) return Promise.resolve(asIs);
    return createImageBitmap(file).then(function (bitmap) {
      var scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
      var canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      var g = canvas.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      if (bitmap.close) bitmap.close();
      return new Promise(function (resolve) { canvas.toBlob(resolve, "image/jpeg", 0.85); });
    }).then(function (jpeg) {
      return jpeg && jpeg.size < file.size ? { blob: jpeg, type: "image/jpeg" } : asIs;
    }).catch(function () { return asIs; });
  }
  // "Hộ chiếu của con.JPG" -> "Ho-chieu-cua-con": the folder takes plain letters, digits, dots and dashes.
  function safeName(name) {
    var stem = name.replace(/\.[^.]+$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d");
    return stem.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "file";
  }
  var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "application/pdf": "pdf" };
  function upload(item) {
    if (item.path) return Promise.resolve(); // already there from an earlier try
    return prepare(item.file).then(function (ready) {
      if (ready.blob.size > MAX_BYTES) throw new FileProblem(item.file.name + " " + say("big"), item.kind);
      if (!EXT[ready.type]) throw new FileProblem(item.file.name + " " + say("type"), item.kind);
      var path = formId + "/" + item.n + "-" + safeName(item.file.name) + "." + EXT[ready.type];
      return fetch(base + "/storage/v1/object/" + BUCKET + "/" + path, {
        method: "POST",
        headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": ready.type, "x-upsert": "false" },
        body: ready.blob
      }).then(function (reply) {
        if (reply.ok) { item.path = path; return; }
        return reply.json().catch(function () { return {}; }).then(function (body) {
          // The same file from a try that was cut off half way: it is there, which is all we need.
          if (reply.status === 409 || String(body.statusCode) === "409" || body.error === "Duplicate") { item.path = path; return; }
          throw new Error("upload " + reply.status);
        });
      });
    });
  }

  // ---------- signature ----------

  var pad = form.querySelector(".sign");
  var ink = pad.getContext("2d");
  var signError = form.querySelector(".sign__error");
  var signed = false;
  var signData = ""; // the signature as a small picture, for the draft and for sending
  var drawing = false;
  ink.lineWidth = 2.5;
  ink.lineCap = "round";
  ink.lineJoin = "round";
  ink.strokeStyle = "#1B2A41";
  function at(e) {
    var r = pad.getBoundingClientRect();
    return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height];
  }
  pad.addEventListener("pointerdown", function (e) {
    drawing = true;
    pad.setPointerCapture(e.pointerId);
    var p = at(e);
    ink.beginPath();
    ink.moveTo(p[0], p[1]);
    ink.lineTo(p[0] + 0.1, p[1] + 0.1); // a tap leaves a dot
    ink.stroke();
    signed = true;
    complain(signError, "");
    e.preventDefault();
  });
  pad.addEventListener("pointermove", function (e) {
    if (!drawing) return;
    var p = at(e);
    ink.lineTo(p[0], p[1]);
    ink.stroke();
  });
  function lift() { if (drawing) { drawing = false; signData = pad.toDataURL("image/png"); saveDraft(); } }
  pad.addEventListener("pointerup", lift);
  pad.addEventListener("pointercancel", lift);
  form.querySelector(".sign__clear").addEventListener("click", function () {
    ink.clearRect(0, 0, pad.width, pad.height);
    signed = false;
    signData = "";
    saveDraft();
  });

  // ---------- sending ----------

  // Answers by name: "parents.0.email" becomes message.parents[0].email.
  function collect() {
    var message = {};
    [].forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || el.type === "file") return;
      var value;
      if (el.type === "checkbox") value = el.checked;
      else if (el.type === "radio") { if (!el.checked) return; value = el.value; }
      else value = String(el.value || "").trim();
      var parts = el.name.split(".");
      var node = message;
      parts.forEach(function (part, i) {
        if (i === parts.length - 1) { node[part] = value; return; }
        if (node[part] == null) node[part] = /^\d+$/.test(parts[i + 1]) ? [] : {};
        node = node[part];
      });
    });
    message.submission_id = formId;
    message.lang = document.documentElement.lang === "vi" ? "vi" : "en";
    message.signature = signData;
    message.files = files.filter(function (f) { return f.path; }).map(function (f) { return { path: f.path, name: f.file.name, kind: f.kind }; });
    return message;
  }
  function busy(on, text) {
    [back, next, send].forEach(function (b) { b.disabled = on; });
    status.textContent = text || "";
    status.hidden = !text;
    form.setAttribute("aria-busy", String(on));
  }
  function sent() {
    // Keep what a brother's or sister's form will need again; the rest is cleared.
    var keep = {};
    Object.keys(readDraft().fields || {}).forEach(function (name) {
      if (/^(parents|emergency|pickup)\.|^student\.address\.|^applying_for$/.test(name)) keep[name] = readDraft().fields[name];
    });
    try { sessionStorage.setItem(DRAFT, JSON.stringify({ id: newId(), step: 0, fields: keep, sign: "" })); } catch (e) { /* nothing to keep */ }
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    done.scrollIntoView({ block: "center" });
  }

  form.noValidate = true; // the steps are checked one at a time, here
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (send.disabled) return;
    error.hidden = true;
    if (!checkUpTo(steps.length - 1)) return;
    var missing = docs.filter(function (doc) { return doc.needed && !of(doc).length; });
    missing.forEach(function (doc) { complain(doc.error, say("none")); });
    if (missing.length) { missing[0].error.scrollIntoView({ block: "center" }); return; }
    if (!signed) { complain(signError, say("sign")); signError.scrollIntoView({ block: "center" }); return; }
    saveDraft();

    var chain = Promise.resolve();
    files.forEach(function (item, i) {
      chain = chain.then(function () {
        busy(true, fill(say("uploading"), { n: i + 1, total: files.length }));
        return upload(item);
      });
    });
    chain.then(function () {
      busy(true, say("sending"));
      return fetch(base + "/rest/v1/rpc/adm_enroll_submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ p: collect() })
      });
    }).then(function (reply) {
      if (!reply.ok) throw new Error("send " + reply.status);
      busy(false);
      sent();
    }).catch(function (problem) {
      busy(false);
      // A file that is too big or the wrong kind is said by name; anything else gets the general note.
      if (problem instanceof FileProblem) { var at = docOf(problem.kind).error; complain(at, problem.text); at.scrollIntoView({ block: "center" }); }
      else error.hidden = false;
    });
  });

  // ---------- start ----------

  restoreDraft();
  [].forEach.call(form.querySelectorAll("[data-past]"), function (el) { el.max = today(); });
  syncParts();
  form.addEventListener("change", function () { syncParts(); saveDraft(); });
  var saving = 0;
  form.addEventListener("input", function (e) {
    if (e.target.type === "file") return;
    clearTimeout(saving);
    saving = setTimeout(saveDraft, 400);
  });
  back.addEventListener("click", function () { show(current - 1, true); saveDraft(); });
  next.addEventListener("click", function () { if (checkUpTo(current)) { show(current + 1, true); saveDraft(); } });
  done.querySelector("[data-another]").addEventListener("click", function () { window.location.reload(); });
  if (draft.sign) {
    var old = new Image();
    old.onload = function () { ink.drawImage(old, 0, 0); signed = true; signData = draft.sign; };
    old.src = draft.sign;
  }
  show(draft.step || 0, false);
  [back, next, send].forEach(function (b) { b.disabled = false; }); // off in the page, so nothing can be sent without this script
})();
