// motivation.: a quote, fresh every time it opens; your own quotes are kept
// in Supabase (motivation_quotes) and added through +. Runs inside lifeOS or
// on its own page (index.html), through /lifeos/embed.js.

const CACHE_KEY = "motivation:mine";
const LAST_KEY = "motivation:last";

export async function mount({ root, supabase: sb, active, asset }) {
  const { fill } = await import("/lifeos/embed.js");
  await fill(root, { css: asset("./app.css"), html: asset("./app.html") });

  const $ = (id) => root.getElementById(id);
  const qEl = $("quote");
  const aEl = $("author");
  const card = root.querySelector(".quote-card");

  const lastIndex = () => { try { return parseInt(localStorage.getItem(LAST_KEY), 10); } catch { return NaN; } };
  const rememberIndex = (i) => { try { localStorage.setItem(LAST_KEY, String(i)); } catch { /* private mode */ } };
  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || []; } catch { return []; } };
  const writeCache = (list) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* private mode */ } };

  let mine = readCache();
  let pool = [];
  let user = null;

  function pick() {
    if (pool.length < 2) return 0;
    const last = lastIndex();
    let i;
    do { i = Math.floor(Math.random() * pool.length); } while (i === last);
    return i;
  }
  function show(i, animate) {
    const empty = !pool.length;
    const item = pool[i] || { q: "No quotes yet. Tap + to add your first.", a: "" };
    qEl.className = empty ? "empty" : item.q.length > 260 ? "long" : item.q.length > 120 ? "mid" : "";
    qEl.textContent = item.q;
    aEl.textContent = item.a || "";
    rememberIndex(i);
    if (animate) {
      card.classList.remove("fade");
      void card.offsetWidth;          // restart the animation
      card.classList.add("fade");
    }
  }
  function rebuild(keepShowing) {
    pool = mine.map(m => ({ q: m.text, a: m.author || "" }));
    if (!keepShowing) show(pick(), false);
  }

  // ── the Your quotes sheet ──
  const back = $("sheetBack");
  const say = (text, kind) => { const m = $("msg"); m.textContent = text || ""; m.className = "msg" + (kind ? " " + kind : ""); };
  const openSheet = () => { back.classList.add("show"); say(""); };
  const closeSheet = () => back.classList.remove("show");

  function renderMine() {
    const box = $("mine");
    if (!mine.length) { box.innerHTML = '<h3>Your quotes</h3><p style="font-size:13.5px;color:var(--muted)">None yet. Add your first above.</p>'; return; }
    box.innerHTML = "<h3>Your quotes · " + mine.length + "</h3>";
    for (const m of mine) {
      const row = document.createElement("div");
      row.className = "mine-item";
      const p = document.createElement("p");
      p.textContent = m.text;
      if (m.author) { const w = document.createElement("span"); w.className = "who"; w.textContent = m.author; p.appendChild(w); }
      const del = document.createElement("button");
      del.type = "button"; del.textContent = "✕"; del.title = "Delete";
      del.addEventListener("click", () => removeQuote(m));
      row.append(p, del);
      box.appendChild(row);
    }
  }

  async function loadMine() {
    const res = await sb.from("motivation_quotes").select("id,text,author").order("created_at", { ascending: false });
    if (res.error) { say("Couldn’t load your quotes, so these are the ones saved here.", "err"); return; }
    const first = !mine.length;
    mine = res.data || [];
    writeCache(mine); renderMine(); rebuild(!first);
  }
  async function addQuote() {
    const text = $("newQuote").value.trim();
    const author = $("newAuthor").value.trim();
    if (!text) { say("Type a quote first.", "err"); return; }
    if (!user) { say("Sign in first.", "err"); return; }
    say("Saving…");
    const res = await sb.from("motivation_quotes").insert({ text, author, user_id: user.id }).select("id,text,author").single();
    if (res.error) { say("Couldn’t save: " + res.error.message, "err"); return; }
    mine.unshift(res.data); writeCache(mine); renderMine(); rebuild(true);
    $("newQuote").value = ""; $("newAuthor").value = "";
    say("Added.", "ok");
  }
  async function removeQuote(m) {
    if (!confirm("Delete this quote?")) return;
    const res = await sb.from("motivation_quotes").delete().eq("id", m.id);
    if (res.error) { say("Couldn’t delete: " + res.error.message, "err"); return; }
    mine = mine.filter(x => x.id !== m.id);
    writeCache(mine); renderMine(); rebuild(true);
    say("Deleted.", "ok");
  }

  rebuild(false);
  $("another").addEventListener("click", () => show(pick(), true));
  $("openSheet").addEventListener("click", openSheet);
  $("closeSheet").addEventListener("click", closeSheet);
  back.addEventListener("click", (e) => { if (e.target === back) closeSheet(); });
  $("addQuote").addEventListener("click", addQuote);
  // Escape closes the sheet, only while motivation. is the app on screen.
  const onKey = (e) => {
    if (e.key !== "Escape" || !active() || !back.classList.contains("show")) return;
    e.preventDefault();               // used here: lifeOS leaves the app open
    closeSheet();
  };
  document.addEventListener("keydown", onKey);

  // Signed in already: lifeOS (or this app's own page) checked before starting.
  const { data } = await sb.auth.getSession();
  user = data?.session?.user || null;
  if (user) { renderMine(); loadMine(); }

  return {
    // A fresh quote each time it comes back on screen.
    shown: () => show(pick(), true),
    unmount: () => document.removeEventListener("keydown", onKey),
  };
}
