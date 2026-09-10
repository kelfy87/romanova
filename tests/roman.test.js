import test from "node:test";
import assert from "node:assert/strict";
import { toRoman, fromRoman, decompose } from "../shared/roman.js";

test("known canonical representations", () => {
  for (const [number, roman] of [
    [1, "I"],
    [4, "IV"],
    [9, "IX"],
    [49, "XLIX"],
    [944, "CMXLIV"],
    [1994, "MCMXCIV"],
    [3999, "MMMCMXCIX"],
  ]) {
    assert.equal(toRoman(number), roman);
    assert.equal(fromRoman(roman), number);
  }
});
test("every standard numeral round trips", () => {
  for (let number = 1; number <= 3999; number++)
    assert.equal(fromRoman(toRoman(number)), number);
});
test("extended notation and decomposition", () => {
  for (const [number, roman] of [
    [4000, "(IV)"],
    [4500, "(IV)D"],
    [1000000, "(M)"],
    [3999999, "(MMMCMXCIX)CMXCIX"],
  ]) {
    assert.equal(toRoman(number, true), roman);
    assert.equal(fromRoman(roman, true), number);
    assert.equal(
      decompose(number).reduce((total, group) => total + group.value, 0),
      number,
    );
  }
});
test("rejects invalid and noncanonical input", () => {
  for (const numeral of [
    "IIII",
    "IL",
    "IC",
    "VX",
    "IIV",
    "MMMM",
    "ХХ",
    "(IV)",
    "",
  ])
    assert.throws(() => fromRoman(numeral));
  for (const numeral of ["(I)", "((IV))", "(IV)M"])
    assert.throws(() => fromRoman(numeral, true));
  for (const number of [0, -1, 1.5, 4000, Infinity, NaN])
    assert.throws(() => toRoman(number));
  assert.throws(() => fromRoman(null));
  assert.equal(fromRoman(" mcmxciv "), 1994);
});
