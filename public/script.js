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
  return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString();
};

// Load folder list
async function loadList(path) {
  const url = "/api/list" + (path ? `?path=${encodeURIComponent(path)}` : "");
  const res = await fetch(url);
  const data = await res.json();
  
  currentPath = data.path || "";
  renderBreadcrumb(currentPath);
  renderList(data.items || []);
  updateBack();
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
    breadcrumbEl.appendChild(document.createTextNode(" / "));
    walk += (walk ? "/" : "") + p;
    
    const span = document.createElement("span");
    span.textContent = p;
    span.className = idx === parts.length - 1 ? "crumb-current" : "crumb-clickable";
    if (idx !== parts.length - 1) span.onclick = () => loadList(walk);
    
    breadcrumbEl.appendChild(span);
  });
}

// Render file list
function renderList(items) {
  listEl.innerHTML = "";
  
  if (!items.length) {
    listEl.innerHTML = '<div class="empty">📁 Folder kosong</div>';
    return;
  }
  
  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.title = `Klik untuk ${it.type === "folder" ? "buka" : "preview"}`;
    
    // Icon
    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.innerHTML = it.icon || (it.type === "folder" ? "📁" : "📄");
    
    // Main content
    const main = document.createElement("div");
    main.className = "item-main";
    
    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = it.name;
    
    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = it.type === "folder" ? "Folder" : formatSize(it.size || 0);
    
    main.appendChild(name);
    main.appendChild(meta);
    
    // Right side
    const right = document.createElement("div");
    right.className = "item-right";
    right.textContent = formatDate(it.mtime);
    
    // Append
    row.appendChild(icon);
    row.appendChild(main);
    row.appendChild(right);
    
    // Click handler
    row.onclick = () => {
      if (it.type === "folder") {
        loadList(currentPath ? `${currentPath}/${it.name}` : it.name);
      } else {
        // Determine file type
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        const ext = it.ext.toLowerCase();
        
        // List of file extensions that should open in raw view
        const rawExtensions = [
          // Programming
          '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.php', '.java',
          '.cpp', '.c', '.cs', '.go', '.rs', '.swift', '.kt', '.dart',
          '.lua', '.r', '.pl', '.erl', '.ex',
          // Web
          '.html', '.htm', '.css', '.scss', '.sass', '.less',
          // Data
          '.json', '.xml', '.yaml', '.yml', '.sql',
          // Config
          '.md', '.txt', '.env', '.ini', '.cfg', '.conf',
          // Scripts
          '.sh', '.bash', '.bat', '.cmd', '.ps1',
          // Others
          '.fnt', '.log', '.gitignore', '.dockerfile'
        ];
        
        if (rawExtensions.includes(ext)) {
          // Open in raw view (new tab)
          window.open(`/api/raw?path=${encodeURIComponent(p)}`, '_blank');
        } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'].includes(ext)) {
          // Images - open directly
          window.location.href = `/${p}`;
        } else if (['.mp3', '.wav', '.ogg', '.flac', '.m4a'].includes(ext)) {
          // Audio - open directly
          window.location.href = `/${p}`;
        } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
          // Video - open directly
          window.location.href = `/${p}`;
        } else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
          // Archives - download
          window.location.href = `/${p}`;
        } else {
          // Others - try raw view first
          window.open(`/api/raw?path=${encodeURIComponent(p)}`, '_blank');
        }
      }
    };
    
    // Double click for folder (quick open)
    let clickTimer;
    row.ondblclick = (e) => {
      e.preventDefault();
      if (clickTimer) clearTimeout(clickTimer);
      
      if (it.type === "folder") {
        loadList(currentPath ? `${currentPath}/${it.name}` : it.name);
      } else {
        // Open file in new tab
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        window.open(`/${p}`, '_blank');
      }
    };
    
    // Right click context menu
    row.oncontextmenu = (e) => {
      e.preventDefault();
      const p = currentPath ? `${currentPath}/${it.name}` : it.name;
      
      if (it.type === "folder") {
        if (confirm(`Buka folder "${it.name}" di tab baru?`)) {
          window.open(`/api/list?path=${encodeURIComponent(p)}`, '_blank');
        }
      } else {
        const actions = [
          `📋 Nama: ${it.name}`,
          `📦 Ukuran: ${formatSize(it.size || 0)}`,
          `📅 Modifikasi: ${new Date(it.mtime).toLocaleString()}`,
          "---",
          `🔗 Buka di Tab Baru`,
          `📥 Download File`,
          `📋 Copy Path`
        ];
        
        const action = prompt("Pilih aksi:\n" + actions.join("\n"));
        if (action === "🔗 Buka di Tab Baru") {
          window.open(`/${p}`, '_blank');
        } else if (action === "📥 Download File") {
          window.location.href = `/${p}`;
        } else if (action === "📋 Copy Path") {
          navigator.clipboard.writeText(p);
          alert(`✅ Path disalin: ${p}`);
        }
      }
    };
    
    listEl.appendChild(row);
  });
}

// Update back button
function updateBack() {
  if (!currentPath) {
    backBtn.disabled = true;
    backBtn.classList.add("back-btn-disabled");
    backBtn.title = "Sudah di root";
  } else {
    backBtn.disabled = false;
    backBtn.classList.remove("back-btn-disabled");
    backBtn.title = "Kembali ke folder atas";
  }
}

// Back button handler
backBtn.onclick = () => {
  if (!currentPath) return;
  const parts = currentPath.split("/").filter(Boolean);
  parts.pop();
  loadList(parts.join("/"));
};

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && !e.target.matches("input, textarea")) {
    e.preventDefault();
    backBtn.click();
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => loadList(""));

// Search functionality
setTimeout(() => {
  const searchHTML = `
    <div style="display: flex; gap: 10px; margin-top: 10px;">
      <input type="text" id="searchInput" placeholder="🔍 Cari file..." 
        style="flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text);">
      <button id="searchBtn" style="padding: 8px 16px; border-radius: 8px; background: var(--accent); color: black; border: none; cursor: pointer;">
        Cari
      </button>
    </div>
  `;
  
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const searchDiv = document.createElement('div');
    searchDiv.innerHTML = searchHTML;
    topbar.appendChild(searchDiv);
    
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    const performSearch = () => {
      const term = searchInput.value.toLowerCase();
      if (!term) return loadList(currentPath);
      
      const items = document.querySelectorAll('.item-row');
      items.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(term) ? '' : 'none';
      });
    };
    
    searchInput.addEventListener('input', performSearch);
    searchBtn.addEventListener('click', performSearch);
  }
}, 1000);

/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/