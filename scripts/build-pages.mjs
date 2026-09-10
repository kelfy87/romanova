import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(projectRoot, "frontend");
const destination = resolve(projectRoot, "docs");

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
await mkdir(resolve(destination, "shared"), { recursive: true });
await cp(
  resolve(projectRoot, "shared/roman.js"),
  resolve(destination, "shared/roman.js"),
);

const indexPath = resolve(destination, "index.html");
const index = await readFile(indexPath, "utf8");
await writeFile(
  indexPath,
  index
    .replace('data-runtime="server"', 'data-runtime="static"')
    .replaceAll('href="/', 'href="./')
    .replaceAll('src="/', 'src="./'),
);

await writeFile(resolve(destination, ".nojekyll"), "");

console.log("GitHub Pages build written to docs/");
