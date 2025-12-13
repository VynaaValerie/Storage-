"use strict";

const express = require("express");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const mime = require("mime-types");

const app = express();
const PORT = process.env.PORT || 3000;

// Folder yang dibrowse (default: ./storage)
const BASE_DIR = path.resolve(process.env.BASE_DIR || path.join(__dirname, "storage"));

// ---------- Helpers ----------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanPath(input) {
  let p = String(input || "");
  try {
    p = decodeURIComponent(p);
  } catch (_) {}

  p = p.replace(/\\/g, "/");
  while (p.startsWith("/")) p = p.slice(1);

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

  const resolved = path.resolve(abs);
  if (!resolved.startsWith(BASE_DIR)) throw new Error("Bad path");
  return resolved;
}

async function statSafe(p) {
  try {
    return await fsp.stat(p);
  } catch {
    return null;
  }
}

function isTextLikeByExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const textLike = new Set([
    ".txt", ".md", ".json", ".js", ".mjs", ".cjs",
    ".ts", ".tsx", ".jsx",
    ".html", ".css", ".xml", ".csv", ".log", ".yml", ".yaml",
    ".env", ".gitignore"
  ]);
  return textLike.has(ext);
}

function guessHljsLang(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return "javascript";
  if (ext === ".ts" || ext === ".tsx") return "typescript";
  if (ext === ".jsx") return "javascript";
  if (ext === ".json") return "json";
  if (ext === ".html") return "xml";
  if (ext === ".xml") return "xml";
  if (ext === ".css") return "css";
  if (ext === ".md") return "markdown";
  if (ext === ".yml" || ext === ".yaml") return "yaml";
  if (ext === ".csv") return "csv";
  return ""; // biar hljs auto-detect
}

// ---------- Frontend static ----------
app.use(express.static(__dirname));

// ---------- API: List directory ----------
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

// ---------- RAW: benar-benar raw (apa adanya), untuk file text ----------
app.get("/api/raw", async (req, res) => {
  try {
    const rel = req.query.path || "";
    const filePath = absFromRel(rel);

    const st = await statSafe(filePath);
    if (!st) return res.status(404).send("Not found");
    if (!st.isFile()) return res.status(400).send("Not a file");

    if (!isTextLikeByExt(filePath)) {
      return res.status(415).send("Not a text-like file. Use /api/view for binary preview.");
    }

    const buf = await fsp.readFile(filePath); // jangan utf8 supaya persis byte-nya
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
    res.send(buf);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

// ---------- VIEW: semua file (binary/image/audio/pdf) inline ----------
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

// ---------- CODE VIEW ala GitHub (highlight + line number + raw link) ----------
app.get("/api/code", async (req, res) => {
  try {
    const rel = req.query.path || "";
    const filePath = absFromRel(rel);

    const st = await statSafe(filePath);
    if (!st) return res.status(404).send("Not found");
    if (!st.isFile()) return res.status(400).send("Not a file");

    if (!isTextLikeByExt(filePath)) {
      // kalau bukan text, lempar ke viewer normal
      return res.redirect(`/api/view?path=${encodeURIComponent(cleanPath(rel))}`);
    }

    const raw = await fsp.readFile(filePath, "utf8");

    // normalize newline biar konsisten
    const normalized = raw.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");

    const lang = guessHljsLang(filePath);
    const safeTitle = escapeHtml(cleanPath(rel) || path.basename(filePath));
    const rawUrl = `/api/raw?path=${encodeURIComponent(cleanPath(rel))}`;

    // bikin HTML baris-per-baris (nomor baris via CSS counter)
    const codeLinesHtml = lines
      .map((ln) => `<span class="line">${escapeHtml(ln)}</span>`)
      .join("\n");

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>

  <!-- highlight.js (CDN) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css">

  <style>
    :root{
      --bg:#0d1117;
      --panel:#161b22;
      --border:#30363d;
      --text:#c9d1d9;
      --muted:#8b949e;
      --btn:#21262d;
      --btnHover:#30363d;
      --accent:#58a6ff;
    }
    body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      background:var(--bg); color:var(--text); }
    .topbar{
      position:sticky; top:0; z-index:10;
      display:flex; gap:10px; align-items:center; justify-content:space-between;
      padding:10px 12px; background:rgba(13,17,23,.95); backdrop-filter: blur(6px);
      border-bottom:1px solid var(--border);
    }
    .title{
      font-size:14px; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      max-width:70vw;
    }
    .actions{ display:flex; gap:8px; align-items:center; }
    .btn{
      display:inline-flex; align-items:center; gap:8px;
      background:var(--btn); color:var(--text); border:1px solid var(--border);
      padding:7px 10px; border-radius:8px; text-decoration:none; font-size:13px;
    }
    .btn:hover{ background:var(--btnHover); }
    .hint{ font-size:12px; color:var(--muted); }

    .wrap{ padding: 12px; }
    .panel{
      background:var(--panel); border:1px solid var(--border); border-radius:12px;
      overflow:hidden;
    }

    pre{ margin:0; overflow:auto; }
    code{ display:block; padding:12px; font-size:13px; line-height:1.55; }

    /* line number */
    pre { counter-reset: line; }
    .line{
      display:block;
      padding-left:56px;
      position:relative;
      white-space:pre;
    }
    .line::before{
      counter-increment: line;
      content: counter(line);
      position:absolute;
      left:0;
      width:46px;
      text-align:right;
      color:var(--muted);
      padding-right:10px;
      user-select:none;
    }
    .line:hover{ background: rgba(110,118,129,.12); }

    /* mobile comfort */
    @media (max-width: 480px){
      .title{ max-width:56vw; }
      .line{ padding-left:48px; }
      .line::before{ width:38px; }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div>
      <div class="title">${safeTitle}</div>
      <div class="hint">Code view • Tap Raw for original</div>
    </div>
    <div class="actions">
      <a class="btn" href="${rawUrl}" target="_blank" rel="noopener">Raw</a>
      <a class="btn" href="javascript:void(0)" id="copyBtn">Copy</a>
    </div>
  </div>

  <div class="wrap">
    <div class="panel">
      <pre><code id="code" class="${lang ? `language-${lang}` : ""}">${codeLinesHtml}</code></pre>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/highlight.min.js"></script>
  <script>
    // highlight (auto or forced)
    try { hljs.highlightAll(); } catch(e) {}

    // Copy raw text (tanpa line number)
    document.getElementById("copyBtn").addEventListener("click", async () => {
      try {
        const res = await fetch("${rawUrl}");
        const txt = await res.text();
        await navigator.clipboard.writeText(txt);
        alert("Copied!");
      } catch (e) {
        alert("Copy failed: " + e.message);
      }
    });
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("Storage Viewer running:");
  console.log("PORT:", PORT);
  console.log("BASE_DIR:", BASE_DIR);
});