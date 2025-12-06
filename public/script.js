const listEl = document.getElementById("list");
const breadcrumbEl = document.getElementById("breadcrumb");
const backBtn = document.getElementById("btn-back");

let currentPath = "";
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

// Format size file
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  const KB = bytes / 1024;
  if (KB < 1024) return KB.toFixed(1) + " KB";
  const MB = KB / 1024;
  if (MB < 1024) return MB.toFixed(1) + " MB";
  const GB = MB / 1024;
  return GB.toFixed(1) + " GB";
}

// Format tanggal
function formatDate(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

// Load list folder
async function loadList(path) {
  const url = "/api/list" + (path ? `?path=${encodeURIComponent(path)}` : "");
  const res = await fetch(url);
  const data = await res.json();

  currentPath = data.path || "";
  renderBreadcrumb(currentPath);
  renderList(data.items || []);
  updateBack();
}

// Render folder breadcrumb
function renderBreadcrumb(path) {
  breadcrumbEl.innerHTML = "";

  const root = document.createElement("span");
  root.className = "crumb-clickable";
  root.textContent = "Root";
  root.onclick = () => loadList("");
  breadcrumbEl.appendChild(root);

  if (!path) return;

  const parts = path.split("/").filter(Boolean);
  let walk = "";

  parts.forEach((p, idx) => {
    breadcrumbEl.appendChild(document.createTextNode(" / "));
    walk += (walk ? "/" : "") + p;

    const s = document.createElement("span");
    s.textContent = p;

    if (idx === parts.length - 1) {
      s.className = "crumb-current";
    } else {
      s.className = "crumb-clickable";
      s.onclick = () => loadList(walk);
    }
    breadcrumbEl.appendChild(s);
  });
}

// Render daftar file/folder
function renderList(items) {
  listEl.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Folder kosong.";
    listEl.appendChild(empty);
    return;
  }

  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "item-row";

    const icon = document.createElement("div");
    icon.className = "item-icon";
    icon.textContent = it.type === "folder" ? "📁" : "📄";

    const main = document.createElement("div");
    main.className = "item-main";

    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = it.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent =
      it.type === "folder" ? "folder" : formatSize(it.size || 0);

    main.appendChild(name);
    main.appendChild(meta);

    const right = document.createElement("div");
    right.className = "item-right";
    right.textContent = formatDate(it.mtime);

    row.appendChild(icon);
    row.appendChild(main);
    row.appendChild(right);

    row.onclick = () => {
      if (it.type === "folder") {
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        loadList(p);
      } else {
        // Jika file text-like (js, json, txt, md, fnt, html, css) → buka via /api/raw
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        const ext = it.name.split(".").pop().toLowerCase();
        const textLike = ["json", "js", "txt", "md", "fnt", "html", "css"];

        if (textLike.includes(ext)) {
          window.location.href = `/api/raw?path=${encodeURIComponent(p)}`;
        } else {
          // default: buka langsung (mp3, jpg, png, ttf, dll)
          window.location.href = "/" + p;
        }
      }
    };

    listEl.appendChild(row);
  });
}

// Update tombol back
function updateBack() {
  if (!currentPath) {
    backBtn.disabled = true;
    backBtn.classList.add("disabled");
  } else {
    backBtn.disabled = false;
    backBtn.classList.remove("disabled");
  }
}

// Tombol BACK
backBtn.onclick = () => {
  if (!currentPath) return;
  const parts = currentPath.split("/").filter(Boolean);
  parts.pop();
  loadList(parts.join("/"));
};

// Start
document.addEventListener("DOMContentLoaded", () => loadList(""));
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
