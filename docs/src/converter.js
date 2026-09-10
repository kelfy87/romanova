import { element, formatNumber, notify } from "./dom.js";
import { toRoman } from "../shared/roman.js";
import { convertNumber } from "./api.js";

export function initializeConverter() {
  let direction = "decimal",
    currentNumber = null,
    clipboardValue = "";
  function romanHTML(s) {
    return s
      .replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[character],
      )
      .replace(/\(([IVXLCDM]+)\)/g, '<span class="overline">$1</span>');
  }
  let requestVersion = 0;
  let pendingRequest;
  async function updateConversion() {
    const version = ++requestVersion;
    pendingRequest?.abort();
    pendingRequest = new AbortController();
    const raw = element("number").value.trim(),
      ext = element("extended").checked;
    element("input-hint").textContent =
      direction === "decimal"
        ? "Целое число от 1 до " + (ext ? "3 999 999" : "3 999")
        : ext
          ? "Латинские знаки · (IV)D = 4 500"
          : "Латинские I, V, X, L, C, D, M";
    element("error").textContent = "";
    element("number").removeAttribute("aria-invalid");
    currentNumber = null;
    try {
      if (!raw) {
        element("result").textContent = "—";
        element("equation").textContent =
          "Введите число, чтобы увидеть перевод";
        element("steps").replaceChildren();
        element("sum").textContent = "";
        element("explanation").textContent =
          "Здесь появится разбор вашего числа.";
        element("copy").disabled = true;
        return;
      }
      element("copy").disabled = true;
      element("result").textContent = "…";
      element("equation").textContent = "Переводим число…";
      element("steps").replaceChildren();
      element("sum").textContent = "";
      element("explanation").textContent = "";
      element("result-note").textContent = "Ожидаем ответ сервера";
      const result = await convertNumber(
        { value: raw, direction, extended: ext },
        pendingRequest.signal,
      );
      if (version !== requestVersion) return;
      const n = result.decimal;
      clipboardValue = direction === "decimal" ? result.roman : String(n);
      currentNumber = n;
      const r = result.roman;
      element("result").innerHTML =
        direction === "decimal" ? romanHTML(r) : formatNumber(n);
      element("result").classList.toggle(
        "long",
        direction === "decimal" && r.length > 9,
      );
      element("equation").textContent = formatNumber(n) + " = " + r;
      element("result-note").textContent =
        n > 3999 ? "Надчёркивание = × 1 000" : "Классическая запись";
      element("copy").disabled = false;
      const groups = result.groups;
      element("sum").textContent =
        groups.map((x) => formatNumber(x.value)).join(" + ") +
        " = " +
        formatNumber(n);
      element("steps").innerHTML = groups
        .map(
          (x, i) =>
            '<div class="step"><small>ШАГ ' +
            String(i + 1).padStart(2, "0") +
            "</small><strong>" +
            romanHTML(x.roman) +
            "</strong><span>" +
            formatNumber(x.value) +
            "</span></div>",
        )
        .join("");
      const subtract = r.match(/IV|IX|XL|XC|CD|CM/g);
      element("explanation").textContent =
        n > 3999
          ? "Черта умножает группу на 1 000. В текстовой записи эту группу заключаем в скобки."
          : subtract
            ? "В парах " +
              [...new Set(subtract)].join(", ") +
              " меньший знак вычитается из большего. Затем складываем полученные значения."
            : "Читаем слева направо. Складываем значения от большего к меньшему.";
    } catch (e) {
      if (version !== requestVersion || e.name === "AbortError") return;
      element("error").textContent = e.message;
      element("number").setAttribute("aria-invalid", "true");
      element("result").textContent = "—";
      element("equation").textContent = "Проверьте запись слева";
      element("copy").disabled = true;
      element("steps").replaceChildren();
      element("sum").textContent = "";
      element("explanation").textContent =
        "Исправьте запись, чтобы увидеть разбор.";
      element("result-note").textContent = "Ожидаем корректное число";
    }
  }
  function setDirection(d) {
    const n = currentNumber;
    direction = d;
    element("decimal-mode").classList.toggle("selected", d === "decimal");
    element("roman-mode").classList.toggle("selected", d === "roman");
    element("decimal-mode").setAttribute(
      "aria-pressed",
      String(d === "decimal"),
    );
    element("roman-mode").setAttribute("aria-pressed", String(d === "roman"));
    element("input-label").textContent =
      d === "decimal"
        ? "Число в десятичной системе"
        : "Число в римской системе";
    element("result-label").textContent =
      d === "decimal" ? "РИМСКАЯ ЗАПИСЬ" : "ДЕСЯТИЧНАЯ ЗАПИСЬ";
    element("number").inputMode = d === "decimal" ? "numeric" : "text";
    element("number").value = n
      ? d === "decimal"
        ? String(n)
        : toRoman(n, element("extended").checked)
      : "";
    document
      .querySelectorAll("[data-example]")
      .forEach(
        (b) =>
          (b.textContent =
            d === "decimal"
              ? b.dataset.example
              : toRoman(Number(b.dataset.example))),
      );
    updateConversion();
  }
  element("decimal-mode").onclick = () => setDirection("decimal");
  element("roman-mode").onclick = () => setDirection("roman");
  element("swap").onclick = () =>
    setDirection(direction === "decimal" ? "roman" : "decimal");
  element("number").oninput = updateConversion;
  element("extended").onchange = updateConversion;
  element("clear").onclick = () => {
    element("number").value = "";
    updateConversion();
    element("number").focus();
  };
  document.querySelectorAll("[data-example]").forEach(
    (b) =>
      (b.onclick = () => {
        element("number").value = b.textContent;
        updateConversion();
      }),
  );
  element("copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(clipboardValue);
      notify(
        clipboardValue.includes("(")
          ? "Скопировано: скобки обозначают надчёркивание"
          : "Результат скопирован",
      );
    } catch {
      notify("Не удалось скопировать. Выделите результат вручную.");
    }
  };
  const alphabet = [
    ["I", 1],
    ["V", 5],
    ["X", 10],
    ["L", 50],
    ["C", 100],
    ["D", 500],
    ["M", 1000],
  ];
  element("symbols").innerHTML = alphabet
    .map(
      ([s, n]) =>
        '<button class="symbol" data-value="' +
        n +
        '" title="Перевести ' +
        n +
        '"><strong>' +
        s +
        "</strong><span>" +
        formatNumber(n) +
        "</span></button>",
    )
    .join("");
  document.querySelectorAll("[data-value]").forEach(
    (b) =>
      (b.onclick = () => {
        element("number").value =
          direction === "decimal"
            ? b.dataset.value
            : toRoman(Number(b.dataset.value));
        updateConversion();
      }),
  );

  updateConversion();
}
