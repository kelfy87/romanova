const STANDARD_LIMIT = 3999;
const EXTENDED_LIMIT = 3999999;
const MAX_INPUT_LENGTH = 64;
const SYMBOL_VALUES = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const ROMAN_TOKENS = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

function encodeStandard(number) {
  let remainder = number;
  let result = "";
  for (const [value, symbol] of ROMAN_TOKENS) {
    const count = Math.floor(remainder / value);
    result += symbol.repeat(count);
    remainder %= value;
  }
  return result;
}

export function toRoman(number, extended = false) {
  const limit = extended ? EXTENDED_LIMIT : STANDARD_LIMIT;
  if (!Number.isInteger(number) || number < 1 || number > limit) {
    throw new Error(
      `Введите целое число от 1 до ${limit.toLocaleString("ru-RU")}.`,
    );
  }
  if (number <= STANDARD_LIMIT) return encodeStandard(number);
  return `(${encodeStandard(Math.floor(number / 1000))})${encodeStandard(number % 1000)}`;
}

function sumSymbols(symbols) {
  let total = 0;
  for (let index = 0; index < symbols.length; index++) {
    const current = SYMBOL_VALUES[symbols[index]];
    const next = SYMBOL_VALUES[symbols[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

export function fromRoman(input, extended = false) {
  if (typeof input !== "string" || input.length > MAX_INPUT_LENGTH) {
    throw new Error(
      "Римская запись должна быть строкой длиной до 64 символов.",
    );
  }
  const normalized = input.trim().toUpperCase();
  if (!normalized) throw new Error("Введите римское число.");
  if (!/^[IVXLCDM()]+$/.test(normalized)) {
    throw new Error(
      "Используйте латинские I, V, X, L, C, D, M" +
        (extended ? " и скобки для тысяч." : "."),
    );
  }
  let number;
  if (/[()]/.test(normalized)) {
    if (!extended)
      throw new Error("Для записи в скобках включите «Большие числа».");
    const match = normalized.match(/^\(([IVXLCDM]+)\)([IVXLCDM]*)$/);
    if (!match) throw new Error("Формат больших чисел: (IV)D = 4 500.");
    number = sumSymbols(match[1]) * 1000 + sumSymbols(match[2]);
  } else {
    number = sumSymbols(normalized);
  }
  if (number < 1 || number > (extended ? EXTENDED_LIMIT : STANDARD_LIMIT)) {
    throw new Error("Число выходит за пределы выбранного режима.");
  }
  // A numeric sum alone accepts forms such as IL. Re-encoding enforces canonical notation.
  const canonical = toRoman(number, extended);
  if (normalized !== canonical) {
    throw new Error(
      `Нестандартная запись. Для ${number.toLocaleString("ru-RU")} используйте ${canonical}.`,
    );
  }
  return number;
}

export function decompose(number) {
  toRoman(number, true);
  const groups = [];
  let remainder = number;
  for (const place of [1000000, 100000, 10000, 1000, 100, 10, 1]) {
    const value = Math.floor(remainder / place) * place;
    if (value === 0) continue;
    groups.push({ value, roman: toRoman(value, true) });
    remainder -= value;
  }
  return groups;
}
