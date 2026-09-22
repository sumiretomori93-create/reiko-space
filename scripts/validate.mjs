import fs from "node:fs";

const html = fs.readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/);
if (!script) throw new Error("Inline script is missing");
new Function(script[1]);

for (const id of ["file", "projects", "motifs", "fragments", "project-dialog"]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required element: ${id}`);
}

if (/https?:\/\//.test(html.replace(/https?:\/\/www\.w3\.org\/2000\/svg/g, ""))) {
  throw new Error("Unexpected external dependency in static page");
}

console.log("Validated HTML structure, local assets, and inline JavaScript");
