
import "./style.css";
import { animate, stagger, inView } from "@motionone/dom";

import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

const $ = (sel, root = document) => root.querySelector(sel);

const getCalendarLayout = () => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    if (isMobile) {
        return {
            initialView: "listWeek",
            headerToolbar: {
                left: "prev,next",
                center: "title",
                right: "",
            },
        };
    }

    return {
        initialView: "dayGridMonth",
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,listWeek",
        },
    };
};


const BASE = (() => {
    const b = import.meta.env.BASE_URL || "/";
    return b.endsWith("/") ? b : `${b}/`;
})();

const assetUrl = (p) => `${BASE}${String(p).replace(/^\//, "")}`;
const spriteHref = (id) => `${assetUrl("icons.svg")}#${id}`;

const safeRun = (name, fn) => {
    try {
        const r = fn();
        if (r && typeof r.then === "function") r.catch((e) => console.error(`[${name}]`, e));
    } catch (e) {
        console.error(`[${name}]`, e);
    }
};

safeRun("nav", initNav);
safeRun("scrollSpy", initScrollSpy);
safeRun("scrollProgress", initScrollProgress);
safeRun("toTop", initToTop);
safeRun("animations", initAnimations);
safeRun("calendar", initCalendar);
safeRun("games", initGames);
safeRun("masters", initMasters);
safeRun("gallery", initGallery);
safeRun("rules", initRules);
safeRun("metrics", syncHeaderMetrics);

window.addEventListener("resize", syncHeaderMetrics, { passive: true });

function syncHeaderMetrics() {
    const header = $("#top");
    const root = document.documentElement;
    if (!header) return;
    const h = Math.round(header.getBoundingClientRect().height);
    root.style.setProperty("--topbar-h", `${h}px`);
}

/* ========== Nav ========== */
function initNav() {
    const btn = $("#navToggle");
    const nav = $("#nav");
    const header = $("#top");
    if (!btn || !nav || !header) return;

    const close = () => {
        nav.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
    };

    btn.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("nav-open", open);
        syncHeaderMetrics();
    });

    nav.addEventListener("click", (e) => {
        if (e.target?.tagName === "A") close();
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
    });

    document.addEventListener("click", (e) => {
        if (!nav.classList.contains("is-open")) return;
        const t = e.target;
        if (t === btn || btn.contains(t)) return;
        if (nav.contains(t)) return;
        close();
    });
}

/* Active link by section */
function initScrollSpy() {
  const nav = document.querySelector('#nav')
  if (!nav) return

  const links = Array.from(nav.querySelectorAll('a[href^="#"]'))
  const items = links
    .map((a) => {
      const el = document.querySelector(a.getAttribute('href'))
      return el ? { a, el } : null
    })
    .filter(Boolean)

  if (!items.length) return


  const ordered = [...items].sort((x, y) => x.el.offsetTop - y.el.offsetTop)

  const setActive = (current) => {
    for (const { a, el } of items) {
      const on = el === current
      a.classList.toggle('is-active', on)
      a.classList.toggle('active', on)
    }
  }

  const compute = () => {
    const headerH = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0
    const y = window.scrollY + headerH + 24


    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    if (atBottom) return setActive(ordered.at(-1).el)

    let current = ordered[0].el
    for (const it of ordered) {
      if (it.el.offsetTop <= y) current = it.el
      else break
    }
    setActive(current)
  }

  window.addEventListener('scroll', compute, { passive: true })
  window.addEventListener('resize', compute)
  window.addEventListener('load', compute)
  compute()
}

