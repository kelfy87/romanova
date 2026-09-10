export async function convertNumber(input, signal) {
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
