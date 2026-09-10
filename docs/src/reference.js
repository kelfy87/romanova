import { element } from "./dom.js";
import { toRoman } from "../shared/roman.js";

export function initializeReference() {
  element("reference-table").innerHTML = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return (
      "<tr><th>" +
      n +
      "</th><td>" +
      toRoman(n) +
      "</td><td>" +
      toRoman(n * 10) +
      "</td><td>" +
      toRoman(n * 100) +
      "</td><td>" +
      (n <= 3 ? toRoman(n * 1000) : "—") +
      "</td></tr>"
    );
  }).join("");
}
