/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/

const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ===================== STATIC FOLDER ===================== //
app.use(express.static(path.join(__dirname, "public")));
["game", "audio", "image", "font", "code"].forEach(folder => {
  app.use(`/${folder}`, express.static(path.join(__dirname, folder)));
});
// ======================================================== //

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Helper functions
const cleanPath = (p) => p ? p.replace(/\\/g, "/").replace(/\.\./g, "") : "";
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
const escapeHtml = (text) => text
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const HIDDEN = new Set([
  "public", "package.json", "server.js", "server.js.bak",
  "package-lock.json", ".git", ".env", ".v8-cache", "___vc",
  "vercel.json", "", "node_modules"
]);

// API: List folder
app.get("/api/list", async (req, res) => {
  try {
    const rel = cleanPath(req.query.path || "");
    const dir = path.join(__dirname, rel);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const items = await Promise.all(
      entries
        .filter(e => !HIDDEN.has(e.name))
        .map(async e => {
          const full = path.join(dir, e.name);
          const stat = await fs.stat(full);
          const ext = path.extname(e.name).toLowerCase();
          
          // Get icon based on file type
          const getIcon = () => {
            if (e.isDirectory()) return "📁";
            const icons = {
              '.js': '📜', '.jsx': '⚛️', '.ts': '📘', '.tsx': '⚛️',
              '.mjs': '📦', '.cjs': '📦', // ES6 & CommonJS
              '.py': '🐍', '.rb': '💎', '.php': '🐘',
              '.java': '☕', '.cpp': '⚙️', '.c': '🔧', '.cs': '🔷',
              '.go': '🐹', '.rs': '🦀', '.swift': '🐦', '.kt': '🔸',
              '.dart': '🎯', '.lua': '🌙', '.r': '📊', '.pl': '🐪',
              '.erl': '⚡', '.ex': '🔥', '.clj': '🧪', '.scm': 'λ',
              '.hs': 'λ', '.fs': '🔷', '.ml': '🐫', '.v': '🔌',
              '.vhd': '🔌', '.tex': '📝', '.asm': '⚙️',
              '.html': '🌐', '.htm': '🌐', '.css': '🎨',
              '.scss': '🎨', '.sass': '🎨', '.less': '🎨',
              '.json': '📋', '.xml': '📊', '.yaml': '⚙️', '.yml': '⚙️',
              '.toml': '⚙️', '.ini': '⚙️', '.cfg': '⚙️', '.conf': '⚙️',
              '.sql': '🗃️', '.csv': '📈', '.tsv': '📈',
              '.md': '📝', '.txt': '📄', '.rtf': '📄', '.log': '📋',
              '.pdf': '📕', '.doc': '📘', '.docx': '📘',
              '.xls': '📊', '.xlsx': '📊', '.ppt': '📽️', '.pptx': '📽️',
              '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🎞️',
              '.svg': '🖼️', '.bmp': '🖼️', '.webp': '🖼️', '.ico': '🖼️',
              '.mp3': '🎵', '.wav': '🎵', '.ogg': '🎵', '.flac': '🎵',
              '.m4a': '🎵', '.aac': '🎵', '.wma': '🎵',
              '.mp4': '🎥', '.avi': '🎬', '.mov': '🎬', '.mkv': '🎬',
              '.webm': '🎬', '.flv': '🎬', '.wmv': '🎬',
              '.zip': '🗜️', '.rar': '🗜️', '.7z': '🗜️', '.tar': '🗜️',
              '.gz': '🗜️', '.bz2': '🗜️', '.xz': '🗜️',
              '.exe': '⚡', '.msi': '📦', '.apk': '📱', '.dmg': '🍎',
              '.deb': '🐧', '.rpm': '🐧', '.appimage': '🐧',
              '.ttf': '🔠', '.otf': '🔠', '.woff': '🔠', '.woff2': '🔠',
              '.eot': '🔠', '.fnt': '🔤',
              '.env': '⚙️', '.gitignore': '📌', '.dockerfile': '🐳',
              '.yml': '⚙️', '.yaml': '⚙️',
              '.sh': '🐚', '.bash': '🐚', '.zsh': '🐚',
              '.bat': '🪟', '.cmd': '🪟', '.ps1': '💻',
              '.psd': '🎨', '.ai': '🎨', '.sketch': '🎨',
              '.blend': '🎨', '.obj': '🎨', '.fbx': '🎨',
              '.unity': '🎮', '.unreal': '🎮', '.godot': '🎮',
              '.sln': '🏗️', '.csproj': '🏗️', '.vbproj': '🏗️',
              '.jar': '☕', '.war': '☕', '.ear': '☕',
              '.dll': '🔧', '.so': '🔧', '.dylib': '🔧'
            };
            return icons[ext] || '📎';
          };

          return {
            name: e.name,
            type: e.isDirectory() ? "folder" : "file",
            size: stat.size,
            mtime: stat.mtime,
            ext,
            icon: getIcon()
          };
        })
    );

    items.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1);
    res.json({ path: rel, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Raw view - Support semua bahasa pemrograman
app.get("/api/raw", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(__dirname, rel);

  try {
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Baca file
    const data = await fs.readFile(filePath, "utf8");
    
    // Deteksi module type
    const isESM = (ext === '.mjs') || data.includes('import ') || data.includes('export ') || 
                 data.includes('export default') || data.includes('export {');
    const isCJS = (ext === '.cjs') || data.includes('module.exports') || 
                 data.includes('require(') || data.includes('exports.');
    
    // Get language info
    const getLangInfo = () => {
      const langs = {
        // JavaScript
        '.js': { name: 'JavaScript', color: '#f7df1e', emoji: '📜' },
        '.jsx': { name: 'JSX', color: '#61dafb', emoji: '⚛️' },
        '.ts': { name: 'TypeScript', color: '#3178c6', emoji: '📘' },
        '.tsx': { name: 'TSX', color: '#3178c6', emoji: '⚛️' },
        '.mjs': { name: 'ES Module', color: '#8b5cf6', emoji: '📦' },
        '.cjs': { name: 'CommonJS', color: '#8b5cf6', emoji: '📦' },
        
        // Python & Scripting
        '.py': { name: 'Python', color: '#3776ab', emoji: '🐍' },
        '.rb': { name: 'Ruby', color: '#cc342d', emoji: '💎' },
        '.php': { name: 'PHP', color: '#777bb4', emoji: '🐘' },
        '.pl': { name: 'Perl', color: '#39457e', emoji: '🐪' },
        '.lua': { name: 'Lua', color: '#000080', emoji: '🌙' },
        '.r': { name: 'R', color: '#276dc3', emoji: '📊' },
        '.erl': { name: 'Erlang', color: '#a90533', emoji: '⚡' },
        '.ex': { name: 'Elixir', color: '#6e4a7e', emoji: '🔥' },
        '.clj': { name: 'Clojure', color: '#5881d8', emoji: '🧪' },
        '.scm': { name: 'Scheme', color: '#1e4a8b', emoji: 'λ' },
        
        // Compiled Languages
        '.java': { name: 'Java', color: '#007396', emoji: '☕' },
        '.cpp': { name: 'C++', color: '#00599c', emoji: '⚙️' },
        '.c': { name: 'C', color: '#a8b9cc', emoji: '🔧' },
        '.cs': { name: 'C#', color: '#239120', emoji: '🔷' },
        '.go': { name: 'Go', color: '#00add8', emoji: '🐹' },
        '.rs': { name: 'Rust', color: '#dea584', emoji: '🦀' },
        '.swift': { name: 'Swift', color: '#fa7343', emoji: '🐦' },
        '.kt': { name: 'Kotlin', color: '#7f52ff', emoji: '🔸' },
        '.dart': { name: 'Dart', color: '#00b4ab', emoji: '🎯' },
        
        // Web
        '.html': { name: 'HTML', color: '#e34c26', emoji: '🌐' },
        '.htm': { name: 'HTML', color: '#e34c26', emoji: '🌐' },
        '.css': { name: 'CSS', color: '#264de4', emoji: '🎨' },
        '.scss': { name: 'SCSS', color: '#cc6699', emoji: '🎨' },
        '.sass': { name: 'SASS', color: '#cc6699', emoji: '🎨' },
        '.less': { name: 'Less', color: '#1d365d', emoji: '🎨' },
        
        // Data & Config
        '.json': { name: 'JSON', color: '#f5de19', emoji: '📋' },
        '.xml': { name: 'XML', color: '#0066cc', emoji: '📊' },
        '.yaml': { name: 'YAML', color: '#cb171e', emoji: '⚙️' },
        '.yml': { name: 'YAML', color: '#cb171e', emoji: '⚙️' },
        '.toml': { name: 'TOML', color: '#9c4221', emoji: '⚙️' },
        '.ini': { name: 'INI', color: '#d4d4d4', emoji: '⚙️' },
        '.cfg': { name: 'Config', color: '#d4d4d4', emoji: '⚙️' },
        '.conf': { name: 'Config', color: '#d4d4d4', emoji: '⚙️' },
        '.env': { name: 'Env', color: '#ffd700', emoji: '⚙️' },
        
        // Database
        '.sql': { name: 'SQL', color: '#336791', emoji: '🗃️' },
        '.mysql': { name: 'MySQL', color: '#4479a1', emoji: '🗃️' },
        '.pgsql': { name: 'PostgreSQL', color: '#336791', emoji: '🗃️' },
        '.sqlite': { name: 'SQLite', color: '#003b57', emoji: '🗃️' },
        
        // Shell
        '.sh': { name: 'Shell', color: '#4eaa25', emoji: '🐚' },
        '.bash': { name: 'Bash', color: '#4eaa25', emoji: '🐚' },
        '.zsh': { name: 'Zsh', color: '#4eaa25', emoji: '🐚' },
        '.ps1': { name: 'PowerShell', color: '#012456', emoji: '💻' },
        '.bat': { name: 'Batch', color: '#c1f12e', emoji: '🪟' },
        '.cmd': { name: 'CMD', color: '#c1f12e', emoji: '🪟' },
        
        // Markup & Docs
        '.md': { name: 'Markdown', color: '#083fa1', emoji: '📝' },
        '.markdown': { name: 'Markdown', color: '#083fa1', emoji: '📝' },
        '.txt': { name: 'Text', color: '#d4d4d4', emoji: '📄' },
        '.rtf': { name: 'Rich Text', color: '#d4d4d4', emoji: '📄' },
        '.csv': { name: 'CSV', color: '#217346', emoji: '📈' },
        '.tsv': { name: 'TSV', color: '#217346', emoji: '📈' },
        
        // Functional
        '.hs': { name: 'Haskell', color: '#5e5086', emoji: 'λ' },
        '.fs': { name: 'F#', color: '#b845fc', emoji: '🔷' },
        '.ml': { name: 'OCaml', color: '#ec6813', emoji: '🐫' },
        
        // Hardware
        '.v': { name: 'Verilog', color: '#b2b7f8', emoji: '🔌' },
        '.vhd': { name: 'VHDL', color: '#543978', emoji: '🔌' },
        
        // LaTeX
        '.tex': { name: 'LaTeX', color: '#008080', emoji: '📝' },
        
        // Assembly
        '.asm': { name: 'Assembly', color: '#6e4c13', emoji: '⚙️' },
        '.s': { name: 'Assembly', color: '#6e4c13', emoji: '⚙️' },
        
        // Game Dev
        '.gd': { name: 'GDScript', color: '#478cbf', emoji: '🎮' },
        '.uproject': { name: 'Unreal', color: '#0e1128', emoji: '🎮' },
        
        // Others
        '.log': { name: 'Log', color: '#666666', emoji: '📋' },
        '.gitignore': { name: 'Git Ignore', color: '#f14e32', emoji: '📌' },
        '.dockerfile': { name: 'Docker', color: '#2496ed', emoji: '🐳' },
        '.makefile': { name: 'Makefile', color: '#427819', emoji: '🔧' },
        '.fnt': { name: 'Font', color: '#8b4513', emoji: '🔤' }
      };
      
      const lang = langs[ext] || { 
        name: ext ? ext.toUpperCase().replace('.', '') + ' File' : 'File',
        color: '#666666',
        emoji: '📎'
      };
      
      // Add module type if detected
      if (isESM) lang.name = `ES Module (${lang.name})`;
      if (isCJS) lang.name = `CommonJS (${lang.name})`;
      
      return lang;
    };
    
    const langInfo = getLangInfo();

    // HTML template
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName} - ${langInfo.name}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --border: #30363d;
      --text-primary: #e6edf3;
      --text-secondary: #8b949e;
      --text-tertiary: #6e7681;
      --accent-blue: #58a6ff;
      --accent-green: #238636;
      --accent-purple: #8b5cf6;
      --accent-orange: #f59e0b;
      --accent-red: #f85149;
    }
    
    body {
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
      line-height: 1.6;
      min-height: 100vh;
    }
    
    .header {
      background: var(--bg-secondary);
      padding: 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
    }
    
    .file-info {
      display: flex;
      align-items: center;
      gap: 15px;
      flex-wrap: wrap;
    }
    
    .file-icon {
      font-size: 32px;
      background: ${langInfo.color}20;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid ${langInfo.color}40;
    }
    
    .file-details {
      flex: 1;
      min-width: 200px;
    }
    
    .file-name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 5px;
      color: var(--text-primary);
    }
    
    .file-path {
      font-size: 13px;
      color: var(--text-secondary);
      font-family: 'Consolas', monospace;
      word-break: break-all;
    }
    
    .file-meta {
      display: flex;
      gap: 15px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    
    .meta-item i {
      color: ${langInfo.color};
    }
    
    .badge {
      background: ${langInfo.color};
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 120px;
      justify-content: center;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s, border-color 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      border-color: ${langInfo.color};
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: ${langInfo.color};
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .code-wrapper {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 25px;
      position: relative;
    }
    
    .code-header {
      background: var(--bg-tertiary);
      padding: 15px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .code-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .language-tag {
      background: ${langInfo.color}20;
      color: ${langInfo.color};
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .module-tag {
      background: ${isESM ? '#8b5cf6' : isCJS ? '#f59e0b' : 'transparent'};
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      display: ${isESM || isCJS ? 'block' : 'none'};
    }
    
    .code-header-right {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .line-counter {
      font-size: 13px;
      color: var(--text-secondary);
      font-family: 'Fira Code', monospace;
    }
    
    pre {
      margin: 0;
      padding: 25px;
      overflow-x: auto;
      max-height: 70vh;
      background: var(--bg-primary) !important;
      font-size: 14px;
    }
    
    code {
      font-family: 'Fira Code', 'Cascadia Code', monospace;
      font-size: 14px;
      line-height: 1.7;
      tab-size: 2;
      background: transparent !important;
    }
    
    .hljs {
      background: transparent !important;
    }
    
    .controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.2s;
      font-family: inherit;
    }
    
    .btn-primary {
      background: var(--accent-green);
      color: white;
    }
    
    .btn-primary:hover {
      background: #2ea043;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(35, 134, 54, 0.3);
    }
    
    .btn-secondary {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border);
    }
    
    .btn-secondary:hover {
      background: var(--bg-secondary);
      transform: translateY(-2px);
    }
    
    .btn-purple {
      background: var(--accent-purple);
      color: white;
    }
    
    .btn-purple:hover {
      background: #7c3aed;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }
    
    .btn-orange {
      background: var(--accent-orange);
      color: white;
    }
    
    .btn-orange:hover {
      background: #d97706;
      transform: translateY(-2px);
    }
    
    .line-numbers {
      position: absolute;
      left: 0;
      top: 55px;
      padding: 0 20px;
      text-align: right;
      color: var(--text-tertiary);
      user-select: none;
      font-family: 'Fira Code', monospace;
      font-size: 14px;
      line-height: 1.7;
      pointer-events: none;
      background: var(--bg-secondary);
      width: 60px;
      border-right: 1px solid var(--border);
      height: calc(100% - 55px);
      overflow: hidden;
    }
    
    .module-notice {
      background: ${isESM ? 'rgba(139, 92, 246, 0.1)' : isCJS ? 'rgba(245, 158, 11, 0.1)' : 'transparent'};
      border-left: 4px solid ${isESM ? '#8b5cf6' : isCJS ? '#f59e0b' : 'transparent'};
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      display: ${isESM || isCJS ? 'block' : 'none'};
    }
    
    .module-notice strong {
      color: ${isESM ? '#8b5cf6' : isCJS ? '#f59e0b' : 'inherit'};
    }
    
    .module-notice p {
      margin-top: 5px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; }
      .file-info { justify-content: center; }
      .badge { width: 100%; margin-top: 10px; }
      .stats-grid { grid-template-columns: 1fr; }
      pre { padding: 15px; font-size: 13px; }
      .controls { justify-content: center; }
      .btn { flex: 1; min-width: 120px; justify-content: center; }
    }
    
    @media (max-width: 480px) {
      .container { padding: 15px; }
      .file-icon { width: 50px; height: 50px; font-size: 24px; }
      .file-name { font-size: 18px; }
      .stat-card { padding: 15px; }
      .stat-value { font-size: 24px; }
    }
    
    /* Syntax highlighting customizations */
    .hljs-keyword { color: #ff79c6 !important; }
    .hljs-built_in { color: #8be9fd !important; }
    .hljs-string { color: #f1fa8c !important; }
    .hljs-number { color: #bd93f9 !important; }
    .hljs-comment { color: #6272a4 !important; }
    .hljs-function { color: #50fa7b !important; }
    .hljs-params { color: #f8f8f2 !important; }
    .hljs-title { color: #ffb86c !important; }
    .hljs-type { color: #8be9fd !important; }
    .hljs-operator { color: #ff79c6 !important; }
    .hljs-variable { color: #f8f8f2 !important; }
    
    /* Scrollbar */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: var(--bg-secondary); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
  </style>
</head>
<body>
  <div class="header">
    <div class="file-info">
      <div class="file-icon">${langInfo.emoji}</div>
      <div class="file-details">
        <div class="file-name">${fileName}</div>
        <div class="file-path">${rel}</div>
        <div class="file-meta">
          <div class="meta-item"><i>📦</i> ${formatBytes(stat.size)}</div>
          <div class="meta-item"><i>📅</i> ${new Date(stat.mtime).toLocaleDateString()}</div>
          <div class="meta-item"><i>🕒</i> ${new Date(stat.mtime).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
    <div class="badge">
      <span>${langInfo.emoji}</span>
      <span>${langInfo.name}</span>
    </div>
  </div>
  
  <div class="container">
    ${(isESM || isCJS) ? `
      <div class="module-notice">
        <strong>${isESM ? '📦 ES6 Module' : '📦 CommonJS Module'} Detected</strong>
        <p>
          ${isESM ? 
            'File ini menggunakan ES6 module syntax (import/export). Jalankan dengan Node.js menggunakan flag --experimental-modules atau ubah ekstensi menjadi .mjs.' :
            'File ini menggunakan CommonJS syntax (require/module.exports). Format ini kompatibel dengan Node.js standar.'}
        </p>
      </div>
    ` : ''}
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${formatBytes(stat.size)}</div>
        <div class="stat-label">File Size</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.split('\n').length.toLocaleString()}</div>
        <div class="stat-label">Total Lines</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.length.toLocaleString()}</div>
        <div class="stat-label">Characters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${data.trim().split(/\s+/).filter(w => w.length > 0).length.toLocaleString()}</div>
        <div class="stat-label">Words</div>
      </div>
    </div>
    
    <div class="code-wrapper">
      <div class="code-header">
        <div class="code-header-left">
          <div class="language-tag">${langInfo.name}</div>
          <div class="module-tag">${isESM ? 'ES6 MODULE' : isCJS ? 'COMMONJS' : ''}</div>
        </div>
        <div class="code-header-right">
          <div class="line-counter">Lines: <span id="lineCount">${data.split('\n').length}</span></div>
        </div>
      </div>
      <pre><code class="hljs language-${langInfo.name.toLowerCase().split(' ')[0]}">${escapeHtml(data)}</code></pre>
    </div>
    
    <div class="controls">
      <a href="/${rel}" class="btn btn-primary" download>
        <span>⬇️</span> Download File
      </a>
      <a href="/" class="btn btn-secondary">
        <span>🏠</span> Back to Browser
      </a>
      <button onclick="copyCode()" class="btn btn-purple">
        <span>📋</span> Copy Code
      </button>
      <button onclick="downloadRaw()" class="btn btn-orange">
        <span>📄</span> Download Raw
      </button>
      <button onclick="toggleTheme()" class="btn" style="background: var(--bg-tertiary); color: var(--text-primary);">
        <span>🌙</span> Toggle Theme
      </button>
      <button onclick="toggleWrap()" class="btn" style="background: var(--bg-tertiary); color: var(--text-primary);">
        <span>↔️</span> Toggle Wrap
      </button>
    </div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    // Initialize syntax highlighting
    hljs.highlightAll();
    
    // Add line numbers
    const codeEl = document.querySelector('code');
    const lines = codeEl.textContent.split('\\n');
    if (lines.length > 1) {
      codeEl.style.paddingLeft = '70px';
      const lineNumbers = lines.map((_, i) => i + 1).join('\\n');
      const lineNumDiv = document.createElement('div');
      lineNumDiv.className = 'line-numbers';
      lineNumDiv.innerHTML = lineNumbers;
      document.querySelector('.code-wrapper').appendChild(lineNumDiv);
    }
    
    // Copy code function
    function copyCode() {
      const code = codeEl.textContent;
      navigator.clipboard.writeText(code).then(() => {
        alert('✅ Code berhasil disalin ke clipboard!');
      });
    }
    
    // Download raw file
    function downloadRaw() {
      const code = codeEl.textContent;
      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '${fileName}';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    // Toggle theme
    function toggleTheme() {
      document.body.classList.toggle('light-theme');
      const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('theme', theme);
      applyTheme(theme);
    }
    
    // Toggle word wrap
    function toggleWrap() {
      const pre = document.querySelector('pre');
      pre.style.whiteSpace = pre.style.whiteSpace === 'pre-wrap' ? 'pre' : 'pre-wrap';
      localStorage.setItem('wrap', pre.style.whiteSpace);
    }
    
    // Apply saved preferences
    function applyTheme(theme) {
      if (theme === 'light') {
        document.documentElement.style.setProperty('--bg-primary', '#ffffff');
        document.documentElement.style.setProperty('--bg-secondary', '#f6f8fa');
        document.documentElement.style.setProperty('--bg-tertiary', '#eaeef2');
        document.documentElement.style.setProperty('--border', '#d0d7de');
        document.documentElement.style.setProperty('--text-primary', '#1f2328');
        document.documentElement.style.setProperty('--text-secondary', '#656d76');
        document.documentElement.style.setProperty('--text-tertiary', '#8c959f');
      } else {
        document.documentElement.style.setProperty('--bg-primary', '#0d1117');
        document.documentElement.style.setProperty('--bg-secondary', '#161b22');
        document.documentElement.style.setProperty('--bg-tertiary', '#21262d');
        document.documentElement.style.setProperty('--border', '#30363d');
        document.documentElement.style.setProperty('--text-primary', '#e6edf3');
        document.documentElement.style.setProperty('--text-secondary', '#8b949e');
        document.documentElement.style.setProperty('--text-tertiary', '#6e7681');
      }
    }
    
    // Load saved preferences
    document.addEventListener('DOMContentLoaded', () => {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      const savedWrap = localStorage.getItem('wrap') || 'pre';
      applyTheme(savedTheme);
      document.querySelector('pre').style.whiteSpace = savedWrap;
    });
    
    // Highlight current line on click
    codeEl.addEventListener('click', (e) => {
      if (e.target === codeEl || e.target.parentNode === codeEl) {
        const selection = window.getSelection();
        if (selection.type !== 'Range') {
          document.querySelectorAll('.line-highlight').forEach(el => el.classList.remove('line-highlight'));
        }
      }
    });
  </script>
</body>
</html>`;

    res.send(html);
    
  } catch (err) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - ${path.basename(filePath)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            max-width: 600px;
            width: 100%;
          }
          .error-icon {
            font-size: 60px;
            color: #ff6b6b;
            margin-bottom: 20px;
          }
          h1 { color: #c92a2a; margin-bottom: 20px; }
          .error-details {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
            font-family: 'Consolas', monospace;
            font-size: 14px;
            overflow-x: auto;
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
            transition: all 0.3s;
          }
          .btn:hover {
            background: #5a67d8;
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="error-card">
          <div class="error-icon">❌</div>
          <h1>Error Loading File</h1>
          <div class="error-details">
            <pre>${err.message}</pre>
          </div>
          <div>
            <a href="/" class="btn">🏠 Back to Browser</a>
            <a href="javascript:location.reload()" class="btn">🔄 Try Again</a>
          </div>
        </div>
      </body>
      </html>
    `);
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