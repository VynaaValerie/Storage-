const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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

“Dan janganlah kamu makan harta di antara kamu dengan jalan yang batil, dan janganlah kamu membunuh dirimu sendiri. Sesungguhnya Allah adalah Maha Penyayang kepadamu.” (QS. Al-Baqarah: 188)
*/

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
// Taruh file gambar di folder: ./image
// contoh: ./image/levelup.jpg -> https://ge.vynaa.web.id/image/levelup.jpg
app.use("/image", express.static(path.join(__dirname, "image")));

// 🔥 NEW: Font files (ttf, fnt, png bitmap font, dll)
// Taruh file font di folder: ./font
// contoh: ./font/Spell of Asia.ttf  -> /font/Spell%20of%20Asia.ttf
//         ./font/Spell_of_Asia.fnt -> /font/Spell_of_Asia.fnt
//         ./font/Spell_of_Asia.png -> /font/Spell_of_Asia.png
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
  // Menghapus garis miring ganda, mengganti backslash, dan mencegah traversi direktori (..)
  return p.replace(/\\/g, "/").replace(/\.\./g, "").replace(/\/\//g, "/");
}

// API: LIST isi folder
app.get("/api/list", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const dir = path.join(BASE_DIR, rel);

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const items = await Promise.all(
      entries
        .filter((e) => !HIDDEN.has(e.name)) // sembunyikan yang sensitif
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
      // Folder di atas File
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      // Urutan alfabetis
      return a.name.localeCompare(b.name);
    });

    res.json({ path: rel, items });
  } catch (err) {
    console.error(`Error listing directory ${dir}: ${err.message}`);
    // Kirim 404 jika folder tidak ditemukan
    if (err.code === 'ENOENT') {
        return res.status(404).json({ error: `Path not found: /${rel}` });
    }
    res.status(500).json({ error: err.message });
  }
});

// API: RAW VIEW FILE (lihat isi mentah .js, .json, .fnt, dll)
app.get("/api/raw", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);

  try {
    const ext = path.extname(filePath).toLowerCase();
    // Tambahkan .md (Markdown) ke daftar file teks
    const textLike = [".js", ".json", ".txt", ".md", ".fnt", ".html", ".css", ".yaml", ".yml", ".ts", ".jsx", ".tsx"];

    const isTextFile = textLike.includes(ext);
    const encoding = isTextFile ? "utf8" : null;
    const data = await fs.readFile(filePath, encoding || undefined);

    if (isTextFile) {
      // Pastikan disajikan sebagai plain text agar browser tidak mencoba merender HTML/CSS
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(data);
    } else {
      // Untuk file biner (audio, image, dll.)
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(data);
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err.message}`);
    // Kirim 404 jika file tidak ditemukan
    if (err.code === 'ENOENT') {
        return res.status(404).send("File not found: " + rel);
    }
    res.status(500).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});