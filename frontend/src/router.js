import { element } from "./dom.js";

export function initializeRouter() {
  function route() {
    const hash = ["#converter", "#guide", "#practice"].includes(location.hash)
      ? location.hash
      : "#converter";
    document
      .querySelectorAll(".view")
      .forEach((v) => (v.hidden = "#" + v.id !== hash));
    document.querySelectorAll("nav a").forEach((a) => {
      const active = a.hash === hash;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("hashchange", () => {
    route();
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  route();
}
