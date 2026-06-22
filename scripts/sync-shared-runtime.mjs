#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(
  process.argv.find((arg) => arg.startsWith("--root="))?.slice("--root=".length) ??
    ".",
);
const checkOnly = process.argv.includes("--check");
const sharedRoot = path.join(repoRoot, "shared/runtime");
const targets = ["codex", "gemini"];

const sharedDirectories = [
  ".agents/.shared",
];

function listFiles(root) {
  if (!fs.existsSync(root)) return [];

  const files = [];

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.name === "__pycache__" || entry.name.endsWith(".pyc")) {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile()) {
        files.push(path.relative(root, entryPath));
      }
    }
  }

  walk(root);
  return files.sort();
}

function isInsideSharedDirectory(relativePath) {
  return sharedDirectories.some(
    (directory) =>
      relativePath === directory || relativePath.startsWith(`${directory}${path.sep}`),
  );
}

function filesMatch(source, destination) {
  if (!fs.existsSync(source) || !fs.existsSync(destination)) return false;
  return fs.readFileSync(source).equals(fs.readFileSync(destination));
}

function directoriesMatch(source, destination) {
  const sourceFiles = listFiles(source);
  const destinationFiles = listFiles(destination);

  if (JSON.stringify(sourceFiles) !== JSON.stringify(destinationFiles)) {
    return false;
  }

  return sourceFiles.every((relativePath) =>
    filesMatch(
      path.join(source, relativePath),
      path.join(destination, relativePath),
    ),
  );
}

function syncFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function syncDirectory(source, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, {
    recursive: true,
    filter: (sourcePath) =>
      !sourcePath.split(path.sep).includes("__pycache__") &&
      !sourcePath.endsWith(".pyc"),
  });
}

const mismatches = [];
const sharedFiles = listFiles(sharedRoot).filter(
  (relativePath) => !isInsideSharedDirectory(relativePath),
);

for (const target of targets) {
  const targetRoot = path.join(repoRoot, "templates", target);

  for (const relativePath of sharedFiles) {
    const source = path.join(sharedRoot, relativePath);
    const destination = path.join(targetRoot, relativePath);

    if (!filesMatch(source, destination)) {
      mismatches.push(`${target}:${relativePath}`);
      if (!checkOnly) syncFile(source, destination);
    }
  }

  for (const relativePath of sharedDirectories) {
    const source = path.join(sharedRoot, relativePath);
    const destination = path.join(targetRoot, relativePath);

    if (!directoriesMatch(source, destination)) {
      mismatches.push(`${target}:${relativePath}/`);
      if (!checkOnly) syncDirectory(source, destination);
    }
  }
}

if (checkOnly && mismatches.length > 0) {
  console.error("Shared runtime is out of sync:");
  for (const mismatch of mismatches) {
    console.error(`  - ${mismatch}`);
  }
  process.exit(1);
}

if (checkOnly) {
  console.log("Shared runtime check passed.");
} else if (mismatches.length > 0) {
  console.log(`Shared runtime synchronized: ${mismatches.length} path(s).`);
} else {
  console.log("Shared runtime already synchronized.");
}
