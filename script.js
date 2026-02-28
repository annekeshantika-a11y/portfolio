// ---------- Helpers ----------
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// ---------- Year ----------
$("#year").textContent = new Date().getFullYear();

// ---------- Theme toggle ----------
const root = document.documentElement;
const storedTheme = localStorage.getItem("theme");
if (storedTheme) root.setAttribute("data-theme", storedTheme);

const themeToggle = $("#themeToggle");
const updateThemeIcon = () => {
  const isLight = root.getAttribute("data-theme") === "light";
  $(".icon", themeToggle).textContent = isLight ? "☀" : "☾";
};
updateThemeIcon();

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme");
  const next = current === "light" ? "" : "light";
  if (next) root.setAttribute("data-theme", next);
  else root.removeAttribute("data-theme");
  localStorage.setItem("theme", next || "");
  updateThemeIcon();
});

// ---------- Scroll progress + navbar shrink ----------
const progress = $("#scrollProgress");
const topbar = $("#topbar");

const onScroll = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docH = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
  progress.style.width = `${clamp(pct, 0, 100)}%`;

  if (scrollTop > 20) topbar.classList.add("shrink");
  else topbar.classList.remove("shrink");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Reveal on scroll ----------
const revealEls = $$(".reveal");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("show");
  });
}, { threshold: 0.15 });

revealEls.forEach(el => io.observe(el));

// ---------- Active nav link ----------
const sections = $$("main section[id]");
const navLinks = $$("#nav a").filter(a => a.getAttribute("href")?.startsWith("#"));

const sectionIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = e.target.getAttribute("id");
    navLinks.forEach(a => {
      const href = a.getAttribute("href").slice(1);
      a.classList.toggle("active", href === id);
    });
  });
}, { threshold: 0.35 });

sections.forEach(s => sectionIO.observe(s));

// ---------- Mobile drawer ----------
const drawer = $("#drawer");
const burger = $("#burger");
const drawerClose = $("#drawerClose");

const openDrawer = () => {
  drawer.classList.add("show");
  drawer.setAttribute("aria-hidden", "false");
};
const closeDrawer = () => {
  drawer.classList.remove("show");
  drawer.setAttribute("aria-hidden", "true");
};
burger.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawer.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});
$$(".drawer-link", drawer).forEach(a => a.addEventListener("click", closeDrawer));

// ---------- Animated counters (stats) ----------
const counters = $$(".stat-num");
let countersDone = false;

const counterIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting || countersDone) return;
    countersDone = true;

    counters.forEach((el) => {
      const target = Number(el.dataset.count || "0");
      const duration = 900;
      const start = performance.now();

      const tick = (t) => {
        const p = clamp((t - start) / duration, 0, 1);
        const val = Math.round(target * (0.15 + 0.85 * p));
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = String(target);
      };
      requestAnimationFrame(tick);
    });
  });
}, { threshold: 0.4 });

counters.forEach(el => counterIO.observe(el));

// ---------- Projects filter ----------
const filters = $$(".filter");
const projectGrid = $("#projectGrid");
const projects = $$(".project", projectGrid);

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const f = btn.dataset.filter;
    projects.forEach(card => {
      const type = card.dataset.type;
      const show = (f === "all") || (type === f);
      card.style.display = show ? "" : "none";
    });
  });
});

// ---------- Modal (projects + certs) ----------
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalTags = $("#modalTags");
const modalDesc = $("#modalDesc");
const modalImg = $("#modalImg");
const modalLink = $("#modalLink");
const modalClose = $("#modalClose");
const modalBackdrop = $("#modalBackdrop");

const openModal = ({ title, tags, desc, img, link }) => {
  modalTitle.textContent = title || "Preview";
  modalTags.textContent = tags ? `Tags: ${tags}` : "";
  modalDesc.textContent = desc || "";
  modalImg.style.backgroundImage = img ? `url('${img}')` : "none";

  if (link && link !== "#") {
    modalLink.style.display = "inline-flex";
    modalLink.href = link;
  } else {
    modalLink.style.display = "none";
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

modalClose.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) closeModal();
});

// open from project cards
projects.forEach(card => {
  card.addEventListener("click", () => {
    openModal({
      title: card.dataset.title,
      tags: card.dataset.tags,
      desc: card.dataset.desc,
      img: card.dataset.img,
      link: card.dataset.link
    });
  });
});

// open from certificates
const certGrid = $("#certGrid");
$$(".cert", certGrid).forEach(btn => {
  btn.addEventListener("click", () => {
    openModal({
      title: btn.dataset.title,
      tags: "Certificate / Training",
      desc: btn.dataset.desc,
      img: btn.dataset.img,
      link: "" // optional
    });
  });
});

// ---------- Contact form: generate email + copy ----------
const form = $("#contactForm");
const hint = $("#formHint");
const copyBtn = $("#copyBtn");

let generated = "";

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const subject = String(data.get("subject") || "").trim();
  const message = String(data.get("message") || "").trim();

  generated =
`To: anneke.shantika@mhs.unsoed.ac.id
Subject: ${subject}

Halo Anneke, saya ${name}.

${message}

Terima kasih.`;

  hint.textContent = "Email template dibuat. Klik Copy untuk menyalin.";
  hint.classList.remove("error");
});

copyBtn.addEventListener("click", async () => {
  if (!generated) {
    hint.textContent = "Belum ada email yang dibuat. Klik Generate Email dulu.";
    hint.classList.add("error");
    return;
  }
  try {
    await navigator.clipboard.writeText(generated);
    hint.textContent = "Copied ✅ Tinggal paste ke email/DM.";
    hint.classList.remove("error");
  } catch {
    hint.textContent = "Gagal copy. Coba manual: blok teks lalu copy.";
    hint.classList.add("error");
  }
});

// ---------- Back to top ----------
const toTop = $("#toTop");
toTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});