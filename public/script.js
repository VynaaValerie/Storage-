const listEl = document.getElementById("list");
const breadcrumbEl = document.getElementById("breadcrumb");
const backBtn = document.getElementById("btn-back");

let currentPath = "";

// Helper functions
const formatSize = bytes => {
  if (bytes < 1024) return bytes + " B";
  const KB = bytes / 1024;
  if (KB < 1024) return KB.toFixed(1) + " KB";
  const MB = KB / 1024;
  if (MB < 1024) return MB.toFixed(1) + " MB";
  const GB = MB / 1024;
  return GB.toFixed(1) + " GB";
};

const formatDate = d => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  
  const now = new Date();
  const diff = now - dt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  if (days < 7) return `${days}h lalu`;
  
  return dt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

// Load folder list
async function loadList(path) {
  try {
    const url = "/api/list" + (path ? `?path=${encodeURIComponent(path)}` : "");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    currentPath = data.path || "";
    renderBreadcrumb(currentPath);
    renderList(data.items || []);
    updateBack();
  } catch (err) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 48px; color: var(--danger);">❌</div>
        <h3>Error Loading</h3>
        <p>${err.message}</p>
        <button onclick="loadList(currentPath)" style="
          margin-top: 16px;
          background: var(--accent);
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        ">
          🔄 Try Again
        </button>
      </div>
    `;
  }
}

// Render breadcrumb
function renderBreadcrumb(path) {
  breadcrumbEl.innerHTML = "";
  
  const root = document.createElement("span");
  root.className = "crumb-clickable";
  root.textContent = "🏠 Root";
  root.onclick = () => loadList("");
  breadcrumbEl.appendChild(root);
  
  if (!path) return;
  
  const parts = path.split("/").filter(Boolean);
  let walk = "";
  
  parts.forEach((p, idx) => {
    const sep = document.createElement("span");
    sep.className = "crumb-separator";
    sep.innerHTML = " &rsaquo; ";
    breadcrumbEl.appendChild(sep);
    
    const span = document.createElement("span");
    span.textContent = p;
    
    if (idx === parts.length - 1) {
      span.className = "crumb-current";
      span.title = "Current folder";
    } else {
      span.className = "crumb-clickable";
      walk += (walk ? "/" : "") + p;
      span.onclick = () => loadList(walk);
      span.title = `Open ${p}`;
    }
    
    breadcrumbEl.appendChild(span);
  });
}

// Render file list
function renderList(items) {
  listEl.innerHTML = "";
  
  if (!items.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 48px; opacity: 0.5;">📭</div>
        <h3>Folder Kosong</h3>
        <p>Tidak ada file atau folder di sini</p>
      </div>
    `;
    return;
  }
  
  items.forEach((it, index) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.style.animationDelay = `${index * 0.05}s`;
    
    // Icon
    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.innerHTML = it.icon || (it.type === "folder" ? "📁" : "📎");
    icon.title = it.type === "folder" ? "Folder" : `File ${it.ext || ''}`;
    
    // Main content
    const main = document.createElement("div");
    main.className = "item-main";
    
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = it.name;
    name.title = it.name;
    
    const meta = document.createElement("div");
    meta.className = "item-meta";
    
    const typeSpan = document.createElement("span");
    typeSpan.textContent = it.type === "folder" ? "📁 Folder" : getFileTypeText(it.ext);
    
    const sizeSpan = document.createElement("span");
    sizeSpan.textContent = it.type === "folder" ? "" : formatSize(it.size || 0);
    
    meta.appendChild(typeSpan);
    if (it.type !== "folder") {
      const sep = document.createElement("span");
      sep.innerHTML = " &middot; ";
      meta.appendChild(sep);
      meta.appendChild(sizeSpan);
    }
    
    main.appendChild(name);
    main.appendChild(meta);
    
    // Right side
    const right = document.createElement("div");
    right.className = "item-right";
    
    const timeDiv = document.createElement("div");
    timeDiv.textContent = formatDate(it.mtime);
    timeDiv.title = new Date(it.mtime).toLocaleString();
    
    const sizeDiv = document.createElement("div");
    sizeDiv.textContent = it.type === "folder" ? "" : formatSize(it.size || 0);
    sizeDiv.style.fontSize = "11px";
    sizeDiv.style.opacity = "0.7";
    
    right.appendChild(timeDiv);
    right.appendChild(sizeDiv);
    
    // Append all
    row.appendChild(icon);
    row.appendChild(main);
    row.appendChild(right);
    
    // Click handler
    row.onclick = (e) => {
      if (e.detail > 1) return; // Skip double click
      
      if (it.type === "folder") {
        loadList(currentPath ? `${currentPath}/${it.name}` : it.name);
      } else {
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        const ext = it.ext.toLowerCase();
        
        // File types that should open in raw view
        const rawTypes = [
          // Programming languages
          '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
          '.py', '.rb', '.php', '.java', '.cpp', '.c', '.cs',
          '.go', '.rs', '.swift', '.kt', '.dart', '.lua',
          '.r', '.pl', '.erl', '.ex', '.clj', '.scm',
          '.hs', '.fs', '.ml', '.v', '.vhd', '.tex', '.asm',
          '.html', '.htm', '.css', '.scss', '.sass', '.less',
          '.json', '.xml', '.yaml', '.yml', '.toml', '.ini',
          '.cfg', '.conf', '.env', '.sql', '.md', '.txt',
          '.rtf', '.csv', '.tsv', '.log', '.gitignore',
          '.dockerfile', '.makefile', '.fnt',
          // Shell scripts
          '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'
        ];
        
        // Media files - open directly
        const mediaTypes = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp', '.ico'];
        const audioTypes = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma'];
        const videoTypes = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'];
        
        // Archives - download
        const archiveTypes = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'];
        
        // Documents - open directly
        const docTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
        
        if (rawTypes.includes(ext)) {
          window.open(`/api/raw?path=${encodeURIComponent(p)}`, '_blank');
        } else if (mediaTypes.includes(ext)) {
          window.open(`/${p}`, '_blank');
        } else if (audioTypes.includes(ext)) {
          window.open(`/${p}`, '_blank');
        } else if (videoTypes.includes(ext)) {
          window.open(`/${p}`, '_blank');
        } else if (archiveTypes.includes(ext)) {
          window.open(`/${p}`, '_blank');
        } else if (docTypes.includes(ext)) {
          window.open(`/${p}`, '_blank');
        } else {
          // Default: try raw view
          window.open(`/api/raw?path=${encodeURIComponent(p)}`, '_blank');
        }
      }
    };
    
    // Double click for quick open
    let clickTimer;
    row.ondblclick = (e) => {
      e.preventDefault();
      clearTimeout(clickTimer);
      
      if (it.type === "folder") {
        loadList(currentPath ? `${currentPath}/${it.name}` : it.name);
      } else {
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        window.open(`/${p}`, '_blank');
      }
    };
    
    // Right click context menu
    row.oncontextmenu = (e) => {
      e.preventDefault();
      showContextMenu(e, it);
      return false;
    };
    
    // Keyboard navigation
    row.tabIndex = 0;
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    });
    
    listEl.appendChild(row);
  });
}

