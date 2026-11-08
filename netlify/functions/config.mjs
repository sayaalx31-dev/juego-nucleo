import { getStore } from "@netlify/blobs";

/* Contraseña inicial: cavar2026 (cámbiala desde el modo creador) */
const DEFAULT_HASH = "f9e71dcb10bb1609fca0cc053d1ee3cbe3a0b3700a70685df1df3a32444cd41b";
const H = { "content-type": "application/json", "cache-control": "no-store" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

async function sha(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hn1:" + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
const num = (v, min, max, d) => { v = +v; return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d; };
const txt = (v, n) => String(v == null ? "" : v).slice(0, n);

function clean(c) {
  const tools = (Array.isArray(c.tools) ? c.tools : []).slice(0, 30).map((t) => ({
    n: txt(t.n, 30) || "Herramienta",
    f: num(t.f, 0, 1e9, 0),
    lim: num(t.lim, 0.1, 1e8, 1),
    du: Math.round(num(t.du, 1, 1e5, 30)),
    k: txt(t.k, 12) || "⚙️",
  }));
  return { followers: num(c.followers, 0, 1e9, 0), handle: txt(c.handle, 30), news: txt(c.news, 120), tools };
}

export default async (req) => {
  const store = getStore("hacia-el-nucleo");
  if (req.method === "GET") {
    const c = await store.get("config", { type: "json" });
    return out(c || {});
  }
  if (req.method !== "POST") return out({ error: "metodo" }, 405);
  let b;
  try { b = await req.json(); } catch { return out({ error: "datos" }, 400); }
  const auth = (await store.get("auth", { type: "json" })) || { h: DEFAULT_HASH };
  if ((await sha(String(b.pass || ""))) !== auth.h) {
    await new Promise((r) => setTimeout(r, 500));
    return out({ error: "contrasena" }, 401);
  }
  if (b.action === "check") return out({ ok: true });
  if (b.action === "save") {
    const c = clean(b.config || {});
    if (!c.tools.length) return out({ error: "herramientas" }, 400);
    await store.setJSON("config", c);
    if (b.newPass) await store.setJSON("auth", { h: await sha(String(b.newPass)) });
    return out({ ok: true });
  }
  return out({ error: "accion" }, 400);
};

export const config = { path: "/api/config" };
