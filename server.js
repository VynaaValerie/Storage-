"use strict";

const express = require("express");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const mime = require("mime-types");

const app = express();
const PORT = process.env.PORT || 3000;

// Folder yang dibrowse (default: ./storage)
// Kamu bisa set: BASE_DIR=/path/ke/folder node server.js
const BASE_DIR = path.resolve(process.env.BASE_DIR || path.join(__dirname, "storage"));

// --- Helpers ---
function cleanPath(input) {
  // pastikan string, decode aman
  let p = String(input || "");
  try {
    p = decodeURIComponent(p);
  } catch (_) {}

  // normalisasi separator
  p = p.replace(/\\/g, "/");

  // hilangkan leading slash
  while (p.startsWith("/")) p = p.slice(1);

  // normalkan dan cegah path traversal
  const normalized = path.posix.normalize(p);

  if (normalized === "." || normalized === "") return "";
  if (normalized.startsWith("..") || normalized.includes("/..")) {
    throw new Error("Bad path");
  }
  return normalized;
}

function absFromRel(rel) {
  const safeRel = cleanPath(rel);
  const abs = path.join(BASE_DIR, safeRel);

  // extra safety: pastikan tetap di BASE_DIR
  const resolved = path.resolve(abs);
  if (!resolved.startsWith(BASE_DIR)) throw new Error("Bad path");

  return resolved;
}

async function statSafe(filePath) {
  try {
    return await fsp.stat(filePath);
  } catch {
    return null;
  }
}

// --- Static (frontend) ---
// taruh index.html + script.js di folder yang sama dengan server.js
app.use(express.static(__dirname));

// --- API: List directory ---
app.get("/api/list", async (req, res) => {
  try {
    const rel = req.query.path || "";
    const dirPath = absFromRel(rel);

    const st = await statSafe(dirPath);
    if (!st) return res.status(404).json({ ok: false, error: "Not found" });
    if (!st.isDirectory()) return res.status(400).json({ ok: false, error: "Not a directory" });

    const entries = await fsp.readdir(dirPath, { withFileTypes: true });

    const items = [];
    for (const ent of entries) {
      const full = path.join(dirPath, ent.name);
      const s = await statSafe(full);

      items.push({
        name: ent.name,
        type: ent.isDirectory() ? "folder" : "file",
        size: s && s.isFile() ? s.size : null,
        mtime: s ? s.mtimeMs : null
      });
    }

    // sort folder dulu, lalu alfabet
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      ok: true,
      base: path.basename(BASE_DIR),
      path: cleanPath(rel),
      items
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// --- API: RAW text (khusus file text) ---
app.get("/api/raw", async (req, res) => {
  try {
    const rel = req.query.path || "";
    const filePath = absFromRel(rel);

    const st = await statSafe(filePath);
    if (!st) return res.status(404).send("Not found");
    if (!st.isFile()) return res.status(400).send("Not a file");

    const ext = path.extname(filePath).toLowerCase();
    const textLike = new Set([
      ".txt", ".md", ".json", ".js", ".mjs", ".cjs",
      ".ts", ".tsx", ".jsx",
      ".html", ".css", ".xml", ".csv", ".log", ".yml", ".yaml"
    ]);

    if (!textLike.has(ext)) {
      return res.status(415).send("This file is not text-like. Use /api/view for inline preview.");
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    const content = await fsp.readFile(filePath, "utf8");
    res.send(content);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// --- API: VIEW (SEMUA jenis file, inline + MIME bener) ---
app.get("/api/view", async (req, res) => {
  try {
    const rel = req.query.path || "";
    const filePath = absFromRel(rel);

    const st = await statSafe(filePath);
    if (!st) return res.status(404).send("Not found");
    if (!st.isFile()) return res.status(400).send("Not a file");

    const type = mime.lookup(filePath) || "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);

    const stream = fs.createReadStream(filePath);
    stream.on("error", (e) => res.status(500).send("Error: " + e.message));
    stream.pipe(res);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Storage Viewer running:");
  console.log("PORT:", PORT);
  console.log("BASE_DIR:", BASE_DIR);
});