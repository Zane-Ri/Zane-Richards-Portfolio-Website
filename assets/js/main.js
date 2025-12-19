// Minimal, dependency-free portfolio logic (projects JSON -> grid + modal)

const $ = (sel) => document.querySelector(sel);

const state = {
  projects: [],
  filtered: [],
  active: null
};

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

function uniqueTags(projects) {
  const s = new Set();
  projects.forEach(p => (p.tags || []).forEach(t => s.add(t)));
  return Array.from(s).sort((a,b) => a.localeCompare(b));
}

function renderTagOptions() {
  const select = $("#tagFilter");
  const tags = uniqueTags(state.projects);
  tags.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function projectCard(p) {
  const el = document.createElement("article");
  el.className = "card project";
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `Open project ${p.title}`);
  el.addEventListener("click", () => openModal(p.id));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(p.id);
    }
  });

  const badge = p.tag ? `<span class="badge">${escapeHtml(p.tag)}</span>` : "";
  const thumb = p.coverImage ? `<img class="project-thumb" src="${escapeHtml(p.coverImage)}" alt="" />` : "";

  el.innerHTML = `
    <div class="project-top">
      <div>
        <h3>${escapeHtml(p.title)}</h3>
        <div class="muted" style="margin-top:6px">${escapeHtml(p.subtitle || "")}</div>
      </div>
      ${badge}
    </div>
    <p>${escapeHtml(p.summary || "")}</p>
    ${thumb}
    <div class="pill-row">
      ${(p.tags || []).slice(0, 4).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("")}
    </div>
  `;
  return el;
}

function renderGrid(projects) {
  const grid = $("#projectsGrid");
  grid.innerHTML = "";
  projects.forEach(p => grid.appendChild(projectCard(p)));
}

function applyFilters() {
  const q = ($("#searchInput").value || "").toLowerCase().trim();
  const tag = $("#tagFilter").value;

  state.filtered = state.projects.filter(p => {
    const blob = [
      p.title, p.subtitle, p.summary, p.description, (p.tags || []).join(" "), (p.tech || []).join(" ")
    ].join(" ").toLowerCase();

    const matchQ = q === "" || blob.includes(q);
    const matchTag = tag === "" || (p.tags || []).includes(tag) || p.tag === tag;
    return matchQ && matchTag;
  });

  renderGrid(state.filtered);
}

function setModalHidden(hidden) {
  $("#modalBackdrop").hidden = hidden;
  $("#projectModal").hidden = hidden;
  document.body.style.overflow = hidden ? "" : "hidden";
}

function openModal(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  state.active = id;

  $("#modalTitle").textContent = p.title || "";
  $("#modalSubtitle").textContent = p.subtitle || "";

  const tags = $("#modalTags");
  tags.innerHTML = "";
  (p.tags || []).forEach(t => {
    const s = document.createElement("span");
    s.className = "pill";
    s.textContent = t;
    tags.appendChild(s);
  });

  $("#modalDescription").textContent = p.description || "";

  const tech = $("#modalTech");
  tech.innerHTML = "";
  (p.tech || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    tech.appendChild(li);
  });

  const files = $("#modalFiles");
  files.innerHTML = "";
  (p.files || []).forEach(f => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = f.href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = f.label || "File";
    li.appendChild(a);
    files.appendChild(li);
  });

  const gallery = $("#modalGallery");
  gallery.innerHTML = "";
  const imgs = (p.images && p.images.length) ? p.images : (p.coverImage ? [p.coverImage] : []);
  imgs.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    gallery.appendChild(img);
  });

  const repoBtn = $("#modalRepo");
  if (p.repo) {
    repoBtn.hidden = false;
    repoBtn.href = p.repo;
  } else {
    repoBtn.hidden = true;
    repoBtn.href = "#";
  }

  setModalHidden(false);
  $("#modalClose").focus();
}

function closeModal() {
  setModalHidden(true);
  state.active = null;
}

function setupNav() {
  const toggle = $("#navToggle");
  const nav = document.querySelector(".nav");

  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
}

async function init() {
  $("#year").textContent = new Date().getFullYear();

  setupNav();

  const res = await fetch("assets/data/projects.json", { cache: "no-store" });
  state.projects = await res.json();
  state.filtered = state.projects;

  renderTagOptions();
  renderGrid(state.projects);

  $("#searchInput").addEventListener("input", applyFilters);
  $("#tagFilter").addEventListener("change", applyFilters);

  $("#modalBackdrop").addEventListener("click", closeModal);
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalDone").addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#projectModal").hidden) closeModal();
  });
}

init().catch(err => {
  console.error(err);
  $("#projectsGrid").innerHTML = `
    <div class="card" style="padding:16px">
      <strong>Couldn’t load projects.json</strong>
      <div class="muted" style="margin-top:8px">
        Check that <code>assets/data/projects.json</code> exists and is valid JSON.
      </div>
    </div>
  `;
});
