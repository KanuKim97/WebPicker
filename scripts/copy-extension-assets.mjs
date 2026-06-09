import { copyFile, cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const copies = [
  ["manifest.json", "dist/manifest.json"],
  ["rules/ollama-request-headers.json", "dist/rules/ollama-request-headers.json"]
];

for (const [from, to] of copies) {
  const target = resolve(root, to);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, from), target);
}

await cp(resolve(root, "_locales"), resolve(root, "dist/_locales"), {
  recursive: true,
});
