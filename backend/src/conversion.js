import { toRoman, fromRoman, decompose } from "../../shared/roman.js";

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function convert(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "INVALID_REQUEST", "Ожидается JSON-объект.");
  }
  const { value, direction, extended = false } = input;
  if (
    typeof value !== "string" ||
    value.length > 64 ||
    !["decimal", "roman"].includes(direction) ||
    typeof extended !== "boolean"
  ) {
    throw new HttpError(
      400,
      "INVALID_REQUEST",
      "Укажите value (строка до 64 символов), direction (decimal или roman) и extended (boolean).",
    );
  }
  const normalized = value.trim();
  try {
    if (direction === "decimal" && !/^\d+$/.test(normalized)) {
      throw new Error(
        "Введите целое положительное число без пробелов, дробей и знаков.",
      );
    }
    const decimal =
      direction === "decimal"
        ? Number(normalized)
        : fromRoman(normalized, extended);
    const roman = toRoman(decimal, extended);
    return { decimal, roman, groups: decompose(decimal) };
  } catch (error) {
    throw new HttpError(422, "INVALID_NUMERAL", error.message);
  }
}