// Get file type text
function getFileTypeText(ext) {
  if (!ext) return "File";
  
  const types = {
    '.js': 'JavaScript', '.jsx': 'JSX', '.ts': 'TypeScript', '.tsx': 'TSX',
    '.mjs': 'ES Module', '.cjs': 'CommonJS',
    '.py': 'Python', '.rb': 'Ruby', '.php': 'PHP',
    '.java': 'Java', '.cpp': 'C++', '.c': 'C', '.cs': 'C#',
    '.go': 'Go', '.rs': 'Rust', '.swift': 'Swift',
    '.kt': 'Kotlin', '.dart': 'Dart', '.lua': 'Lua',
    '.html': 'HTML', '.css': 'CSS', '.json': 'JSON',
    '.xml': 'XML', '.yaml': 'YAML', '.yml': 'YAML',
    '.sql': 'SQL', '.md': 'Markdown', '.txt': 'Text',
    '.sh': 'Shell', '.bat': 'Batch', '.ps1': 'PowerShell',
    '.jpg': 'Image', '.png': 'Image', '.gif': 'Image',
    '.mp3': 'Audio', '.mp4': 'Video', '.pdf': 'PDF',
    '.zip': 'Archive', '.rar': 'Archive'
  };
  
  return types[ext] || ext.toUpperCase().replace('.', '') + ' File';
}