/* ========== Scroll progress ========== */
function initScrollProgress() {
    const bar = $("#scrollProgress");
    const wrap = bar?.parentElement;
    if (!bar || !wrap) return;

    let raf = 0;

    const paint = () => {
        raf = 0;
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;

        if (max <= 2) {
            wrap.style.opacity = "0";
            bar.style.width = "0%";
            return;
        }

        wrap.style.opacity = "1";
        const v = (h.scrollTop / max) * 100;
        bar.style.width = `${Math.max(0, Math.min(100, v))}%`;
    };

    const onScroll = () => {
        if (raf) return;
        raf = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
}

function initToTop() {
    const btn = document.getElementById("toTop");
    if (!btn) return;

    const update = () => {
        const on = window.scrollY > 600;
        btn.classList.toggle("is-off", !on);
    };

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    update();
}

/* ========== Animations ========== */
function initAnimations() {
    const heroCard = $("#heroCard");
    if (heroCard) {
        animate(
            heroCard,
            { transform: ["translateY(10px)", "translateY(0px)"], opacity: [0, 1] },
            { duration: 0.6, easing: "ease-out" }
        );
    }

    inView("[data-anim]", ({ target }) => {
        animate(
            target,
            { opacity: [0, 1], transform: ["translateY(10px)", "translateY(0px)"] },
            { duration: 0.45, easing: "ease-out" }
        );
    });

    const groups = [".hero__actions .btn", ".chips .chip", ".cards3 .card", ".tabs .tab"];
    groups.forEach((sel) => {
        const nodes = document.querySelectorAll(sel);
        if (!nodes.length) return;
        animate(
            nodes,
            { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
            { duration: 0.35, delay: stagger(0.04), easing: "ease-out" }
        );
    });
}

/* ========== Calendar ========== */
function initCalendar() {
  const calendarEl = document.getElementById('calendar')
  if (!calendarEl) return

  const apiKey = import.meta.env.VITE_GCAL_API_KEY
  const calendarId = import.meta.env.VITE_GCAL_ID

  const layout = getCalendarLayout()


  const renderEmbed = () => {
    calendarEl.innerHTML = ''

    if (!calendarId) {
      calendarEl.innerHTML = '<div class="calendarFallback">Календар ще не налаштований. Додай <code>VITE_GCAL_ID</code> у .env і зроби календар публічним.</div>'
      return
    }

    const tz = 'Europe/Kyiv'
    const src = encodeURIComponent(calendarId)
    const ctz = encodeURIComponent(tz)
    const url = `https://calendar.google.com/calendar/embed?src=${src}&ctz=${ctz}`

    const iframe = document.createElement('iframe')
    iframe.src = url
    iframe.loading = 'lazy'
    iframe.referrerPolicy = 'no-referrer-when-downgrade'
    iframe.setAttribute('title', 'Google Calendar')
    iframe.className = 'calendarEmbed'
    iframe.style.width = '100%'
    iframe.style.height = '720px'
    iframe.style.border = '0'

    calendarEl.appendChild(iframe)
  }


  if (!apiKey || !calendarId) {
    renderEmbed()
    return
  }

  calendarEl.innerHTML = ''

  try {
    const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin, listPlugin, googleCalendarPlugin],
  ...layout,
  height: 'auto',
  locale: 'uk',
  firstDay: 1,
  googleCalendarApiKey: apiKey,
  events: { googleCalendarId: calendarId },

  // адаптив: на мобилках компактная шапка и список недели
  windowResize: () => {
    const next = getCalendarLayout()
    calendar.setOption('headerToolbar', next.headerToolbar)
    if (calendar.view.type !== next.initialView) calendar.changeView(next.initialView)
  },

  eventClick: (info) => {
    // Открываем событие в Google Calendar вместо перехода внутри календаря
    if (info?.event?.url) {
      info.jsEvent.preventDefault()
      window.open(info.event.url, '_blank', 'noopener,noreferrer')
    }
  },
})
calendar.render()
  } catch (e) {
    // На проде лучше показать что-то рабочее, чем белый экран.
    renderEmbed()
  }
}

