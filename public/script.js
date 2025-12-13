[file name]: script.js
[file content begin]
"use strict";

let currentPath = "";

const $ = (sel) => document.querySelector(sel);

function formatBytes(bytes) {
  if (bytes == null) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = Number(bytes);
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function formatDate(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleString();
}

function joinPath(base, name) {
  if (!base) return name;
  return `${base}/${name}`;
}

function setBreadcrumb(pathStr) {
  const el = $("#breadcrumb");
  if (!el) return;

  const parts = pathStr ? pathStr.split("/") : [];
  const frag = document.createDocumentFragment();

  const root = document.createElement("span");
  root.className = "crumb-clickable";
  root.textContent = "root";
  root.onclick = (e) => {
    e.preventDefault();
    loadList("");
  };
  frag.appendChild(root);

  let accum = "";
  for (const p of parts) {
    if (!p) continue;
    accum = accum ? `${accum}/${p}` : p;

    frag.appendChild(document.createTextNode(" / "));

    const a = document.createElement("span");
    a.className = "crumb-clickable";
    a.textContent = p;
    a.onclick = (e) => {
      e.preventDefault();
      loadList(accum);
    };
    frag.appendChild(a);
  }

  el.innerHTML = "";
  el.appendChild(frag);
}

function isTextLike(name) {
  const lower = String(name).toLowerCase();
  const textExtensions = [
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".json", ".txt", ".md", ".html", ".htm", ".css",
    ".scss", ".sass", ".xml", ".yml", ".yaml",
    ".env", ".gitignore", ".editorconfig",
    ".fnt", ".csv", ".log", ".sql", ".php", ".py",
    ".rb", ".java", ".c", ".cpp", ".h", ".hpp",
    ".go", ".rs", ".swift", ".kt", ".dart"
  ];
  
  return textExtensions.some(ext => lower.endsWith(ext));
}

function isImageLike(name) {
  const lower = String(name).toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || 
         lower.endsWith(".png") || lower.endsWith(".gif") ||
         lower.endsWith(".bmp") || lower.endsWith(".webp") ||
         lower.endsWith(".svg");
}

function isAudioLike(name) {
  const lower = String(name).toLowerCase();
  return lower.endsWith(".mp3") || lower.endsWith(".wav") || 
         lower.endsWith(".ogg") || lower.endsWith(".m4a");
}

function isVideoLike(name) {
  const lower = String(name).toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || 
         lower.endsWith(".mov") || lower.endsWith(".avi");
}

async function updatePreview(item, path) {
  const previewName = $("#preview-name");
  const previewContent = $("#preview-content");
  
  if (!item || item.type === "folder") {
    previewName.textContent = "";
    previewContent.innerHTML = "";
    return;
  }

  const fullPath = joinPath(path, item.name);
  previewName.textContent = fullPath;

  if (isTextLike(item.name)) {
    try {
      const res = await fetch(`/api/code?path=${encodeURIComponent(fullPath)}`);
      if (res.ok) {
        const text = await res.text();
        previewContent.textContent = text;
      } else {
        previewContent.textContent = `Error loading file: ${res.status}`;
      }
    } catch (e) {
      previewContent.textContent = `Error: ${e.message}`;
    }
  } else if (isImageLike(item.name)) {
    previewContent.innerHTML = `<img src="/api/raw?path=${encodeURIComponent(fullPath)}" alt="${item.name}" style="max-width: 100%; border-radius: 8px;">`;
  } else if (isAudioLike(item.name)) {
    previewContent.innerHTML = `<audio controls style="width: 100%; margin-top: 10px;"><source src="/api/raw?path=${encodeURIComponent(fullPath)}" type="audio/mpeg"></audio>`;
  } else if (isVideoLike(item.name)) {
    previewContent.innerHTML = `<video controls style="width: 100%; border-radius: 8px;"><source src="/api/raw?path=${encodeURIComponent(fullPath)}" type="video/mp4"></video>`;
  } else {
    previewContent.textContent = `[Binary file - ${formatBytes(item.size)}]\nClick "View" or "Raw" to download.`;
  }
}

async function loadList(p) {
  currentPath = p || "";
  setBreadcrumb(currentPath);

  const list = $("#list");
  if (!list) return;

  list.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    const res = await fetch(`/api/list?path=${encodeURIComponent(currentPath)}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed");

    list.innerHTML = "";

    if (data.items.length === 0) {
      list.innerHTML = '<div class="empty-state">Folder kosong</div>';
      return;
    }

    for (const it of data.items) {
      const row = document.createElement("div");
      row.className = "item-row";

      const icon = document.createElement("div");
      icon.className = it.type === "folder" ? "icon icon-folder" : "icon icon-file";

      const main = document.createElement("div");
      main.className = "item-main";

      const name = document.createElement("div");
      name.className = "item-name";
      name.textContent = it.name;

      const meta = document.createElement("div");
      meta.className = "item-meta";
      meta.textContent = it.type === "folder" ? "Folder" : formatBytes(it.size);

      main.appendChild(name);
      main.appendChild(meta);

      const right = document.createElement("div");
      right.className = "item-right";
      right.textContent = formatDate(it.mtime);

      row.appendChild(icon);
      row.appendChild(main);
      row.appendChild(right);

      if (it.type === "folder") {
        row.onclick = () => loadList(joinPath(currentPath, it.name));
      } else {
        row.onclick = () => {
          updatePreview(it, currentPath);
          
          // Untuk file text, buka di tab baru ketika double click
          if (isTextLike(it.name)) {
            const openUrl = `/api/code?path=${encodeURIComponent(joinPath(currentPath, it.name))}`;
            window.open(openUrl, "_blank", "noopener");
          }
        };
        
        // Tambah context menu untuk opsi lainnya
        row.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          // Bisa ditambahkan menu konteks di sini nanti
        });
      }

      list.appendChild(row);
    }
    
    // Reset preview ketika pindah folder
    updatePreview(null, currentPath);
  } catch (e) {
    list.innerHTML = `<div class="empty-state">Error: ${e.message}</div>`;
  }
}

// Update tombol back
function updateBackButton() {
  const btnBack = $("#btn-back");
  if (!btnBack) return;
  
  if (!currentPath) {
    btnBack.className = "back-btn back-btn-disabled";
    btnBack.onclick = null;
  } else {
    btnBack.className = "back-btn";
    btnBack.onclick = () => {
      const parts = currentPath.split("/").filter(Boolean);
      parts.pop();
      loadList(parts.join("/"));
    };
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadList("");
  
  // Update back button setiap kali path berubah
  const observer = new MutationObserver(updateBackButton);
  const breadcrumb = $("#breadcrumb");
  if (breadcrumb) {
    observer.observe(breadcrumb, { childList: true, subtree: true });
  }
});
[file content end]