/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/

const listEl = document.getElementById("list");
const breadcrumbEl = document.getElementById("breadcrumb");
const backBtn = document.getElementById("btn-back");
const previewContent = document.getElementById("preview-content");
const previewName = document.getElementById("preview-name");

let currentPath = "";
let isLoading = false;

// Format size file
function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Format tanggal
function formatDate(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  
  const now = new Date();
  const diffMs = now - dt;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  return dt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: dt.getFullYear() !== now.getFullYear() ? "numeric" : undefined
  });
}

// Format waktu
function formatTime(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Get file type class
function getFileTypeClass(ext, mime) {
  if (!ext) return "";
  
  const imageExt = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const audioExt = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
  const videoExt = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  const codeExt = ['.js', '.json', '.html', '.css', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs'];
  const docExt = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
  const archiveExt = ['.zip', '.rar', '.7z', '.tar', '.gz'];
  
  if (imageExt.includes(ext)) return "file-img";
  if (audioExt.includes(ext)) return "file-audio";
  if (videoExt.includes(ext)) return "file-video";
  if (codeExt.includes(ext)) return "file-code";
  if (docExt.includes(ext)) return "file-doc";
  if (archiveExt.includes(ext)) return "file-archive";
  
  return "";
}

// Load list folder
async function loadList(path) {
  if (isLoading) return;
  
  isLoading = true;
  listEl.classList.add("loading");
  
  try {
    const url = "/api/list" + (path ? `?path=${encodeURIComponent(path)}` : "");
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    currentPath = data.path || "";
    
    renderBreadcrumb(currentPath);
    renderList(data.items || []);
    updateBack();
    
    // Update preview
    previewName.textContent = currentPath ? `📁 ${currentPath.split('/').pop() || 'Root'}` : "📁 Root";
    previewContent.textContent = currentPath 
      ? `📊 ${data.items?.length || 0} item${data.items?.length !== 1 ? 's' : ''} di folder ini`
      : "🌐 Pilih file atau folder untuk melihat preview";
      
  } catch (err) {
    console.error("Error loading list:", err);
    showError("Gagal memuat konten: " + err.message);
  } finally {
    isLoading = false;
    listEl.classList.remove("loading");
  }
}

// Show error message
function showError(message) {
  listEl.innerHTML = `
    <div class="empty-state">
      <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
      <h3 style="color: var(--danger)">Error</h3>
      <p>${message}</p>
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
        🔄 Coba Lagi
      </button>
    </div>
  `;
}

// Render folder breadcrumb
function renderBreadcrumb(path) {
  breadcrumbEl.innerHTML = "";

  const root = document.createElement("span");
  root.className = "crumb-clickable";
  root.textContent = "🏠 Root";
  root.onclick = () => loadList("");
  root.title = "Kembali ke root directory";
  breadcrumbEl.appendChild(root);

  if (!path) return;

  const parts = path.split("/").filter(Boolean);
  let walk = "";

  parts.forEach((p, idx) => {
    const separator = document.createElement("span");
    separator.className = "crumb-separator";
    separator.textContent = " › ";
    separator.innerHTML = "&nbsp;&rsaquo;&nbsp;";
    breadcrumbEl.appendChild(separator);

    const s = document.createElement("span");
    s.textContent = p;
    s.title = `Buka: ${p}`;

    if (idx === parts.length - 1) {
      s.className = "crumb-current";
      s.title = `Folder saat ini: ${p}`;
    } else {
      s.className = "crumb-clickable";
      walk += (walk ? "/" : "") + p;
      s.onclick = () => loadList(walk);
    }
    breadcrumbEl.appendChild(s);
  });
}

// Render daftar file/folder
function renderList(items) {
  if (!items.length) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
        <h3>Folder Kosong</h3>
        <p>Tidak ada file atau folder di direktori ini</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  
  items.forEach((it, index) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.style.animationDelay = `${index * 0.03}s`;
    
    // Icon
    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.innerHTML = it.icon || (it.type === "folder" ? "📁" : "📄");
    icon.title = it.type === "folder" ? "Folder" : `File: ${it.ext || 'Unknown'}`;
    
    // Main content
    const main = document.createElement("div");
    main.className = "item-main";
    
    const name = document.createElement("div");
    name.className = `item-name ${getFileTypeClass(it.ext, it.mime)}`;
    name.textContent = it.name;
    name.title = it.name;
    
    const meta = document.createElement("div");
    meta.className = "item-meta";
    
    const typeSpan = document.createElement("span");
    typeSpan.textContent = it.type === "folder" ? "📁 Folder" : 
                          it.mime?.startsWith('image/') ? "🖼️ Image" :
                          it.mime?.startsWith('audio/') ? "🎵 Audio" :
                          it.mime?.startsWith('video/') ? "🎥 Video" :
                          it.mime?.startsWith('text/') ? "📄 Text" :
                          it.ext ? `📎 ${it.ext.toUpperCase().replace('.', '')}` : "📎 File";
    
    const sizeSpan = document.createElement("span");
    sizeSpan.textContent = it.type === "folder" ? "" : formatSize(it.size || 0);
    
    meta.appendChild(typeSpan);
    if (it.type !== "folder") {
      const separator = document.createElement("span");
      separator.innerHTML = "&nbsp;•&nbsp;";
      meta.appendChild(separator);
      meta.appendChild(sizeSpan);
    }
    
    main.appendChild(name);
    main.appendChild(meta);
    
    // Right side
    const right = document.createElement("div");
    right.className = "item-right";
    
    const timeDiv = document.createElement("div");
    timeDiv.textContent = formatDate(it.mtime);
    timeDiv.title = formatTime(it.mtime);
    
    const sizeDiv = document.createElement("div");
    sizeDiv.textContent = it.type === "folder" ? "—" : formatSize(it.size || 0);
    sizeDiv.style.fontSize = "10px";
    sizeDiv.style.opacity = "0.7";
    
    right.appendChild(timeDiv);
    right.appendChild(sizeDiv);
    
    row.appendChild(icon);
    row.appendChild(main);
    row.appendChild(right);
    
    // Click handler
    row.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Add click animation
      row.style.transform = "scale(0.98)";
      setTimeout(() => {
        row.style.transform = "";
      }, 150);
      
      if (it.type === "folder") {
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        loadList(p);
      } else {
        // Preview file content
        previewFile(it);
      }
    };
    
    // Right click handler (context menu)
    row.oncontextmenu = (e) => {
      e.preventDefault();
      showContextMenu(e, it);
    };
    
    // Double click handler
    let clickTimer = null;
    row.ondblclick = (e) => {
      e.preventDefault();
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      
      if (it.type === "folder") {
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        loadList(p);
      } else {
        // Open file in new tab
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        window.open(`/${p}`, '_blank');
      }
    };
    
    // Single click with delay
    row.onclick = (e) => {
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        return;
      }
      
      clickTimer = setTimeout(() => {
        if (it.type === "folder") {
          const p = currentPath ? `${currentPath}/${it.name}` : it.name;
          loadList(p);
        } else {
          previewFile(it);
        }
        clickTimer = null;
      }, 250);
    };
    
    fragment.appendChild(row);
  });
  
  listEl.innerHTML = "";
  listEl.appendChild(fragment);
}

