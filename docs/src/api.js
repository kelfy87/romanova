import { decompose, fromRoman, toRoman } from "../shared/roman.js";

function convertLocally({ value, direction, extended }) {
  const normalized = value.trim();

  if (direction === "decimal" && !/^\d+$/.test(normalized)) {
    throw new Error(
      "Введите целое положительное число без пробелов, дробей и знаков.",
    );
  }

  const decimal =
    direction === "decimal"
      ? Number(normalized)
      : fromRoman(normalized, extended);

  return {
    decimal,
    roman: toRoman(decimal, extended),
    groups: decompose(decimal),
  };
}

export async function convertNumber(input, signal) {
  if (document.documentElement.dataset.runtime === "static") {
    await Promise.resolve();
    if (signal?.aborted)
      throw new DOMException("Request aborted", "AbortError");
    return convertLocally(input);
  }

  let response;
  try {
    response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Нет соединения с сервером. Проверьте подключение и повторите ввод.",
    );
  }
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error?.message ?? "Сервер временно недоступен.");
  return payload;
}
