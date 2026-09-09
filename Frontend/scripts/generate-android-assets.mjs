import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "public", "icon.svg");
const assetsDir = join(root, "assets");
mkdirSync(assetsDir, { recursive: true });

const sourceSvg = readFileSync(svgPath, "utf8");
const inner = sourceSvg
  .replace(/<\?xml[^>]*>/i, "")
  .replace(/<svg[^>]*>/i, "")
  .replace(/<\/svg>\s*$/i, "")
  .trim();

function render(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: "rgba(0,0,0,0)",
  })
    .render()
    .asPng();
}

writeFileSync(join(assetsDir, "logo.png"), render(sourceSvg, 1024));

const splashSize = 2732;
const iconSize = 1024;
const origin = (splashSize - iconSize) / 2;
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${splashSize} ${splashSize}">
  <rect width="${splashSize}" height="${splashSize}" fill="#121212"/>
  <g transform="translate(${origin} ${origin}) scale(${iconSize / 512})">${inner}</g>
</svg>`;
writeFileSync(join(assetsDir, "splash.png"), render(splashSvg, splashSize));

console.log(`Wrote ${join(assetsDir, "logo.png")} and splash.png`);