// Preview file content
async function previewFile(file) {
  const p = currentPath ? `${currentPath}/${file.name}` : file.name;
  
  previewName.textContent = `👁️ ${file.name}`;
  previewContent.textContent = "Memuat preview...";
  
  try {
    // Untuk file teks, ambil preview
    if (file.mime?.startsWith('text/') || 
        ['.js', '.json', '.html', '.css', '.txt', '.md', '.py', '.java'].includes(file.ext)) {
      
      // Limit preview size
      if (file.size > 1024 * 100) { // 100KB
        previewContent.textContent = `File terlalu besar untuk preview (${formatSize(file.size)})\nGunakan "Open in New Tab" untuk melihat isi lengkap.`;
        return;
      }
      
      const res = await fetch(`/api/raw?path=${encodeURIComponent(p)}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const text = await res.text();
      // Show first 2000 chars
      previewContent.textContent = text.length > 2000 
        ? text.substring(0, 2000) + "\n\n... [CONTENT TRUNCATED - OPEN IN NEW TAB TO VIEW FULL FILE] ..."
        : text;
    } else if (file.mime?.startsWith('image/')) {
      previewContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🖼️</div>
          <h3 style="margin-bottom: 8px;">${file.name}</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">
            ${formatSize(file.size)} • ${file.mime}
          </p>
          <img 
            src="/${p}" 
            style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 16px;"
            alt="${file.name}"
          >
          <div>
            <button onclick="openFile('${p}')" style="
              background: var(--accent);
              color: #000;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin: 4px;
            ">
              🔗 Buka di Tab Baru
            </button>
            <button onclick="downloadFile('${p}')" style="
              background: var(--info);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin: 4px;
            ">
              ⬇️ Download
            </button>
          </div>
        </div>
      `;
    } else if (file.mime?.startsWith('audio/')) {
      previewContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎵</div>
          <h3 style="margin-bottom: 8px;">${file.name}</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">
            ${formatSize(file.size)} • ${file.mime}
          </p>
          <audio controls style="width: 100%; margin-bottom: 16px;">
            <source src="/${p}" type="${file.mime}">
          </audio>
          <div>
            <button onclick="openFile('${p}')" style="
              background: var(--accent);
              color: #000;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin: 4px;
            ">
              🔗 Buka di Tab Baru
            </button>
          </div>
        </div>
      `;
    } else {
      previewContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">${file.icon || '📎'}</div>
          <h3 style="margin-bottom: 8px;">${file.name}</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">
            ${formatSize(file.size)} • ${file.mime || 'Unknown type'}
          </p>
          <p style="margin-bottom: 16px;">
            File ini tidak bisa dipreview di browser.
          </p>
          <div>
            <button onclick="openFile('${p}')" style="
              background: var(--accent);
              color: #000;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin: 4px;
            ">
              🔗 Buka di Tab Baru
            </button>
            <button onclick="downloadFile('${p}')" style="
              background: var(--info);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin: 4px;
            ">
              ⬇️ Download
            </button>
            <button onclick="copyFileLink('${p}')" style="
              background: var(--success);
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin: 4px;
            ">
              📋 Copy Link
            </button>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error("Error previewing file:", err);
    previewContent.textContent = `Error loading preview: ${err.message}`;
  }
}

// Update tombol back
function updateBack() {
  if (!currentPath) {
    backBtn.disabled = true;
    backBtn.classList.add("back-btn-disabled");
    backBtn.title = "Sudah di root directory";
  } else {
    backBtn.disabled = false;
    backBtn.classList.remove("back-btn-disabled");
    backBtn.title = "Naik satu folder";
  }
}

// Tombol BACK
backBtn.onclick = () => {
  if (!currentPath || backBtn.disabled) return;
  
  backBtn.classList.add("loading");
  const parts = currentPath.split("/").filter(Boolean);
  parts.pop();
  loadList(parts.join("/"));
  
  setTimeout(() => {
    backBtn.classList.remove("loading");
  }, 500);
};

// Helper functions for buttons
function openFile(path) {
  window.open(`/${path}`, '_blank');
}

function downloadFile(path) {
  window.location.href = `/api/download?path=${encodeURIComponent(path)}`;
}

function copyFileLink(path) {
  const link = window.location.origin + '/' + path;
  navigator.clipboard.writeText(link).then(() => {
    alert(`✅ Link berhasil disalin:\n${link}`);
  });
}

// Context menu
function showContextMenu(e, item) {
  e.preventDefault();
  
  // Remove existing context menu
  const existing = document.getElementById('context-menu');
  if (existing) existing.remove();
  
  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.style.cssText = `
    position: fixed;
    top: ${e.pageY}px;
    left: ${e.pageX}px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 0;
    min-width: 200px;
    box-shadow: var(--shadow-hard);
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
  `;
  
  const path = currentPath ? `${currentPath}/${item.name}` : item.name;
  
  const menuItems = [
    {
      text: `📂 ${item.type === 'folder' ? 'Buka Folder' : 'Buka File'}`,
      onClick: () => {
        if (item.type === 'folder') {
          loadList(path);
        } else {
          openFile(path);
        }
      }
    },
    {
      text: '🔗 Buka di Tab Baru',
      onClick: () => openFile(path)
    },
    {
      text: '⬇️ Download',
      onClick: () => downloadFile(path)
    },
    { separator: true },
    {
      text: '📋 Copy Path',
      onClick: () => {
        navigator.clipboard.writeText(path).then(() => {
          alert(`✅ Path berhasil disalin:\n${path}`);
        });
      }
    },
    {
      text: '🔗 Copy URL',
      onClick: () => copyFileLink(path)
    },
    { separator: true },
    {
      text: '📊 Info',
      onClick: () => {
        alert(`📄 ${item.name}\n📁 Type: ${item.type}\n📦 Size: ${formatSize(item.size || 0)}\n📅 Modified: ${new Date(item.mtime).toLocaleString()}\n🔤 MIME: ${item.mime || 'unknown'}`);
      }
    }
  ];
  
  menuItems.forEach(item => {
    if (item.separator) {
      const sep = document.createElement('hr');
      sep.style.cssText = `
        border: none;
        border-top: 1px solid var(--border);
        margin: 8px 0;
      `;
      menu.appendChild(sep);
    } else {
      const btn = document.createElement('button');
      btn.style.cssText = `
        display: block;
        width: 100%;
        text-align: left;
        padding: 8px 16px;
        background: none;
        border: none;
        color: var(--text);
        cursor: pointer;
        font-family: inherit;
        font-size: 14px;
        transition: background 0.2s;
      `;
      btn.textContent = item.text;
      btn.onmouseenter = () => btn.style.background = 'var(--bg-hover)';
      btn.onmouseleave = () => btn.style.background = 'none';
      btn.onclick = () => {
        item.onClick();
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
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 100);
}

// Search functionality
function initSearch() {
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '🔍 Search files...';
  searchInput.style.cssText = `
    margin-left: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 12px;
    color: var(--text);
    font-size: 14px;
    width: 200px;
    transition: all 0.3s;
  `;
  
  searchInput.onfocus = () => {
    searchInput.style.width = '300px';
    searchInput.style.background = 'var(--bg-elevated)';
  };
  
  searchInput.onblur = () => {
    searchInput.style.width = '200px';
    searchInput.style.background = 'var(--bg)';
  };
  
  // Add search input to topbar
  const topbar = document.querySelector('.topbar');
  topbar.style.position = 'relative';
  topbar.appendChild(searchInput);
  
  // Simple search implementation
  searchInput.addEventListener('input', debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (!searchTerm) {
      loadList(currentPath);
      return;
    }
    
    // In a real implementation, you would want to search through all files
    // This is a simple client-side filter
    const items = document.querySelectorAll('.item-row');
    items.forEach(item => {
      const name = item.querySelector('.item-name').textContent.toLowerCase();
      item.style.display = name.includes(searchTerm) ? '' : 'none';
    });
  }, 300));
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  loadList("");
  
  // Initialize search after a delay
  setTimeout(initSearch, 1000);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      backBtn.click();
    }
    if (e.key === 'Escape') {
      const menu = document.getElementById('context-menu');
      if (menu) menu.remove();
    }
  });
  
  // Add loading indicator to back button
  backBtn.innerHTML = '←';
});

// Export functions for global use
window.openFile = openFile;
window.downloadFile = downloadFile;
window.copyFileLink = copyFileLink;

/*
        ••JANGAN HAPUS INI••
SCRIPT BY © VYNAA VALERIE 
•• recode kasih credits 
•• contacts: (6282389924037)
•• instagram: @vynaa_valerie 
•• (github.com/VynaaValerie) 
*/