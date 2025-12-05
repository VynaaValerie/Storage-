const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Base direktori (folder project)
const BASE_DIR = __dirname;

// ===== STATIC FILES =====

// Serve frontend dari /public (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, "public")));

// Serve folder game sebagai storage JSON / apa pun
// -> http://localhost:3000/game/tebakkata.json
app.use("/game", express.static(path.join(__dirname, "game")));

// (opsional) folder audio sebagai storage media
// -> http://localhost:3000/audio/pinaa.mp3
app.use("/audio", express.static(path.join(__dirname, "audio")));

// Kalau nanti mau folder lain, tinggal tambah, misalnya:
// app.use("/images", express.static(path.join(__dirname, "images")));

// Root website -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== API LIST (buat UI file manager) =====

// Daftar file/folder yang DISEMBUNYIKAN dari UI
const HIDDEN = new Set([
  "public",
  "package.json",
  "server.js",
  "server.js.bak",
  "package-lock.json",
  ".git",
  ".env",
  "node_modules"
]);

// Sanitasi path supaya aman
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
        .filter((e) => !HIDDEN.has(e.name)) // sembunyikan yang sensitif
        .map(async (e) => {
          const full = path.join(dir, e.name);
          const stat = await fs.stat(full);

          return {
            name: e.name,
            type: e.isDirectory() ? "folder" : "file",
            size: stat.size,
            mtime: stat.mtime
          };
        })
    );

    // folder dulu baru file
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

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
});