/* ========== Games ========== */
async function initGames() {
    const grid = $("#gamesGrid");
    const hint = $("#gamesHint");
    if (!grid || !hint) return;

    const sources = {
        boardgames: assetUrl("data/boardgames.json"),
        rpg: assetUrl("data/rpg.json"),
        wargames: assetUrl("data/wargames.json")
    };

    const tabs = Array.from(document.querySelectorAll(".tab"));
    const moreBtns = Array.from(document.querySelectorAll(".moreBtn[data-more]"));
    let active = "boardgames";

    const syncMore = () => {
        moreBtns.forEach((b) => b.classList.toggle("is-hidden", b.dataset.more !== active));
    };

    tabs.forEach((b) => {
        b.addEventListener("click", async () => {
            tabs.forEach((x) => x.classList.remove("is-active"));
            b.classList.add("is-active");
            active = b.dataset.tab;
            syncMore();
            await render(active);
        });
    });

    syncMore();
    await render(active);

    async function render(key) {
        grid.innerHTML = "";
        hint.textContent = "";

        const data = await safeJson(sources[key]);
        const items = normalizeList(data);

        if (!items.length) {
            hint.innerHTML = emptyStateGames(key);
            return;
        }

        const cards = items.slice(0, 6).map((x) => gameCard(x)).join("");
        grid.innerHTML = cards;

        animate(
            grid.children,
            { opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"] },
            { duration: 0.28, delay: stagger(0.03), easing: "ease-out" }
        );
    }

    function emptyStateGames(key) {
        const map = {
            boardgames: "public/data/boardgames.json",
            rpg: "public/data/rpg.json",
            wargames: "public/data/wargames.json"
        };
        return `
      <div class="empty">
        <div class="empty__title">Поки порожньо.</div>
        <div class="empty__text">
          Додай файл <code>${escapeHtml(map[key])}</code> (масив обʼєктів) — і тут зʼявляться картки.
        </div>
      </div>
    `;
    }

    function gameCard(x) {
        const title = pick(x, ["title", "name"]) || "Без назви";
        const desc =
            pick(x, ["description", "desc", "system", "setting"]) ||
            pick(x, ["summary"]) ||
            "";

        const imgRaw = pick(x, ["image", "img", "cover", "poster", "photo"]);
        const img = imgRaw ? absolutizeMaybe(imgRaw) : null;

        const tags = toArr(pick(x, ["tags", "genres"])).slice(0, 3);

        const meta = compactMeta(x);
        const pills = [
            meta.players && pill("users", formatPlayers(meta.players)),
            meta.time && pill("clock", formatTime(meta.time)),
            meta.level && pill("target", String(meta.level))
        ].filter(Boolean);

        const tagPills = tags.map((t) => `<span class="pillMini">#${escapeHtml(t)}</span>`).join("");

        const bg = img ? `style="background-image:url('${escapeAttr(img)}')"` : "";

        return `
      <article class="gameCard">
        <div class="gameCard__bg"></div>
        <div class="gameCard__bgImg" ${bg}></div>
        <div class="gameCard__overlay"></div>
        <div class="gameCard__body">
          <div class="gameCard__title">${escapeHtml(title)}</div>
          <p class="gameCard__desc">${escapeHtml(desc || "—")}</p>

          <div class="gameCard__meta">
            ${pills.join("")}
            ${tagPills}
          </div>
        </div>
      </article>
    `;
    }

    function pill(iconId, text) {

        if (iconId === "users") {
            return `<span class="pillMini"><svg class="ico ico--mini"><use href="${spriteHref(
                "users"
            )}"></use></svg>${escapeHtml(text)}</span>`;
        }
        return `<span class="pillMini">${escapeHtml(text)}</span>`;
    }

    function compactMeta(x) {
        return {
            players: pick(x, ["players", "playersCount", "people"]),
            time: pick(x, ["time", "duration", "playtime"]),
            level: pick(x, ["level", "difficulty"])
        };
    }
}

/* ========== Masters ========== */
async function initMasters() {
    const track = $("#mastersTrack");
    const hint = $("#mastersHint");
    const prev = $("#mastersPrev");
    const next = $("#mastersNext");
    if (!track || !hint) return;

    const data = await safeJson(assetUrl("data/masters.json"));
    const items = normalizeList(data);

    if (!items.length) {
        hint.innerHTML = `
      <div class="empty">
        <div class="empty__title">Майстрів поки нема.</div>
        <div class="empty__text">Додай <code>public/data/masters.json</code> — і секція оживе.</div>
      </div>`;
        railAutoControls(track, prev, next, true);
        return;
    }

    track.innerHTML = items.map((m) => masterCard(m)).join("");
    wireRail(track, prev, next);
    railAutoControls(track, prev, next);

    function masterCard(m) {
        const name = pick(m, ["name", "title"]) || "Майстер";
        const systems = toArr(pick(m, ["systems", "system", "games"]));
        const sysText = systems.length ? systems.join(", ") : "НРІ / Настолки";
        const bio = pick(m, ["bio", "description", "desc"]) || "Веде ігри та допомагає новачкам.";

        const imgRaw = pick(m, ["image", "avatar", "photo"]);
        const img = imgRaw ? absolutizeMaybe(imgRaw) : null;
        const fallback = initials(name);

        const avatar = img
            ? `<img src="${escapeAttr(img)}" alt="" loading="lazy" onerror="this.closest('.avatar')?.classList.add('is-fallback');this.remove();" />`
            : "";

        return `
      <article class="railCard">
        <div class="master">
          <div class="master__top">
            <div class="avatar ${img ? "" : "is-fallback"}" aria-hidden="true">
              ${avatar}
              <span class="avatar__txt">${escapeHtml(fallback)}</span>
            </div>
            <div>
              <div class="master__name">${escapeHtml(name)}</div>
              <div class="master__sys">${escapeHtml(sysText)}</div>
            </div>
          </div>
          <div class="master__bio">${escapeHtml(String(bio))}</div>
        </div>
      </article>
    `;
    }
}

/* ========== Gallery ========== */
async function initGallery() {
    const track = $("#galleryTrack");
    const hint = $("#galleryHint");
    const prev = $("#galleryPrev");
    const next = $("#galleryNext");
    if (!track || !hint) return;

    const data = await safeJson(assetUrl("data/gallery.json"));
    const items = normalizeList(data);

    if (!items.length) {
        hint.innerHTML = `
      <div class="empty">
        <div class="empty__title">Галерея порожня.</div>
        <div class="empty__text">Додай <code>public/data/gallery.json</code> та картинки в <code>public/images/gallery</code>.</div>
      </div>`;
        railAutoControls(track, prev, next, true);
        return;
    }

    track.innerHTML = items.slice(0, 24).map((p) => photoCard(p)).join("");
    wireRail(track, prev, next);
    railAutoControls(track, prev, next);

    function photoCard(p) {
        const srcRaw = pick(p, ["src", "url", "image", "img", "photo"]);
        const src = srcRaw ? absolutizeMaybe(srcRaw) : null;
        const cap = pick(p, ["caption", "title", "name", "alt"]) || "Івент Crits n Shits";

        if (!src) {
            return `
        <article class="railCard">
          <div class="photo"></div>
          <div class="photoCap">${escapeHtml(String(cap))}</div>
        </article>
      `;
        }

        return `
      <article class="railCard">
        <div class="photo">
          <img src="${escapeAttr(src)}" alt="${escapeAttr(String(cap))}" loading="lazy" />
        </div>
        <div class="photoCap">${escapeHtml(String(cap))}</div>
      </article>
    `;
    }
}

/* ========== Rules ========== */
function initRules() {
    const acc = $("#rulesAcc");
    if (!acc) return;

    const rules = [
        {
            t: "1. Загальні положення",
            b: [
                "Клуб — простір для хобі: настолки, НРІ, варгейми, скірміші.",
                "Мета — дозвілля, спілкування та відпочинок від буденності.",
                "Внески — лише на приміщення та базові витрати."
            ]
        },
        {
            t: "2. Поведінка",
            b: [
                "Будь ввічливим і поважай інших.",
                "Гумор — ок, але по контексту.",
                "Конфлікти вирішуємо конструктивно або розходимось без драми."
            ]
        },
        { t: "3. Оплата / внески", b: ["Внески/оплата ігор — вчасно."] },
        {
            t: "4. Речі та майно",
            b: [
                "Не псуй майно клубу чи учасників: мініатюри, матеріали, меблі, техніку.",
                "Після гри — прибираємо місце."
            ]
        },
        {
            t: "5. Алкоголь та куріння",
            b: [
                "Міцний алкоголь і “п’янки” — ні.",
                "Легкий алкоголь — тільки в межах адекватності.",
                "Куріння — на вулиці (або тільки якщо узгоджено і нікому не заважає)."
            ]
        },
        {
            t: "6. Політика та культура спілкування",
            b: [
                "Клуб поза політикою — такі теми краще лишати приватно.",
                "Суперечки про мову — не вітаються: домовляйтесь між собою.",
                "Жодного виправдання агресії росії — причина для негайного виключення."
            ]
        },
        {
            t: "7. Участь у подіях",
            b: [
                "Записався — приходь. Не можеш — попередь якомога раніше.",
                "Новачкам допоможемо: пояснимо правила, підберемо гру, введемо в процес."
            ]
        }
    ];

    acc.innerHTML = rules.map((r) => accItem(r)).join("");

    acc.addEventListener("click", (e) => {
        const btn = e.target.closest?.("[data-acc-btn]");
        if (!btn) return;

        const item = btn.closest(".accItem");
        const open = item.classList.toggle("is-open");

        Array.from(acc.querySelectorAll(".accItem")).forEach((x) => {
            if (x !== item) x.classList.remove("is-open");
        });

        btn.setAttribute("aria-expanded", String(open));
    });

    function accItem(r) {
        return `
      <div class="accItem">
        <button class="accBtn" data-acc-btn aria-expanded="false">
          <span>${escapeHtml(r.t)}</span>
          <svg class="ico"><use href="${spriteHref("chev-down")}"></use></svg>
        </button>
        <div class="accBody">
          <div class="accBody__in">
            <ul style="margin:0;padding-left:18px">
              ${r.b.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
    }
}

/* ========== Helpers ========== */
async function safeJson(url) {
    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

function initials(name) {
    const parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "CN";
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/`/g, "&#96;");
}

function absolutizeMaybe(path) {
    const p = String(path);
    if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) return p;
    return assetUrl(p);
}

