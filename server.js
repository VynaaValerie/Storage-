
/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 

• Menerima pembuatan script bot
• Menerima perbaikan script atau fitur bot
• Menerima pembuatan fitur bot
• Menerima semua kebutuhan bot
• Menerima Jadi Bot

ℹ️ Information

• Pembayaran bisa dicicil
• Bisa bayar di awal atau akhir
• Pembayaran melalu QRIS Only
• Testimoni Banyak

Aturan:
1. Dilarang memperjualbelikan script ini.
2. Hak cipta milik Vynaa Valerie.

"Dan janganlah kamu makan harta di antara kamu dengan jalan yang batil, dan janganlah kamu membunuh dirimu sendiri. Sesungguhnya Allah adalah Maha Penyayang kepadamu." (QS. Al-Baqarah: 188)
*/

const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const mime = require("mime-types");

const app = express();
const PORT = process.env.PORT || 3000;

// Base
const BASE_DIR = __dirname;

// ===================== STATIC FOLDER ===================== //
// Frontend utama
app.use(express.static(path.join(__dirname, "public")));

// Game files (json, dll)
app.use("/game", express.static(path.join(__dirname, "game")));

// Audio files
app.use("/audio", express.static(path.join(__dirname, "audio")));

// 🔥 NEW: Image files (jpg, png, dll)
app.use("/image", express.static(path.join(__dirname, "image")));

// 🔥 NEW: Font files (ttf, fnt, png bitmap font, dll)
app.use("/font", express.static(path.join(__dirname, "font")));

// ======================================================== //

// Route utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const HIDDEN = new Set([
  "public",
  "package.json",
  "server.js",
  "server.js.bak",
  "package-lock.json",
  ".git",
  ".env",
  ".v8-cache",
  "___vc",
  "vercel.json",
  "",
  "node_modules",
]);

function cleanPath(p) {
  if (!p) return "";
  return p.replace(/\\/g, "/").replace(/\.\./g, "");
}

// API: LIST isi folder
app.get("/api/list", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const dir = path.join(BASE_DIR, rel);

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const items = await Promise.all(
      entries
        .filter((e) => !HIDDEN.has(e.name))
        .map(async (e) => {
          const full = path.join(dir, e.name);
          const stat = await fs.stat(full);

          return {
            name: e.name,
            type: e.isDirectory() ? "folder" : "file",
            size: stat.size,
            mtime: stat.mtime,
          };
        })
    );

    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "folder" ? -1 : 1;
    });

    res.json({ path: rel, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API: RAW VIEW FILE (untuk download/view binary)
app.get("/api/raw", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);

  try {
    const mimeType = mime.lookup(filePath) || "application/octet-stream";
    const data = await fs.readFile(filePath);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
});

// 🔥 NEW: API untuk view code seperti GitHub (raw content text only)
app.get("/api/code", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);

  try {
    // Cek apakah file text-based
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = [
      ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
      ".json", ".txt", ".md", ".html", ".htm", ".css",
      ".scss", ".sass", ".xml", ".yml", ".yaml",
      ".env", ".gitignore", ".editorconfig",
      ".fnt", ".csv", ".log", ".sql", ".php", ".py",
      ".rb", ".java", ".c", ".cpp", ".h", ".hpp",
      ".go", ".rs", ".swift", ".kt", ".dart"
    ];

    if (!textExtensions.includes(ext)) {
      // Jika bukan file text, redirect ke /api/raw
      return res.redirect(`/api/raw?path=${encodeURIComponent(rel)}`);
    }

    // Baca file sebagai text
    const content = await fs.readFile(filePath, "utf8");
    
    // Kirim sebagai plain text dengan header sederhana
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(content);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
});

// API: VIEW FILE (untuk preview di iframe/embed)
app.get("/api/view", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);

  try {
    const mimeType = mime.lookup(filePath) || "application/octet-stream";
    
    if (mimeType.startsWith("image/") || mimeType.startsWith("audio/") || mimeType.startsWith("video/")) {
      // Untuk media files, buat halaman embed sederhana
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${path.basename(filePath)}</title>
  <style>
    body { margin: 0; padding: 20px; background: #111; color: #fff; font-family: monospace; }
    .container { max-width: 100%; text-align: center; }
    img, video, audio { max-width: 100%; max-height: 80vh; }
    .filename { margin-bottom: 10px; color: #888; }
    .download { margin-top: 10px; }
    a { color: #4dabf7; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="filename">${path.basename(filePath)}</div>
    ${mimeType.startsWith("image/") ? `<img src="/api/raw?path=${encodeURIComponent(rel)}" alt="${path.basename(filePath)}">` : ""}
    ${mimeType.startsWith("video/") ? `<video controls><source src="/api/raw?path=${encodeURIComponent(rel)}" type="${mimeType}"></video>` : ""}
    ${mimeType.startsWith("audio/") ? `<audio controls><source src="/api/raw?path=${encodeURIComponent(rel)}" type="${mimeType}"></audio>` : ""}
    <div class="download">
      <a href="/api/raw?path=${encodeURIComponent(rel)}" download>Download</a> | 
      <a href="/">Back to Storage</a>
    </div>
  </div>
</body>
</html>`;
      res.send(html);
    } else {
      // Untuk file lain, redirect ke raw
      res.redirect(`/api/raw?path=${encodeURIComponent(rel)}`);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});
/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 

• Menerima pembuatan script bot
• Menerima perbaikan script atau fitur bot
• Menerima pembuatan fitur bot
• Menerima semua kebutuhan bot
• Menerima Jadi Bot

ℹ️ Information

• Pembayaran bisa dicicil
• Bisa bayar di awal atau akhir
• Pembayaran melalu QRIS Only
• Testimoni Banyak

Aturan:
1. Dilarang memperjualbelikan script ini.
2. Hak cipta milik Vynaa Valerie.

"Dan janganlah kamu makan harta di antara kamu dengan jalan yang batil, dan janganlah kamu membunuh dirimu sendiri. Sesungguhnya Allah adalah Maha Penyayang kepadamu." (QS. Al-Baqarah: 188)
*/
