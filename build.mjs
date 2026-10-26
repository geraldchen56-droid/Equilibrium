// Builds the whole site into ONE self-contained file: dist/equilibrium.html
// Usage: node build.mjs        (add --watch to rebuild on save)
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const watch = process.argv.includes("--watch");

async function build() {
  const result = await esbuild.build({
    entryPoints: ["src/app.ts"],
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2020",
    write: false,
  });
  const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
  const css = readFileSync("src/styles.css", "utf8");
  const html = readFileSync("src/index.template.html", "utf8")
    .replace("/*__CSS__*/", () => css)
    .replace("/*__JS__*/", () => js);
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/equilibrium.html", html);
  // Vercel serves index.html, so keep a copy ready for releases.
  writeFileSync("dist/index.html", html);
  console.log(`Built dist/equilibrium.html (${(html.length / 1024).toFixed(0)} KB)`);
}

await build();
if (watch) {
  const { watch: fsWatch } = await import("node:fs");
  fsWatch("src", { recursive: true }, () => build().catch((e) => console.error(e.message)));
  console.log("Watching src/ ...");
}
