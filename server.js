const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_DIR = __dirname;

// Static folders
app.use(express.static(path.join(__dirname, "public")));
["game", "audio", "image", "font", "code"].forEach(folder => {
  app.use(`/${folder}`, express.static(path.join(__dirname, folder)));
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const HIDDEN = new Set([
  "public", "package.json", "server.js", "server.js.bak",
  "package-lock.json", ".git", ".env", ".v8-cache", "___vc",
  "vercel.json", "", "node_modules"
]);

// Helper functions
const cleanPath = (p) => p ? p.replace(/\\/g, "/").replace(/\.\./g, "") : "";
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// API: List folder
app.get("/api/list", async (req, res) => {
  try {
    const rel = cleanPath(req.query.path || "");
    const dir = path.join(BASE_DIR, rel);
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const items = await Promise.all(
      entries
        .filter(e => !HIDDEN.has(e.name))
        .map(async e => {
          const full = path.join(dir, e.name);
          const stat = await fs.stat(full);
          const ext = path.extname(e.name).toLowerCase();
          const icon = e.isDirectory() ? "📁" : 
            [".js", ".jsx", ".ts", ".tsx"].includes(ext) ? "📜" :
            [".py", ".rb", ".php", ".go", ".rs"].includes(ext) ? "🐍" :
            [".java", ".cpp", ".c", ".cs"].includes(ext) ? "☕" :
            [".html", ".css", ".scss"].includes(ext) ? "🌐" :
            [".json", ".xml", ".yaml"].includes(ext) ? "📋" :
            [".md", ".txt"].includes(ext) ? "📄" :
            [".jpg", ".png", ".gif", ".svg"].includes(ext) ? "🖼️" :
            [".mp3", ".wav", ".mp4", ".avi"].includes(ext) ? "🎵" :
            [".zip", ".rar", ".7z"].includes(ext) ? "🗜️" : "📎";

          return {
            name: e.name,
            type: e.isDirectory() ? "folder" : "file",
            size: stat.size,
            mtime: stat.mtime,
            ext,
            icon
          };
        })
    );

    items.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1);
    res.json({ path: rel, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Raw view with beautiful formatting
app.get("/api/raw", async (req, res) => {
  const rel = cleanPath(req.query.path || "");
  const filePath = path.join(BASE_DIR, rel);

  try {
    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Read file
    const data = await fs.readFile(filePath, "utf8");
    
    // Get language for syntax highlighting
    const getLang = () => {
      const langs = {
        '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
        '.py': 'python', '.rb': 'ruby', '.php': 'php', '.java': 'java',
        '.cpp': 'cpp', '.c': 'c', '.cs': 'csharp', '.go': 'go', '.rs': 'rust',
        '.html': 'html', '.css': 'css', '.scss': 'scss', '.sass': 'sass',
        '.json': 'json', '.xml': 'xml', '.yaml': 'yaml', '.yml': 'yaml',
        '.sql': 'sql', '.md': 'markdown', '.txt': 'plaintext',
        '.sh': 'bash', '.bat': 'batch', '.ps1': 'powershell',
        '.lua': 'lua', '.swift': 'swift', '.kt': 'kotlin', '.dart': 'dart',
        '.r': 'r', '.pl': 'perl', '.erl': 'erlang'
      };
      return langs[ext] || 'plaintext';
    };

    // HTML template with syntax highlighting
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    }
    .header {
      background: #161b22;
      padding: 15px 20px;
      border-bottom: 1px solid #30363d;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .file-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .file-icon {
      font-size: 24px;
    }
    .file-name {
      font-size: 18px;
      font-weight: 600;
    }
    .file-meta {
      color: #8b949e;
      font-size: 14px;
    }
    .badge {
      background: #238636;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
      background: #161b22;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #30363d;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #58a6ff;
    }
    .stat-label {
      font-size: 12px;
      color: #8b949e;
      margin-top: 4px;
    }
    .code-container {
      background: #161b22;
      border-radius: 8px;
      border: 1px solid #30363d;
      overflow: hidden;
    }
    pre {
      margin: 0;
      padding: 20px;
      overflow-x: auto;
      max-height: 70vh;
    }
    code {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    .hljs {
      background: transparent !important;
    }
    .controls {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #238636;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .btn:hover {
      background: #2ea043;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #30363d;
    }
    .btn-secondary:hover {
      background: #484f58;
    }
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; }
      .stats { grid-template-columns: 1fr; }
      pre { padding: 15px; font-size: 12px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="file-info">
      <div class="file-icon">📄</div>
      <div>
        <div class="file-name">${fileName}</div>
        <div class="file-meta">${formatBytes(stat.size)} • ${new Date(stat.mtime).toLocaleString()}</div>
      </div>
    </div>
    <div class="badge">${ext.toUpperCase().replace('.', '') || 'FILE'}</div>
  </div>
  
  <div class="container">
    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">${formatBytes(stat.size)}</div>
        <div class="stat-label">Size</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.split('\\n').length}</div>
        <div class="stat-label">Lines</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${data.length.toLocaleString()}</div>
        <div class="stat-label">Characters</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${getLang().toUpperCase()}</div>
        <div class="stat-label">Language</div>
      </div>
    </div>
    
    <div class="code-container">
      <pre><code class="language-${getLang()}">${data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    </div>
    
    <div class="controls">
      <a href="/${rel}" class="btn" download>
        <span>⬇️</span> Download File
      </a>
      <a href="/" class="btn btn-secondary">
        <span>🏠</span> Back to Browser
      </a>
      <button onclick="copyCode()" class="btn" style="background: #8b5cf6;">
        <span>📋</span> Copy Code
      </button>
      <button onclick="toggleTheme()" class="btn" style="background: #f59e0b;">
        <span>🎨</span> Toggle Theme
      </button>
    </div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    hljs.highlightAll();
    
    function copyCode() {
      const code = document.querySelector('code').innerText;
      navigator.clipboard.writeText(code).then(() => {
        alert('✅ Code copied to clipboard!');
      });
    }
    
    function toggleTheme() {
      document.body.style.filter = document.body.style.filter === 'invert(1)' ? '' : 'invert(1)';
    }
    
    // Line numbers
    const codeEl = document.querySelector('code');
    const lines = codeEl.innerHTML.split('\\n').length;
    if (lines > 1) {
      const lineNumbers = Array.from({length: lines}, (_, i) => i + 1).join('\\n');
      codeEl.style.paddingLeft = '60px';
      codeEl.parentElement.style.position = 'relative';
      const lineNumDiv = document.createElement('div');
      lineNumDiv.innerHTML = lineNumbers;
      lineNumDiv.style.cssText = \`
        position: absolute;
        left: 0;
        top: 20px;
        padding: 0 15px;
        text-align: right;
        color: #6e7681;
        user-select: none;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
      \`;
      codeEl.parentElement.appendChild(lineNumDiv);
    }
  </script>
</body>
</html>`;

    res.send(html);
    
  } catch (err) {
    res.status(500).send(`
      <html>
        <style>
          body { background: #ff6b6b; color: white; padding: 40px; font-family: sans-serif; }
          .error { background: white; color: #333; padding: 20px; border-radius: 10px; }
        </style>
        <body>
          <div class="error">
            <h1>❌ Error Loading File</h1>
            <pre>${err.message}</pre>
            <a href="/" style="color: #667eea; text-decoration: none;">← Back to Browser</a>
          </div>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/