function parseRangeMaybe(v) {
    // поддержка форматов:
    // {min,max}, "2-5", "2–5", "2", 2
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
    if (!s) return null;
    const m = s.match(/(\d+)\s*[-–—]\s*(\d+)/);
    if (m) return { min: Number(m[1]), max: Number(m[2]) };
    const one = s.match(/^\d+$/);
    if (one) {
        const n = Number(one[0]);
        return { min: n, max: n };
    }
    return null;
}

function formatPlayers(v) {
    const r = parseRangeMaybe(v);
    if (!r) return String(v);
    return r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
}

function formatTime(v) {
    const r = parseRangeMaybe(v);
    if (!r) return String(v);
    return r.min === r.max ? `${r.min} хв` : `${r.min}–${r.max} хв`;
}

function wireRail(track, prevBtn, nextBtn) {
    const step = () => Math.max(260, Math.round(track.clientWidth * 0.85));
    prevBtn?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    nextBtn?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") track.scrollBy({ left: step(), behavior: "smooth" });
        if (e.key === "ArrowLeft") track.scrollBy({ left: -step(), behavior: "smooth" });
    });
}

function railAutoControls(track, prevBtn, nextBtn, forceHide = false) {
    const update = () => {
        const need = track.scrollWidth > track.clientWidth + 2;
        const hide = forceHide || !need;
        prevBtn?.classList.toggle("is-hidden", hide);
        nextBtn?.classList.toggle("is-hidden", hide);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);
    track.addEventListener("scroll", update, { passive: true });
}