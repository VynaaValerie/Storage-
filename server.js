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

// Base directory
const BASE_DIR = __dirname;

// ===================== STATIC FOLDER ===================== //
// Frontend utama
app.use(express.static(path.join(__dirname, "public")));
// Game files
app.use("/game", express.static(path.join(__dirname, "game")));
// Audio files
app.use("/audio", express.static(path.join(__dirname, "audio")));
// Image files
app.use("/image", express.static(path.join(__dirname, "image")));
// Font files
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

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
    .replace(/ /g, "&nbsp;");
}

function getLanguageClass(ext) {
  const langMap = {
    '.js': 'javascript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.php': 'php',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.md': 'markdown',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.xml': 'xml',
    '.sh': 'bash',
    '.bat': 'batch',
    '.sql': 'sql',
    '.txt': 'plaintext',
    '.fnt': 'plaintext',
    '.env': 'plaintext',
    '.gitignore': 'plaintext'
  };
  return langMap[ext] || 'plaintext';
}

function getFileIcon(ext, mimeType) {
  const icons = {
    // Code files
    '.js': '📜', '.json': '📋', '.html': '🌐', '.css': '🎨', '.php': '🐘',
    '.py': '🐍', '.java': '☕', '.cpp': '⚙️', '.c': '🔧', '.go': '🐹',
    '.rs': '🦀',
    
    // Documents
    '.pdf': '📕', '.doc': '📘', '.docx': '📘', '.xls': '📊', '.xlsx': '📊',
    '.ppt': '📽️', '.pptx': '📽️', '.txt': '📄', '.md': '📝',
    
    // Media
    '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🎞️', '.mp4': '🎥',
    '.mp3': '🎵', '.wav': '🎵', '.avi': '🎬', '.mov': '🎬',
    
    // Archives
    '.zip': '🗜️', '.rar': '🗜️', '.tar': '🗜️', '.gz': '🗜️', '.7z': '🗜️',
    
    // Config
    '.env': '⚙️', '.config': '⚙️', '.yml': '⚙️', '.yaml': '⚙️', '.xml': '⚙️',
    '.ini': '⚙️', '.conf': '⚙️'
  };
  
  return icons[ext] || (mimeType?.startsWith('image/') ? '🖼️' : 
                       mimeType?.startsWith('audio/') ? '🎵' : 
                       mimeType?.startsWith('video/') ? '🎥' : 
                       mimeType?.startsWith('text/') ? '📄' : '📎');
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
          const ext = path.extname(e.name).toLowerCase();
          const mimeType = mime.lookup(e.name) || "unknown";
          const icon = e.isDirectory() ? "📁" : getFileIcon(ext, mimeType);

          return {
            name: e.name,
            type: e.isDirectory() ? "folder" : "file",
            size: stat.size,
            mtime: stat.mtime,
            ext: ext,
            mime: mimeType,
            icon: icon
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

// API: RAW VIEW FILE (tampilan rapi)
app.get("/api/raw", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  try {
    const stat = await fs.stat(filePath);
    
    if (stat.size > MAX_FILE