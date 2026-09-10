import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, sep, extname } from "node:path";
import { convert, HttpError } from "./conversion.js";

const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const FRONTEND_ROOT = resolve(PROJECT_ROOT, "frontend");
const MAX_BODY_BYTES = 4096;
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  if (
    request.headers["content-type"]?.split(";")[0].trim() !== "application/json"
  ) {
    throw new HttpError(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Используйте Content-Type: application/json.",
    );
  }
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        chunks.length = 0;
        reject(
          new HttpError(
            413,
            "BODY_TOO_LARGE",
            "Размер запроса превышает 4 КБ.",
          ),
        );
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (size > MAX_BODY_BYTES) return;
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HttpError(400, "INVALID_JSON", "Некорректный JSON."));
      }
    });
    request.on("error", reject);
    request.on("aborted", () =>
      reject(new HttpError(400, "ABORTED_REQUEST", "Запрос прерван.")),
    );
  });
}

function staticFile(pathname) {
  if (pathname === "/") return resolve(FRONTEND_ROOT, "index.html");
  if (pathname === "/shared/roman.js")
    return resolve(PROJECT_ROOT, "shared/roman.js");
  if (!/^\/(src|styles|public)\//.test(pathname)) return null;
  const path = resolve(FRONTEND_ROOT, "." + pathname);
  if (!path.startsWith(FRONTEND_ROOT + sep)) return null;
  if (![".js", ".css", ".svg"].includes(extname(path))) return null;
  return path;
}

export function createApp() {
  const server = createServer(async (request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    try {
      let pathname;
      try {
        pathname = decodeURIComponent(
          new URL(request.url, "http://localhost").pathname,
        );
      } catch {
        throw new HttpError(400, "INVALID_URL", "Некорректный адрес.");
      }
      if (pathname === "/api/convert") {
        if (request.method !== "POST") {
          response.setHeader("Allow", "POST");
          throw new HttpError(405, "METHOD_NOT_ALLOWED", "Используйте POST.");
        }
        return sendJson(response, 200, convert(await readJson(request)));
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        response.setHeader("Allow", "GET, HEAD");
        throw new HttpError(
          405,
          "METHOD_NOT_ALLOWED",
          "Метод не поддерживается.",
        );
      }
      if (pathname === "/api/health")
        return sendJson(response, 200, { status: "ok" });
      const path = staticFile(pathname);
      if (!path) throw new HttpError(404, "NOT_FOUND", "Страница не найдена.");
      let content;
      try {
        content = await readFile(path);
      } catch (error) {
        if (["ENOENT", "EISDIR", "ENOTDIR"].includes(error.code))
          throw new HttpError(404, "NOT_FOUND", "Файл не найден.");
        throw error;
      }
      response.writeHead(200, {
        "Content-Type": CONTENT_TYPES[extname(path)],
        "Cache-Control": "no-cache",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(error);
      if (!response.destroyed)
        sendJson(response, error.status ?? 500, {
          error: {
            code: error.code ?? "INTERNAL_ERROR",
            message:
              error instanceof HttpError
                ? error.message
                : "Внутренняя ошибка сервера.",
          },
        });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.setTimeout(15000, (socket) => socket.destroy());
  return server;
}
