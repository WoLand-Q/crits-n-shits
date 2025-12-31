import { animate, stagger } from "@motionone/dom";

const $ = (sel, root = document) => root.querySelector(sel);

const BASE = (() => {
    const b = import.meta.env.BASE_URL || "/";
    return b.endsWith("/") ? b : `${b}/`;
})();

const assetUrl = (p) => `${BASE}${String(p).replace(/^\//, "")}`;

const escapeHtml = (s) => String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toArr = (v) => (Array.isArray(v) ? v : (v ? [v] : []));

const absolutizeMaybe = (url) => {
    if (!url) return null;
    const s = String(url).trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    return assetUrl(s);
};

const safeJson = async (path) => {
    const url = `${path}?v=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    return await r.json();
};

export async function initGalleryFull() {
    const grid = $("#galleryGrid");
    const hint = $("#hint");
    const q = $("#q");
    const sort = $("#sort");
    if (!grid || !hint || !q || !sort) return;

    const data = toArr(await safeJson(assetUrl("data/gallery.json")))
        .map((x, i) => {
            const alt = x?.alt ?? x?.title ?? "";
            const image = absolutizeMaybe(x?.image ?? x?.img ?? x?.photo);
            return image ? { image, alt: String(alt ?? "") } : null;
        })
        .filter(Boolean);

    const state = { q: "", sort: "alt-asc" };

    let viewItems = [];
    const lb = $("#lb");
    const lbImg = $("#lbImg");
    const lbCap = $("#lbCap");

    const openLb = (item) => {
        if (!lb || !lbImg) return;
        lbImg.src = item.image;
        lbImg.alt = item.alt || "Фото";
        if (lbCap) lbCap.textContent = item.alt || "";
        lb.classList.add("is-open");
        lb.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("is-modal");
        document.body.style.overflow = "hidden";
        const closeBtn = lb.querySelector('[data-lb-close]');
        if (closeBtn) closeBtn.focus({ preventScroll: true });
    };

    const closeLb = () => {
        if (!lb) return;
        lb.classList.remove("is-open");
        lb.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("is-modal");
        document.body.style.overflow = "";
        if (lbImg) lbImg.src = "";
    };

    if (lb) {
        lb.addEventListener("click", (e) => {
            if (e.target.closest("[data-lb-close]")) closeLb();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && lb.classList.contains("is-open")) closeLb();
        });

        grid.addEventListener("click", (e) => {
            const a = e.target.closest(".galleryCard__link");
            if (!a) return;
            const idx = Number(a.dataset.idx);
            const item = viewItems[idx];
            if (!item) return;
            e.preventDefault();
            openLb(item);
        });
    }

const apply = () => {
        state.q = String(q.value ?? "").trim().toLowerCase();
        state.sort = String(sort.value ?? "alt-asc");
        render();
    };

    q.addEventListener("input", apply);
    sort.addEventListener("change", apply);

    render();

    function render() {
        const s = state.q;
        let items = data;

        if (s) {
            items = items.filter((x) => {
                const t = `${x.alt}`.toLowerCase();
                return t.includes(s);
            });
        }

        if (state.sort === "alt-asc") items = [...items].sort((a, b) => a.alt.localeCompare(b.alt));
        if (state.sort === "alt-desc") items = [...items].sort((a, b) => b.alt.localeCompare(a.alt));

        viewItems = items;

        grid.innerHTML = "";
        hint.textContent = "";

        if (!items.length) {
            hint.innerHTML = `<div class="empty"><div class="empty__title">Нічого не знайдено.</div><div class="empty__text">Спробуй інший запит.</div></div>`;
            return;
        }

        grid.innerHTML = items
            .map((x, i) => {
                const img = escapeHtml(x.image);
                const alt = escapeHtml(x.alt || "Фото");
                return `
<figure class="galleryCard">
  <a class="galleryCard__link" href="${img}" data-idx="${i}">
    <img class="galleryCard__img" src="${img}" alt="${alt}" loading="lazy" />
    <figcaption class="galleryCard__cap">${alt}</figcaption>
  </a>
</figure>`;
            })
            .join("\n");

        animate(
            grid.children,
            { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
            { duration: 0.25, delay: stagger(0.02), easing: "ease-out" }
        );
    }
}