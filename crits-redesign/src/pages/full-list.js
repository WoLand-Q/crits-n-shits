
const $ = (sel, root = document) => root.querySelector(sel);

const BASE = (() => {
    const b = import.meta.env.BASE_URL || "/";
    return b.endsWith("/") ? b : `${b}/`;
})();

const assetUrl = (p) => `${BASE}${String(p).replace(/^\//, "")}`;

export async function initFullList({ type }) {
    const list = $("#list");
    const hint = $("#hint");
    const q = $("#q");
    const sort = $("#sort");

    if (!list || !hint || !q || !sort) return;

    const map = {
        boardgames: assetUrl("data/boardgames.json"),
        rpg: assetUrl("data/rpg.json"),
        wargames: assetUrl("data/wargames.json")
    };

    const url = map[type];
    const raw = await safeJson(url);
    const items = normalizeList(raw);

    if (!items.length) {
        hint.innerHTML = `
      <div class="empty">
        <div class="empty__title">Файл з бібліотекою не знайдено або він порожній.</div>
        <div class="empty__text">Додай <code>public/data/${type}.json</code> і перезавантаж сторінку.</div>
      </div>
    `;
        return;
    }

    let state = {
        query: "",
        sort: sort.value
    };

    const render = () => {
        const filtered = applyQuery(items, state.query);
        const sorted = applySort(filtered, state.sort);
        list.innerHTML = sorted.map(card).join("");
        hint.textContent = `Знайдено: ${sorted.length}`;
    };

    const debounce = (fn, ms = 160) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    };

    q.addEventListener("input", debounce(() => {
        state.query = q.value.trim();
        render();
    }));

    sort.addEventListener("change", () => {
        state.sort = sort.value;
        render();
    });

    render();
}

function card(x) {
    const title = pick(x, ["title", "name"]) || "Без назви";
    const desc = pick(x, ["description", "desc", "system", "setting"]) || "";
    const imgRaw = pick(x, ["image", "img", "cover", "poster", "photo"]);
    const img = imgRaw ? absolutizeMaybe(imgRaw) : null;

    const tags = toArr(pick(x, ["tags", "genres"])).slice(0, 6);

    const players = formatRange(pick(x, ["players", "playersCount", "people"]));
    const time = formatRange(pick(x, ["time", "duration", "playtime"]), "хв");

    return `
    <article class="fullCard" ${img ? `style="background-image:url('${escapeAttr(img)}')"` : ""}>
      <div class="fullCard__overlay"></div>
      <div class="fullCard__body">
        <div class="fullCard__title">${escapeHtml(title)}</div>
        <div class="fullCard__desc">${escapeHtml(desc || "—")}</div>
        <div class="fullCard__meta">
          ${players ? `<span class="pillMini">Гравці: ${escapeHtml(players)}</span>` : ""}
          ${time ? `<span class="pillMini">Час: ${escapeHtml(time)}</span>` : ""}
          ${tags.map(t => `<span class="pillMini">#${escapeHtml(t)}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

/* ===== query/sort ===== */
function applyQuery(items, q) {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter((x) => {
        const hay = [
            pick(x, ["title", "name"]),
            pick(x, ["description", "desc", "system", "setting"]),
            toArr(pick(x, ["tags", "genres"])).join(" ")
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(s);
    });
}

function applySort(items, mode) {
    const a = [...items];
    const byTitle = (dir) => a.sort((x, y) => {
        const tx = (pick(x, ["title", "name"]) || "").toLowerCase();
        const ty = (pick(y, ["title", "name"]) || "").toLowerCase();
        return dir * tx.localeCompare(ty, "uk");
    });

    const byRange = (fieldKeys, which, dir) => a.sort((x, y) => {
        const rx = parseRangeMaybe(pick(x, fieldKeys));
        const ry = parseRangeMaybe(pick(y, fieldKeys));
        const vx = rx ? rx[which] : Number.POSITIVE_INFINITY;
        const vy = ry ? ry[which] : Number.POSITIVE_INFINITY;
        return dir * (vx - vy);
    });

    switch (mode) {
        case "title-desc": return byTitle(-1);
        case "players-asc": return byRange(["players", "playersCount", "people"], "min", +1);
        case "players-desc": return byRange(["players", "playersCount", "people"], "max", -1);
        case "time-asc": return byRange(["time", "duration", "playtime"], "min", +1);
        case "time-desc": return byRange(["time", "duration", "playtime"], "max", -1);
        case "title-asc":
        default:
            return byTitle(+1);
    }
}

/* ===== helpers ===== */
async function safeJson(url) {
    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        return await res.json();
    } catch {
        return null;
    }
}

function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function pick(obj, keys) {
    for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return null;
}

function toArr(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (typeof x === "string") return x.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
}

function parseRangeMaybe(v) {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return { min: v, max: v };
    if (typeof v === "object") {
        const min = Number(v.min);
        const max = Number(v.max);
        if (Number.isFinite(min) && Number.isFinite(max)) return { min, max };
        if (Number.isFinite(min) && !Number.isFinite(max)) return { min, max: min };
        if (!Number.isFinite(min) && Number.isFinite(max)) return { min: max, max };
        return null;
    }
    const s = String(v).trim();
    const m = s.match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (m) return { min: Number(m[1]), max: Number(m[2]) };
    const one = s.match(/^\d+$/);
    if (one) {
        const n = Number(one[0]);
        return { min: n, max: n };
    }
    return null;
}

function formatRange(v, suffix = "") {
    const r = parseRangeMaybe(v);
    if (!r) return v ? String(v) : "";
    if (r.min === r.max) return suffix ? `${r.min} ${suffix}` : `${r.min}`;
    return suffix ? `${r.min}–${r.max} ${suffix}` : `${r.min}–${r.max}`;
}

function absolutizeMaybe(path) {
    const p = String(path);
    if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) return p;
    return assetUrl(p);
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, "&#96;"); }