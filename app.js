/* Static HTML is the source of truth. JavaScript enhances filters and search only. */
(() => {
  "use strict";
  const cards = Array.from(document.querySelectorAll(".card[data-tag]"));
  const filters = document.getElementById("filters");
  const mediaStatus = document.getElementById("mediaStatus");
  const filterButtons = Array.from(document.querySelectorAll("#filters button"));

  function filterMedia(tag) {
    const valid = filterButtons.some((button) => button.dataset.filter === tag);
    if (!valid) return;
    const years = new Set();
    let count = 0;
    cards.forEach((card) => {
      card.hidden = tag !== "all" && card.dataset.tag !== tag;
      if (!card.hidden) { years.add(card.dataset.year); count += 1; }
    });
    document.querySelectorAll(".year-label").forEach((label) => {
      label.hidden = !years.has(label.dataset.year);
    });
    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === tag;
      button.classList.toggle("on", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (mediaStatus) mediaStatus.textContent = `Showing ${count} of ${cards.length} media items.`;
  }

  if (filters && cards.length) {
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (button && filters.contains(button)) filterMedia(button.dataset.filter);
    });
    filters.hidden = false;
  }

  // Direct links to a career chapter or a filtered-out media card must stay usable.
  function revealHashTarget() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.matches(".card[hidden]")) filterMedia("all");
    const details = target.closest("details");
    if (details) details.open = true;
    if (window.location.hash) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }
  window.addEventListener("hashchange", revealHashTarget);
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.getAttribute("href") === window.location.hash &&
        !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) revealHashTarget();
  });
  if (window.location.hash) revealHashTarget();

  // Optional integration point. No cookies, identifiers, network calls or analytics vendor.
  function emitConversion(link) {
    if (!link.dataset.event) return;
    window.dispatchEvent(new CustomEvent("trevor:conversion", {
      detail: {
        event: link.dataset.event,
        label: link.dataset.label || "",
        page_path: window.location.pathname
      }
    }));
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-event]");
    if (link) emitConversion(link);
  });
  document.addEventListener("auxclick", (event) => {
    if (event.button !== 1) return;
    const link = event.target.closest("a[data-event]");
    if (link) emitConversion(link);
  });

  const dialog = document.getElementById("cmd");
  const input = document.getElementById("cmdInput");
  const list = document.getElementById("cmdList");
  const status = document.getElementById("cmdStatus");
  const openButton = document.getElementById("cmdOpen");
  const closeButton = document.getElementById("cmdClose");
  if (!dialog || typeof dialog.showModal !== "function" || !input || !list || !openButton) return;

  const commands = Array.from(document.querySelectorAll("a[data-command]"), (link) => ({
    label: link.dataset.command,
    href: link.getAttribute("href"),
    external: link.target === "_blank",
    event: link.dataset.event,
    eventLabel: link.dataset.label
  }));
  cards.forEach((card) => commands.push({
    label: card.querySelector("h3").textContent,
    href: card.href,
    external: true,
    event: card.dataset.event,
    eventLabel: card.dataset.label
  }));
  let matches = commands;
  let index = 0;
  let returnFocus = openButton;

  function select(next) {
    if (!matches.length) return;
    index = Math.max(0, Math.min(next, matches.length - 1));
    list.querySelectorAll("a").forEach((link, i) => link.classList.toggle("active", i === index));
  }
  function draw() {
    list.replaceChildren();
    matches.forEach((item, i) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.textContent = item.label;
      link.href = item.href;
      link.dataset.index = String(i);
      if (item.external) { link.target = "_blank"; link.rel = "noopener"; }
      if (item.event) { link.dataset.event = item.event; link.dataset.label = item.eventLabel || ""; }
      link.classList.toggle("active", i === index);
      li.append(link);
      list.append(li);
    });
    if (!matches.length) {
      const li = document.createElement("li");
      li.className = "search-empty";
      li.textContent = "No results. Try work, book, Bitcoin or cafe.";
      list.append(li);
    }
    status.textContent = `${matches.length} search results.`;
  }
  function closeSearch() {
    if (dialog.open) dialog.close();
  }
  function openSearch() {
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
    input.value = "";
    matches = commands;
    index = 0;
    draw();
    dialog.showModal();
    input.focus();
  }
  openButton.addEventListener("click", openSearch);
  if (closeButton) closeButton.addEventListener("click", closeSearch);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeSearch(); });
  dialog.addEventListener("close", () => {
    if (returnFocus && returnFocus.isConnected && returnFocus !== document.body) returnFocus.focus();
    else openButton.focus();
  });
  list.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) closeSearch();
    // Keep real anchor default behavior, including modified clicks and new tabs.
  });
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    matches = commands.filter((item) => item.label.toLowerCase().includes(query));
    index = 0;
    draw();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      const focusable = Array.from(dialog.querySelectorAll("button, input, a[href]"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!matches.length) return;
      event.preventDefault();
      const current = event.target.closest("a[data-index]");
      if (current) index = Number(current.dataset.index);
      const next = event.target === input && event.key === "ArrowDown" ? 0 : index + (event.key === "ArrowDown" ? 1 : -1);
      select(next);
      list.querySelectorAll("a")[index]?.focus();
    } else if (event.key === "Enter" && event.target === input && matches.length) {
      event.preventDefault();
      list.querySelectorAll("a")[index]?.click();
    }
  });
  document.addEventListener("keydown", (event) => {
    const active = document.activeElement;
    const editing = active && (active.matches("input, textarea, select") || active.isContentEditable);
    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !editing && !dialog.open) {
      event.preventDefault();
      openSearch();
    }
  });
  openButton.hidden = false;
})();
