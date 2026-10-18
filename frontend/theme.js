// Classic (non-module) script loaded in <head> so a saved theme applies before
// first paint. With no saved choice, CSS follows the OS via prefers-color-scheme.
(function () {
  const root = document.documentElement;

  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch {}

  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncButtons() {
    const dark = current() === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.textContent = dark ? "☀️" : "🌙";
      btn.title = dark ? "Switch to light theme" : "Switch to dark theme";
      btn.setAttribute("aria-label", btn.title);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncButtons();
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => {
        root.dataset.theme = current() === "dark" ? "light" : "dark";
        try {
          localStorage.setItem("theme", root.dataset.theme);
        } catch {}
        syncButtons();
      })
    );
  });
})();