// Context menu
function showContextMenu(e, item) {
  // Remove existing menu
  const existing = document.querySelector('.context-menu');
  if (existing) existing.remove();
  
  const p = currentPath ? `${currentPath}/${item.name}` : item.name;
  
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.cssText = `
    position: fixed;
    top: ${e.clientY}px;
    left: ${e.clientX}px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 0;
    min-width: 220px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    z-index: 9999;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.2s ease-out;
  `;
  
  const menuItems = [
    {
      icon: item.type === 'folder' ? '📂' : '📄',
      text: item.type === 'folder' ? 'Open Folder' : 'Open File',
      action: () => {
        if (item.type === 'folder') {
          loadList(p);
        } else {
          window.open(`/${p}`, '_blank');
        }
      }
    },
    {
      icon: '👁️',
      text: 'Preview',
      action: () => window.open(`/api/raw?path=${encodeURIComponent(p)}`, '_blank'),
      hide: item.type === 'folder'
    },
    { separator: true },
    {
      icon: '🔗',
      text: 'Open in New Tab',
      action: () => window.open(`/${p}`, '_blank')
    },
    {
      icon: '⬇️',
      text: 'Download',
      action: () => {
        const a = document.createElement('a');
        a.href = `/${p}`;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    },
    { separator: true },
    {
      icon: '📋',
      text: 'Copy Path',
      action: () => {
        navigator.clipboard.writeText(p).then(() => {
          showToast(`✅ Path copied: ${item.name}`);
        });
      }
    },
    {
      icon: '🔗',
      text: 'Copy URL',
      action: () => {
        const url = window.location.origin + '/' + p;
        navigator.clipboard.writeText(url).then(() => {
          showToast(`✅ URL copied: ${item.name}`);
        });
      }
    },
    { separator: true },
    {
      icon: 'ℹ️',
      text: 'File Info',
      action: () => {
        const info = `
📄 ${item.name}
📁 Type: ${item.type === 'folder' ? 'Folder' : 'File'}
📦 Size: ${formatSize(item.size || 0)}
📅 Modified: ${new Date(item.mtime).toLocaleString()}
🔤 Extension: ${item.ext || 'None'}
📂 Path: ${p}
        `.trim();
        alert(info);
      }
    }
  ];
  
  menuItems.forEach(item => {
    if (item.separator) {
      const hr = document.createElement('hr');
      hr.style.cssText = `
        border: none;
        border-top: 1px solid var(--border);
        margin: 8px 0;
      `;
      menu.appendChild(hr);
    } else if (!item.hide) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 16px;
        background: none;
        border: none;
        color: var(--text);
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        text-align: left;
        transition: background 0.2s;
      `;
      btn.innerHTML = `
        <span style="font-size: 16px;">${item.icon}</span>
        <span>${item.text}</span>
      `;
      
      btn.onmouseenter = () => btn.style.background = 'var(--bg-hover)';
      btn.onmouseleave = () => btn.style.background = 'none';
      btn.onclick = (e) => {
        e.stopPropagation();
        item.action();
        menu.remove();
      };
      
      menu.appendChild(btn);
    }
  });
  
  document.body.appendChild(menu);
  
  // Close menu when clicking outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  
  setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

// Toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--accent);
    color: #000;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 99999;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Update back button
function updateBack() {
  if (!currentPath) {
    backBtn.disabled = true;
    backBtn.classList.add("back-btn-disabled");
    backBtn.title = "Already at root";
  } else {
    backBtn.disabled = false;
    backBtn.classList.remove("back-btn-disabled");
    backBtn.title = "Go back";
  }
}

// Back button handler
backBtn.onclick = () => {
  if (!currentPath || backBtn.disabled) return;
  const parts = currentPath.split("/").filter(Boolean);
  parts.pop();
  loadList(parts.join("/"));
};

// Initialize search
function initSearch() {
  const searchHTML = `
    <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
      <div style="position: relative; flex: 1;">
        <input type="text" id="searchInput" placeholder="🔍 Search files..." 
          style="width: 100%; padding: 10px 15px 10px 40px; border-radius: 8px; 
                 border: 1px solid var(--border); background: var(--bg); 
                 color: var(--text); font-size: 14px;">
        <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);">
          🔍
        </div>
      </div>
      <button id="clearSearch" style="
        background: var(--danger);
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        display: none;
      ">
        Clear
      </button>
    </div>
  `;
  
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const searchDiv = document.createElement('div');
    searchDiv.innerHTML = searchHTML;
    topbar.appendChild(searchDiv);
    
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      clearBtn.style.display = term ? 'block' : 'none';
      
      if (!term) {
        loadList(currentPath);
        return;
      }
      
      const items = document.querySelectorAll('.item-row');
      items.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        const type = item.querySelector('.item-meta').textContent.toLowerCase();
        item.style.display = (name.includes(term) || type.includes(term)) ? '' : 'none';
      });
    });
    
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      loadList(currentPath);
    });
    
    // Keyboard shortcut: Ctrl+F
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && !e.target.matches("input, textarea, [contenteditable]")) {
    e.preventDefault();
    backBtn.click();
  }
  if (e.key === "Escape") {
    const menu = document.querySelector('.context-menu');
    if (menu) menu.remove();
    const search = document.getElementById('searchInput');
    if (search && document.activeElement === search) {
      search.value = '';
      search.blur();
      loadList(currentPath);
    }
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadList("");
  setTimeout(initSearch, 500);
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .item-row {
      animation: fadeIn 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
});

// Export for debugging
window.storageBrowser = {
  loadList,
  currentPath: () => currentPath,
  reload: () => loadList(currentPath)
};

/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/