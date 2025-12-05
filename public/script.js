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
// Format tanggal
function formatDate(t) {
  if (!t) return "";
  const d = new Date(t);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

function updateBack() {
  if (!currentPath) backBtn.classList.add("back-btn-disabled");
  else backBtn.classList.remove("back-btn-disabled");
}

// Load satu folder
async function loadList(path = "") {
  const data = await fetchJSON(`/api/list?path=${encodeURIComponent(path)}`);
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

// Render isi folder
function renderList(items) {
  listEl.innerHTML = "";

  if (!items.length) {
    listEl.innerHTML = `<div class="empty-state">Folder kosong</div>`;
    return;
  }

  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "item-row";

    const icon = document.createElement("div");
    icon.className = `icon ${
      it.type === "folder" ? "icon-folder" : "icon-file"
    }`;

    const main = document.createElement("div");
    main.className = "item-main";

    const name = document.createElement("div");
    name.className = "item-name";
    name.textContent = it.name;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.textContent = it.type === "folder" ? "folder" : it.size + " byte";

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
        // OPEN FILE LANGSUNG (TANPA /api/raw)
        const p = currentPath ? `${currentPath}/${it.name}` : it.name;
        // contoh hasil:
        // p = "game/tebakkata.json"  -> /game/tebakkata.json
        // p = "audio/pinaa.mp3"      -> /audio/pinaa.mp3
        window.location.href = "/" + p;
      }
    };

    listEl.appendChild(row);
  });
}
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
// Tombol BACK
backBtn.onclick = () => {
  if (!currentPath) return;
  const parts = currentPath.split("/").filter(Boolean);
  parts.pop();
  loadList(parts.join("/"));
};

// Start
document.addEventListener("DOMContentLoaded", () => loadList(""));