#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const standardsDir = path.join(__dirname, "..", "standards");
const targetDir = path.join(process.cwd(), "coding-standards");

const files = fs
  .readdirSync(standardsDir)
  .filter((f) => f.endsWith(".md"));

if (files.length === 0) {
  console.error("No standard files found in package.");
  process.exit(1);
}

const existed = fs.existsSync(targetDir);
if (existed) {
  console.log("coding-standards/ already exists — overwriting files.\n");
}

fs.mkdirSync(targetDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(standardsDir, file), path.join(targetDir, file));
}

console.log(
  `Copied ${files.length} coding standard files to coding-standards/:\n`
);
for (const file of files) {
  console.log(`  - ${file}`);
}
console.log("\nDone!");
