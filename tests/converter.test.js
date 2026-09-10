import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { toRoman } from "../shared/roman.js";

// Exercise the real controller with a small DOM boundary and controlled HTTP promises.
const source = (
  await readFile(
    new URL("../frontend/src/converter.js", import.meta.url),
    "utf8",
  )
)
  .replace(/^import[\s\S]*?;\s*/gm, "")
  .replace(
    "export function initializeConverter",
    "function initializeConverter",
  );

function setup() {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id))
      elements.set(id, {
        value: id === "number" ? "2026" : "",
        checked: false,
        textContent: "",
        innerHTML: "",
        disabled: false,
        classList: { toggle() {} },
        setAttribute() {},
        removeAttribute() {},
        replaceChildren() {
          this.innerHTML = "";
        },
        focus() {},
      });
    return elements.get(id);
  }
  const requests = [];
  const context = {
    element,
    toRoman,
    formatNumber: (value) => value.toLocaleString("ru-RU"),
    notify() {},
    AbortController,
    document: { querySelectorAll: () => [] },
    convertNumber: (input, signal) =>
      new Promise((resolve, reject) =>
        requests.push({ input, signal, resolve, reject }),
      ),
  };
  runInNewContext(source + "\ninitializeConverter();", context);
  return { element, requests };
}
const settle = () => new Promise((resolve) => setImmediate(resolve));
const result = (decimal, roman) => ({
  decimal,
  roman,
  groups: [{ value: decimal, roman }],
});

test("new input wins even when the canceled request resolves last", async () => {
  const { element, requests } = setup();
  element("number").value = "49";
  element("number").oninput();
  assert.equal(requests[0].signal.aborted, true);
  requests[1].resolve(result(49, "XLIX"));
  await settle();
  requests[0].resolve(result(2026, "MMXXVI"));
  await settle();
  assert.equal(element("result").innerHTML, "XLIX");
  assert.equal(element("copy").disabled, false);
});

test("clearing input ignores pending response; network failure disables copying", async () => {
  const { element, requests } = setup();
  element("clear").onclick();
  requests[0].resolve(result(2026, "MMXXVI"));
  await settle();
  assert.equal(element("result").textContent, "—");
  assert.equal(element("copy").disabled, true);
  element("number").value = "49";
  element("number").oninput();
  requests[1].reject(new Error("Нет соединения"));
  await settle();
  assert.equal(element("error").textContent, "Нет соединения");
  assert.equal(element("copy").disabled, true);
});
