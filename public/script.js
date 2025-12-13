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
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return size.toFixed(1) + " " + units[i];
}

// Format tanggal
function formatDate(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

// Load list folder
async function loadList(path) {
  listEl.innerHTML = '<div class="loading">Memuat...</div>'; // Tampilkan loading
  const url = "/api/list" + (path ? `?path=${encodeURIComponent(path)}` : "");
  try {
    const res = await fetch(url);
    if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Gagal memuat daftar folder.' }));
        currentPath = path; // Tetap simpan path terakhir yang diminta
        renderBreadcrumb(currentPath);
        updateBack();
        listEl.innerHTML = `<div class="error">Error: ${res.status} - ${errData.error || res.statusText}</div>`;
        return;
    }
    const data = await res.json();
    currentPath = data.path || "";
    renderBreadcrumb(currentPath);
    renderList(data.items || []);
    updateBack();
  } catch (error) {
    console.error("Fetch error:", error);
    listEl.innerHTML = `<div class="error">Gagal mengambil data dari server. (${error.message})</div>`;
  }
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
    // Pastikan tidak ada double-slash saat membangun walk
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

/**
 * Mendapatkan ekstensi file dengan aman.
 * @param {string} filename 
 * @returns {string} Ekstensi dalam huruf kecil (atau string kosong jika tidak ada).
 */
function getFileExtension(filename) {
    const parts = filename.split('.');
    if (parts.length > 1) {
        return parts.pop().toLowerCase();
    }
    return '';
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

  const textLikeExtensions = new Set(["json", "js", "txt", "md", "fnt", "html", "css", "yaml", "yml", "ts", "jsx", "tsx"]);

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
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        const ext = getFileExtension(it.name);

        if (textLikeExtensions.has(ext)) {
          // File teks/kode: buka via /api/raw
          window.location.href = `/api/raw?path=${encodeURIComponent(p)}`;
        } else {
          // File biner/lainnya: buka langsung
          // Note: Jika file berada di folder statis seperti /image, /audio, atau /font
          // ini akan diakses langsung. Jika tidak, browser akan meminta file dari root
          // yang mungkin tidak dapat diakses kecuali melalui route statis yang sudah ada.
          window.location.href = "/" + encodeURIComponent(p).replace(/%2F/g, '/');
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