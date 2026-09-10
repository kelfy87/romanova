import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../backend/src/app.js";

const server = createApp();
let origin;
before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});
const post = (body, headers = { "Content-Type": "application/json" }) =>
  fetch(origin + "/api/convert", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("converts both directions through HTTP", async () => {
  const response = await post({ value: "2026", direction: "decimal" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    decimal: 2026,
    roman: "MMXXVI",
    groups: [
      { value: 2000, roman: "MM" },
      { value: 20, roman: "XX" },
      { value: 6, roman: "VI" },
    ],
  });
  const reverse = await post({
    value: "(IV)D",
    direction: "roman",
    extended: true,
  });
  assert.equal((await reverse.json()).decimal, 4500);
});
test("validates JSON shape, numeral and body limit", async () => {
  for (const [body, status] of [
    ["{", 400],
    [{}, 400],
    [{ value: 49, direction: "decimal" }, 400],
    [{ value: "49", direction: "unknown" }, 400],
    [{ value: "49", direction: "decimal", extended: "yes" }, 400],
    [{ value: "IIII", direction: "roman" }, 422],
    [{ value: "0", direction: "decimal" }, 422],
    [" ".repeat(5000), 413],
  ]) {
    const response = await post(body);
    assert.equal(response.status, status);
    assert.equal(typeof (await response.json()).error.message, "string");
  }
  assert.equal(
    (await post("{}", { "Content-Type": "text/plain" })).status,
    415,
  );
  const wrongMethod = await fetch(origin + "/api/convert");
  assert.equal(wrongMethod.status, 405);
  assert.equal(wrongMethod.headers.get("allow"), "POST");
});
test("serves UI and modules; does not expose backend or repository files", async () => {
  for (const path of [
    "/",
    "/src/main.js",
    "/styles/main.css",
    "/shared/roman.js",
    "/public/icon.svg",
  ]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get("content-security-policy"));
  }
  for (const path of [
    "/backend/src/server.js",
    "/package.json",
    "/.env",
    "/src/%2e%2e%2f%2e%2e%2fbackend/src/server.js",
  ]) {
    assert.equal((await fetch(origin + path)).status, 404, path);
  }
  const head = await fetch(origin + "/", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal((await fetch(origin + "/api/health")).status, 200);
});
