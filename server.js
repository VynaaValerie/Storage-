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
    
    if (stat.size > MAX_FILE_SIZE) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Too Large</title>
          <style>
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: rgba(255, 255, 255, 0.95);
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #e74c3c; margin-bottom: 20px; }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin-top: 20px;
              font-weight: bold;
            }
            .btn:hover {
              background: #5a67d8;
              transform: translateY(-2px);
              transition: all 0.3s;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>📦 File Terlalu Besar</h1>
            <p>File <strong>${path.basename(filePath)}</strong> berukuran ${formatBytes(stat.size)}</p>
            <p>Maksimal file yang dapat dilihat: 10MB</p>
            <a href="/${rel}" class="btn" download>⬇️ Download File</a>
            <a href="/" class="btn" style="background: #95a5a6; margin-left: 10px;">🏠 Kembali</a>
          </div>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mime.lookup(filePath) || "application/octet-stream";
    
    // File yang bisa ditampilkan sebagai teks
    const textTypes = [
      "text/", 
      "application/json", 
      "application/javascript",
      "application/xml",
      "application/x-httpd-php",
      "application/x-sh",
      "application/x-python",
      "application/x-typescript"
    ];
    
    const isText = textTypes.some(type => mimeType.startsWith(type));
    const isImage = mimeType.startsWith("image/");
    const isAudio = mimeType.startsWith("audio/");
    const isVideo = mimeType.startsWith("video/");
    const isPDF = mimeType === "application/pdf";

    if (isImage) {
      // Tampilkan gambar dengan preview
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${path.basename(filePath)}</title>
          <style>
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', sans-serif;
              margin: 0;
              padding: 20px;
              min-height: 100vh;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.95);
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .file-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .preview {
              text-align: center;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .preview img {
              max-width: 100%;
              max-height: 70vh;
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .controls {
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
            }
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              transition: all 0.3s;
            }
            .btn-primary {
              background: #667eea;
              color: white;
            }
            .btn-secondary {
              background: #6c757d;
              color: white;
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .file-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: white;
              padding: 15px;
              border-radius: 10px;
              border-left: 4px solid #667eea;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .stat-card h3 {
              margin: 0 0 10px 0;
              color: #495057;
              font-size: 14px;
            }
            .stat-card p {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
              color: #212529;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🖼️ ${path.basename(filePath)}</h1>
              <div style="background: #667eea; color: white; padding: 8px 16px; border-radius: 20px;">
                ${mimeType}
              </div>
            </div>
            
            <div class="file-stats">
              <div class="stat-card">
                <h3>📁 Path</h3>
                <p>${rel}</p>
              </div>
              <div class="stat-card">
                <h3>📦 Size</h3>
                <p>${formatBytes(stat.size)}</p>
              </div>
              <div class="stat-card">
                <h3>📅 Modified</h3>
                <p>${stat.mtime.toLocaleString()}</p>
              </div>
              <div class="stat-card">
                <h3>📐 Dimensions</h3>
                <p id="dimensions">Loading...</p>
              </div>
            </div>
            
            <div class="preview">
              <img 
                src="/${rel}" 
                alt="${path.basename(filePath)}" 
                id="preview-image"
                onload="getImageDimensions(this)"
              >
            </div>
            
            <div class="controls">
              <a href="/${rel}" class="btn btn-primary" download>
                <span>⬇️</span> Download Original
              </a>
              <a href="/" class="btn btn-secondary">
                <span>🏠</span> Kembali ke Browser
              </a>
              <button onclick="copyImageLink()" class="btn" style="background: #28a745; color: white;">
                <span>🔗</span> Copy Image URL
              </button>
              <button onclick="fullscreenImage()" class="btn" style="background: #17a2b8; color: white;">
                <span>🔍</span> Fullscreen
              </button>
            </div>
          </div>
          
          <script>
            function getImageDimensions(img) {
              document.getElementById('dimensions').textContent = 
                img.naturalWidth + ' × ' + img.naturalHeight + ' px';
            }
            
            function copyImageLink() {
              const link = window.location.origin + '/${rel}';
              navigator.clipboard.writeText(link).then(() => {
                alert('✅ Link gambar berhasil disalin:\\n' + link);
              });
            }
            
            function fullscreenImage() {
              const img = document.getElementById('preview-image');
              if (img.requestFullscreen) {
                img.requestFullscreen();
              } else if (img.webkitRequestFullscreen) {
                img.webkitRequestFullscreen();
              } else if (img.msRequestFullscreen) {
                img.msRequestFullscreen();
              }
            }
          </script>
        </body>
        </html>
      `);
    } else if (isText) {
      // Tampilkan file teks dengan syntax highlighting
      const data = await fs.readFile(filePath, "utf8");
      
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>📄 ${path.basename(filePath)}</title>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            :root {
              --primary: #667eea;
              --secondary: #764ba2;
              --dark: #0f172a;
              --light: #f8fafc;
              --gray: #64748b;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              min-height: 100vh;
              padding: 20px;
            }
            
            .container {
              max-width: 1400px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.97);
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            
            .header {
              background: var(--dark);
              color: white;
              padding: 20px 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
            }
            
            .header-left {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .file-icon {
              font-size: 2em;
              background: linear-gradient(135deg, var(--primary), var(--secondary));
              width: 60px;
              height: 60px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .file-info h1 {
              font-size: 1.5em;
              margin-bottom: 5px;
            }
            
            .file-path {
              color: #cbd5e1;
              font-family: 'Consolas', monospace;
              font-size: 0.9em;
            }
            
            .file-meta {
              display: flex;
              gap: 20px;
              margin-top: 10px;
            }
            
            .meta-item {
              display: flex;
              align-items: center;
              gap: 5px;
              color: #94a3b8;
              font-size: 0.9em;
            }
            
            .file-tag {
              background: linear-gradient(135deg, var(--primary), var(--secondary));
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 0.9em;
            }
            
            .code-container {
              padding: 0;
              position: relative;
            }
            
            .code-header {
              background: #1e293b;
              color: white;
              padding: 15px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #334155;
            }
            
            .line-counter {
              color: #94a3b8;
              font-family: 'Consolas', monospace;
            }
            
            pre {
              margin: 0;
              padding: 20px;
              background: #0f172a;
              overflow-x: auto;
              max-height: 70vh;
            }
            
            code {
              font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
              font-size: 14px;
              line-height: 1.6;
            }
            
            .hljs {
              background: transparent !important;
            }
            
            .controls {
              padding: 20px 30px;
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              border-top: 1px solid #e2e8f0;
              background: #f8fafc;
            }
            
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              transition: all 0.3s;
              border: none;
              cursor: pointer;
              font-size: 0.95em;
            }
            
            .btn-primary {
              background: var(--primary);
              color: white;
            }
            
            .btn-secondary {
              background: #475569;
              color: white;
            }
            
            .btn-success {
              background: #10b981;
              color: white;
            }
            
            .btn-warning {
              background: #f59e0b;
              color: white;
            }
            
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .stats-bar {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              padding: 20px 30px;
              background: #f1f5f9;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .stat {
              text-align: center;
            }
            
            .stat-value {
              font-size: 1.5em;
              font-weight: bold;
              color: var(--primary);
            }
            
            .stat-label {
              font-size: 0.85em;
              color: var(--gray);
              margin-top: 5px;
            }
            
            @media (max-width: 768px) {
              .container {
                border-radius: 15px;
              }
              
              .header {
                padding: 15px;
                flex-direction: column;
                text-align: center;
              }
              
              .header-left {
                flex-direction: column;
                text-align: center;
              }
              
              .controls {
                justify-content: center;
              }
              
              pre {
                padding: 15px;
                font-size: 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-left">
                <div class="file-icon">
                  ${getFileIcon(ext, mimeType)}
                </div>
                <div class="file-info">
                  <h1>${path.basename(filePath)}</h1>
                  <div class="file-path">${rel}</div>
                  <div class="file-meta">
                    <div class="meta-item">
                      <i class="fas fa-file"></i>
                      ${formatBytes(stat.size)}
                    </div>
                    <div class="meta-item">
                      <i class="fas fa-calendar"></i>
                      ${stat.mtime.toLocaleDateString()}
                    </div>
                    <div class="meta-item">
                      <i class="fas fa-clock"></i>
                      ${stat.mtime.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
              <div class="file-tag">
                ${mimeType}
              </div>
            </div>
            
            <div class="stats-bar">
              <div class="stat">
                <div class="stat-value" id="lineCount">0</div>
                <div class="stat-label">Lines</div>
              </div>
              <div class="stat">
                <div class="stat-value" id="charCount">0</div>
                <div class="stat-label">Characters</div>
              </div>
              <div class="stat">
                <div class="stat-value" id="wordCount">0</div>
                <div class="stat-label">Words</div>
              </div>
              <div class="stat">
                <div class="stat-value">${ext.toUpperCase()}</div>
                <div class="stat-label">Extension</div>
              </div>
            </div>
            
            <div class="code-container">
              <div class="code-header">
                <div>
                  <i class="fas fa-code"></i>
                  Code Viewer
                </div>
                <div class="line-counter" id="lineCounter">Line: 1</div>
              </div>
              <pre><code id="codeContent" class="language-${getLanguageClass(ext)}">${escapeHtml(data)}</code></pre>
            </div>
            
            <div class="controls">
              <button onclick="copyCode()" class="btn btn-success">
                <i class="fas fa-copy"></i>
                Copy Code
              </button>
              <a href="/${rel}" class="btn btn-primary" download>
                <i class="fas fa-download"></i>
                Download File
              </a>
              <a href="/" class="btn btn-secondary">
                <i class="fas fa-home"></i>
                Back to Browser
              </a>
              <button onclick="toggleTheme()" class="btn btn-warning">
                <i class="fas fa-moon"></i>
                Toggle Theme
              </button>
              <button onclick="toggleWrap()" class="btn" style="background: #8b5cf6; color: white;">
                <i class="fas fa-text-width"></i>
                Toggle Wrap
              </button>
            </div>
          </div>
          
          <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const codeContent = document.getElementById('codeContent');
              const text = codeContent.textContent;
              
              // Count stats
              const lines = text.split('\\n').length;
              const chars = text.length;
              const words = text.trim().split(/\\s+/).filter(w => w.length > 0).length;
              
              document.getElementById('lineCount').textContent = lines.toLocaleString();
              document.getElementById('charCount').textContent = chars.toLocaleString();
              document.getElementById('wordCount').textContent = words.toLocaleString();
              
              // Highlight syntax
              hljs.highlightElement(codeContent);
              
              // Line counter
              codeContent.addEventListener('scroll', updateLineCounter);
              updateLineCounter();
            });
            
            function copyCode() {
              const code = document.getElementById('codeContent').textContent;
              navigator.clipboard.writeText(code).then(() => {
                alert('✅ Code copied successfully!');
              });
            }
            
            function updateLineCounter() {
              const pre = document.querySelector('pre');
              const lineHeight = 20;
              const scrollTop = pre.scrollTop;
              const currentLine = Math.floor(scrollTop / lineHeight) + 1;
              document.getElementById('lineCounter').textContent = 'Line: ' + currentLine;
            }
            
            function toggleTheme() {
              document.body.classList.toggle('light-mode');
            }
            
            function toggleWrap() {
              const pre = document.querySelector('pre');
              pre.style.whiteSpace = pre.style.whiteSpace === 'pre-wrap' ? 'pre' : 'pre-wrap';
            }
          </script>
        </body>
        </html>
      `);
    } else if (isAudio) {
      // Tampilkan audio player
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🎵 ${path.basename(filePath)}</title>
          <style>
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .player {
              background: rgba(255, 255, 255, 0.95);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              width: 100%;
              max-width: 500px;
              text-align: center;
            }
            .album-art {
              width: 200px;
              height: 200px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              border-radius: 50%;
              margin: 0 auto 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 60px;
              color: white;
            }
            audio {
              width: 100%;
              margin: 20px 0;
            }
            h1 {
              color: #333;
              margin-bottom: 10px;
            }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="player">
            <div class="album-art">🎵</div>
            <h1>${path.basename(filePath)}</h1>
            <p>${formatBytes(stat.size)} • ${mimeType}</p>
            <audio controls autoplay>
              <source src="/${rel}" type="${mimeType}">
              Browser tidak mendukung audio.
            </audio>
            <div>
              <a href="/${rel}" class="btn" download>⬇️ Download</a>
              <a href="/" class="btn">🏠 Kembali</a>
            </div>
          </div>
        </body>
        </html>
      `);
    } else if (isVideo) {
      // Tampilkan video player
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🎥 ${path.basename(filePath)}</title>
          <style>
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', sans-serif;
              padding: 20px;
              min-height: 100vh;
            }
            .video-container {
              max-width: 1000px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.95);
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            video {
              width: 100%;
              border-radius: 10px;
              margin-bottom: 20px;
            }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <h1>🎥 ${path.basename(filePath)}</h1>
            <p>${formatBytes(stat.size)} • ${mimeType}</p>
            <video controls autoplay>
              <source src="/${rel}" type="${mimeType}">
              Browser tidak mendukung video.
            </video>
            <div>
              <a href="/${rel}" class="btn" download>⬇️ Download</a>
              <a href="/" class="btn">🏠 Kembali</a>
            </div>
          </div>
        </body>
        </html>
      `);
    } else if (isPDF) {
      // Tampilkan PDF viewer
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>📕 ${path.basename(filePath)}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f0f0f0;
            }
            .pdf-viewer {
              background: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="pdf-viewer">
            <h1>📕 ${path.basename(filePath)}</h1>
            <p>${formatBytes(stat.size)}</p>
            <embed src="/${rel}" type="application/pdf" width="100%" height="600px">
            <div>
              <a href="/${rel}" class="btn" download>⬇️ Download</a>
              <a href="/" class="btn">🏠 Kembali</a>
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      // File lain - tampilkan informasi saja
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${path.basename(filePath)}</title>
          <style>
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: 'Segoe UI', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .card {
              background: rgba(255, 255, 255, 0.95);
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            .file-icon {
              font-size: 60px;
              margin-bottom: 20px;
            }
            h1 { color: #333; margin-bottom: 20px; }
            .info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 10px;
              margin: 20px 0;
              text-align: left;
            }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              margin: 10px;
              font-weight: bold;
            }
            .btn:hover {
              background: #5a67d8;
              transform: translateY(-2px);
              transition: all 0.3s;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="file-icon">${getFileIcon(ext, mimeType)}</div>
            <h1>${path.basename(filePath)}</h1>
            <div class="info">
              <p><strong>Type:</strong> ${mimeType}</p>
              <p><strong>Size:</strong> ${formatBytes(stat.size)}</p>
              <p><strong>Modified:</strong> ${stat.mtime.toLocaleString()}</p>
              <p><strong>Path:</strong> ${rel}</p>
            </div>
            <div>
              <a href="/${rel}" class="btn" download>⬇️ Download File</a>
              <a href="/" class="btn">🏠 Kembali ke Browser</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .error-card {
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          .error-icon {
            font-size: 60px;
            color: #ff6b6b;
            margin-bottom: 20px;
          }
          h1 { color: #c92a2a; margin-bottom: 20px; }
          pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            text-align: left;
            overflow-x: auto;
            font-family: monospace;
          }
          .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="error-card">
          <div class="error-icon">❌</div>
          <h1>Error Loading File</h1>
          <pre>${err.message}</pre>
          <a href="/" class="btn">🏠 Kembali ke Browser</a>
        </div>
      </body>
      </html>
    `);
  }
});

// API: DOWNLOAD file (alternatif)
app.get("/api/download", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);
  
  try {
    res.download(filePath);
  } catch (err) {
    res.status(500).send("Error downloading file: " + err.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/