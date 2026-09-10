import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT должен быть целым числом от 1 до 65535.");
}
const server = createApp();
server.listen(port, host, () =>
  console.log(`ROMANOVA: http://${host}:${port}`),
);
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => {
    server.closeAllConnections();
    process.exit(1);
  }, 5000).unref();
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
