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

  const root = document.createElement("a");
  root.href = "#";
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

    const a = document.createElement("a");
    a.href = "#";
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
  return (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    lower.endsWith(".js") ||
    lower.endsWith(".mjs") ||
    lower.endsWith(".cjs") ||
    lower.endsWith(".ts") ||
    lower.endsWith(".tsx") ||
    lower.endsWith(".jsx") ||
    lower.endsWith(".html") ||
    lower.endsWith(".css") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".csv") ||
    lower.endsWith(".log") ||
    lower.endsWith(".yml") ||
    lower.endsWith(".yaml") ||
    lower === ".env" ||
    lower.endsWith("/.env")
  );
}

async function loadList(p) {
  currentPath = p || "";
  setBreadcrumb(currentPath);

  const tbody = $("#tbody");
  const status = $("#status");
  if (status) status.textContent = "Loading...";

  try {
    const res = await fetch(`/api/list?path=${encodeURIComponent(currentPath)}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Failed");

    if (tbody) tbody.innerHTML = "";

    for (const it of data.items) {
      const tr = document.createElement("tr");
      tr.className = "row";

      const icon = document.createElement("td");
      icon.textContent = it.type === "folder" ? "📁" : "📄";

      const name = document.createElement("td");
      name.textContent = it.name;

      const size = document.createElement("td");
      size.textContent = it.type === "file" ? formatBytes(it.size) : "";

      const mtime = document.createElement("td");
      mtime.textContent = formatDate(it.mtime);

      const actions = document.createElement("td");

      const fullPath = joinPath(currentPath, it.name);

      if (it.type === "file") {
        // GitHub-like:
        // - text => /api/code
        // - binary => /api/view
        const openUrl = isTextLike(it.name)
          ? `/api/code?path=${encodeURIComponent(fullPath)}`
          : `/api/view?path=${encodeURIComponent(fullPath)}`;

        const rawUrl = isTextLike(it.name)
          ? `/api/raw?path=${encodeURIComponent(fullPath)}`
          : openUrl;

        const viewBtn = document.createElement("a");
        viewBtn.href = openUrl;
        viewBtn.textContent = isTextLike(it.name) ? "Code" : "View";
        viewBtn.target = "_blank";
        viewBtn.rel = "noopener";

        actions.appendChild(viewBtn);

        if (isTextLike(it.name)) {
          const rawBtn = document.createElement("a");
          rawBtn.href = rawUrl;
          rawBtn.textContent = "Raw";
          rawBtn.target = "_blank";
          rawBtn.rel = "noopener";
          rawBtn.style.marginLeft = "10px";
          actions.appendChild(rawBtn);
        }

        tr.onclick = () => {
          window.open(openUrl, "_blank", "noopener");
        };
      } else {
        tr.onclick = () => loadList(fullPath);
      }

      tr.appendChild(icon);
      tr.appendChild(name);
      tr.appendChild(size);
      tr.appendChild(mtime);
      tr.appendChild(actions);

      tbody.appendChild(tr);
    }

    if (status) status.textContent = `${data.items.length} item(s)`;
  } catch (e) {
    if (status) status.textContent = `Error: ${e.message}`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const upBtn = $("#upBtn");
  if (upBtn) {
    upBtn.onclick = () => {
      if (!currentPath) return loadList("");
      const parts = currentPath.split("/").filter(Boolean);
      parts.pop();
      loadList(parts.join("/"));
    };
  }

  loadList("");
});