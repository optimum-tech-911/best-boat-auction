import React, { useState, useEffect, useMemo, useReducer, useRef, memo } from "react";
import {
  Anchor, Search, Heart, Bell, Gavel, Clock, MapPin, ChevronLeft, ChevronRight, X, Check, ShieldCheck,
  SlidersHorizontal, Eye, Users, Info, Zap, Share2, CheckCircle2, AlertTriangle, Timer, ArrowRight, Lock,
  LogOut, BadgeCheck, Scale, Banknote, Activity, Bot, RotateCcw, User, Calendar,
} from "lucide-react";

/* ============ CONFIG — mirrors the analysed platform; every rule is adjustable ============ */
const BRAND = "Tidebid";
const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const CONFIG = {
  premium: [[25000, 0.18], [100000, 0.12], [Infinity, 0.08]], // buyer's premium, tier chosen by START price
  vatPremium: 0.21,
  steps: [[0, 50], [1000, 100], [5000, 250], [10000, 500], [25000, 1000], [50000, 2000], [100000, 5000]],
  softWindow: 5 * MIN, softExtend: 5 * MIN, // a bid in the last 5 min → closes 5 min after that bid
  sellerFee: [[500, 100], [1000, 200], [1500, 300], [Infinity, 500]], // flat onboarding fee by length (cm)
  awardHours: 72, payDays: 4, pickupDays: 14, verifyFrom: 25000,
};
const premiumRate = (start) => CONFIG.premium.find(([lim]) => start < lim)[1];
const step = (a) => { let s = CONFIG.steps[0][1]; for (const [t, v] of CONFIG.steps) if (a >= t) s = v; return s; };
const nextMin = (l) => (l.bids.length ? l.price + step(l.price) : l.start);
const r2 = (x) => Math.round(x * 100) / 100;
function costs(lot, amount) {
  const rate = premiumRate(lot.start), vr = lot.vat || 0;
  const bidVat = r2(amount * vr), prem = r2(amount * rate), premVat = r2(prem * CONFIG.vatPremium);
  return { amount, rate, vr, bidVat, prem, premVat, total: r2(amount + bidVat + prem + premVat) };
}

/* ============ FORMAT HELPERS ============ */
const f0 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const f2 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const money = (n) => f0.format(Math.round(n || 0));
const money2 = (n) => f2.format(n || 0);
const DTF = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const DLF = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
const fmtDT = (t) => DTF.format(new Date(t));
const fmtDay = (t) => DLF.format(new Date(t));
const meters = (cm) => (cm / 100).toFixed(2) + " m";
const cx = (...a) => a.filter(Boolean).join(" ");
const pad = (n) => String(n).padStart(2, "0");
function countdown(ms) {
  if (ms <= 0) return "Closed";
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(x)}s`;
  return `${pad(m)}:${pad(x)}`;
}
function ago(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 5) return "just now"; if (s < 60) return s + "s ago";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); return h < 24 ? h + "h ago" : Math.floor(h / 24) + "d ago";
}
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ============ BIDDING ENGINE (pure; same logic belongs server-side in production) ============ */
function pushBid(l, b, amt, kind, now) {
  l.bids.push({ id: l.bids.length + 1, b, amt, kind, ts: now });
  l.price = amt; l.leader = b; l.leaderTs = now;
  if (l.endsAt - now < CONFIG.softWindow) { const ne = now + CONFIG.softExtend; if (ne > l.endsAt) { l.endsAt = ne; l._ext = true; } }
}
const strongest = (x, y) => y.max - x.max || x.ts - y.ts; // higher max wins; tie → earliest max wins
function settle(l, now) {
  for (let g = 0; g < 60; g++) {
    const P = l.price, L = l.leader, need = nextMin(l);
    let lc = null;
    if (L) { const lp = l.proxies[L]; lc = lp && lp.max >= P ? { b: L, max: lp.max, ts: lp.ts } : { b: L, max: P, ts: l.leaderTs }; }
    const ch = [];
    for (const b of Object.keys(l.proxies)) {
      if (b === L) continue;
      const p = l.proxies[b];
      if (p.max >= need || (lc && p.max === P && p.ts < lc.ts)) ch.push({ b, max: p.max, ts: p.ts });
    }
    if (!ch.length) break;
    if (!lc) { ch.sort(strongest); pushBid(l, ch[0].b, need, "auto", now); continue; }
    const all = [lc, ...ch].sort(strongest), W = all[0], R = all[1];
    const np = W.max === R.max ? W.max : Math.min(W.max, R.max + step(R.max));
    if (R.max > P) pushBid(l, R.b, R.max, "auto", now);
    if (W.b !== l.leader || np > l.price) pushBid(l, W.b, np, "auto", now);
  }
  const need = nextMin(l);
  for (const b of Object.keys(l.proxies)) if (b !== l.leader && l.proxies[b].max < need) delete l.proxies[b];
}
function bidOnLot(l0, b, amount, mode, now) {
  if (l0.phase !== "live" || now >= l0.endsAt) return { error: "Bidding on this lot has closed." };
  if (l0.sellerId === b) return { error: "You can't bid on your own boat." };
  if (!Number.isInteger(amount) || amount <= 0) return { error: "Enter an amount in whole euros." };
  if (amount > 50000000) return { error: "That amount looks wrong — please check it." };
  const l = { ...l0, bids: l0.bids.slice(), proxies: { ...l0.proxies } };
  const need = nextMin(l);
  if (mode === "single") {
    if (amount < need) return { error: `The minimum bid is ${money(need)}.` };
    if (l.proxies[b] && l.proxies[b].max <= amount) delete l.proxies[b];
    pushBid(l, b, amount, "manual", now);
  } else {
    const own = l.proxies[b];
    if (l.leader === b) { const fl = Math.max(l.price, own ? own.max : 0); if (amount <= fl) return { error: `Set a maximum above ${money(fl)}.` }; }
    else if (amount < need) return { error: `Your maximum must be at least ${money(need)}.` };
    l.proxies[b] = { max: amount, ts: now };
  }
  settle(l, now);
  if (l._ext) { l.ext = (l.ext || 0) + 1; delete l._ext; }
  return { lot: l };
}

/* ============ DEMO DATA ============ */
const CATS = [
  { id: "motor", label: "Motorboats", one: "motorboat" }, { id: "sail", label: "Sailboats", one: "sailboat" },
  { id: "speed", label: "Speedboats", one: "speedboat" }, { id: "sloop", label: "Sloeps", one: "sloep" },
  { id: "rib", label: "RIBs", one: "RIB" }, { id: "cat", label: "Catamarans", one: "catamaran" },
];
const CAT = Object.fromEntries(CATS.map((c) => [c.id, c]));
const COUNTRY = { NL: "Netherlands", BE: "Belgium", FR: "France", DE: "Germany", HR: "Croatia", AT: "Austria" };
const COND = { water: "Afloat", land: "Ashore on the hard", shed: "Stored indoors" };
const BOTS = [1043, 1187, 2290, 2384, 3121, 3355, 4078, 4410, 4821, 5096, 5530, 5874, 6012, 6449, 6903, 7215, 7562, 8034, 8361, 8790].map((n) => "b" + n);
const who = (b) => (b === "me" ? "You" : "Bidder " + b.slice(1));

const RAW = [
  { g: "x", brand: "Etap", model: "21i", cat: "sail", year: 2003, len: 635, beam: 249, draft: 105, mat: "Polyester", e: [1, "Mercury", 5, 140, "Petrol", "outboard"], berths: 4, city: "Sneek", cc: "NL", start: 4500, ceil: 5600, cond: "water",
    feat: ["Foam-filled unsinkable hull", "Roller-furling jib", "Depth sounder", "Shore power", "Cockpit cushions"], hi: ["Etap's double-skin, foam-filled hull keeps her afloat even when holed — a forgiving first cruiser for the Frisian lakes.", "The four-stroke outboard was serviced this spring."], iss: ["Antifouling is due next season.", "Small gelcoat chips at the stem."] },
  { g: "x", brand: "Terhi", model: "450 C", cat: "motor", year: 2010, len: 450, beam: 185, draft: 30, mat: "Polyester", e: [1, "Yamaha", 20, 210, "Petrol", "outboard"], berths: 0, city: "Giethoorn", cc: "NL", start: 1950, ceil: 2900, cond: "land", trailer: true, noRes: true,
    feat: ["Steering console", "Bow cushion", "Mooring cover", "Road trailer"], hi: ["A simple, stable runabout for canal villages and small lakes.", "The 20 hp Yamaha is economical and easy to maintain."], iss: ["Seat cushions are sun-faded."] },
  { g: "x", brand: "Zodiac", model: "Medline 7.5", cat: "rib", year: 2017, len: 750, beam: 294, draft: 50, mat: "Hypalon / polyester", e: [1, "Suzuki", 250, 420, "Petrol", "outboard"], berths: 2, city: "Antibes", cc: "FR", start: 24000, ceil: 28500, cond: "water",
    feat: ["Cuddy cabin with berth", "Garmin chartplotter", "VHF radio", "Bimini", "Sun pad"], hi: ["A fast, dry Riviera day boat with a real cuddy for two.", "Annual dealer service with invoices."], iss: ["UV fading on the tubes; no leaks reported."] },
  { g: "x", brand: "Interboat", model: "22 Classic", cat: "sloop", year: 2015, len: 670, beam: 250, draft: 60, mat: "Polyester", e: [1, "Vetus", 33, 380, "Diesel", "inboard"], berths: 0, city: "Loosdrecht", cc: "NL", start: 18500, ceil: 22500, cond: "water",
    feat: ["Teak deck", "Bimini & cover", "Bow thruster", "Bluetooth audio", "Shore power"], hi: ["The quintessential Dutch sloep: seats ten, classic lines, quiet diesel.", "Low-hour three-cylinder Vetus."], iss: [] },
  { g: "x", brand: "Saffier", model: "SE 24 Lite", cat: "sail", year: 2020, len: 735, beam: 255, draft: 135, mat: "Polyester", e: [1, "ePropulsion", 3, 60, "Electric", "outboard"], berths: 2, city: "IJmuiden", cc: "NL", start: 34000, ceil: 40000, cond: "land", trailer: true,
    feat: ["Self-tacking jib", "Code 0 on furler", "Electric outboard", "Carbon tiller", "Road trailer"], hi: ["A modern daysailer: quick, easy single-handed and fully electric.", "Lithium battery charges from shore power."], iss: ["Minor scuffs on the Code 0 bag."] },
  { g: "m", spot: true, pal: 2, brand: "Bavaria", model: "Cruiser 37", cat: "sail", year: 2016, len: 1131, beam: 385, draft: 195, mat: "Polyester", e: [1, "Volvo Penta", 29, 1150, "Diesel", "saildrive"], berths: 6, city: "Lelystad", cc: "NL", start: 62000, ceil: 78500, cond: "water",
    feat: ["In-mast furling", "Electric windlass", "B&G instruments", "Autopilot", "Sprayhood & bimini", "Bow thruster"], hi: ["A roomy three-cabin cruiser, kept by her second owner and sailed on the IJsselmeer and Wadden Sea.", "Saildrive diaphragm and engine mounts replaced in 2024."], iss: ["Genoa shows wear along the leech."] },
  { g: "m", pal: 1, brand: "Linssen", model: "Grand Sturdy 34.9 AC", cat: "motor", year: 2004, len: 1070, beam: 365, draft: 105, mat: "Steel", e: [1, "Volvo Penta", 150, 2850, "Diesel", "inboard"], berths: 6, city: "Roermond", cc: "NL", start: 89000, ceil: 118000, cond: "water",
    feat: ["Bow & stern thrusters", "Webasto heating", "Radar & plotter", "Autopilot", "Inverter", "Swim platform"], hi: ["Linssen steel build quality in the aft-cabin layout — a comfortable liveaboard for rivers and canals.", "Full dealer service history."], iss: ["Side-deck teak needs re-caulking in places."] },
  { g: "m", pal: 1, brand: "Lagoon", model: "380 S2", cat: "cat", year: 2012, len: 1155, beam: 653, draft: 115, mat: "Polyester", e: [2, "Yanmar", 29, 2400, "Diesel", "saildrive"], berths: 8, city: "Sukošan", cc: "HR", start: 135000, ceil: 168000, cond: "water",
    feat: ["800 W solar", "Watermaker", "Davits with tender", "Autopilot", "Generator", "Lithium house bank"], hi: ["The defining cruising catamaran of its generation, owner's version, ready for the Adriatic.", "Both saildrives serviced in 2025."], iss: ["Trampoline due for replacement."] },
  { g: "m", pal: 3, brand: "Hallberg-Rassy", model: "312 MkII", cat: "sail", year: 1985, len: 940, beam: 300, draft: 150, mat: "Polyester", e: [1, "Yanmar", 27, 1900, "Diesel", "inboard"], berths: 5, city: "Kiel", cc: "DE", start: 27000, ceil: 36800, cond: "land",
    feat: ["Fixed windscreen", "Diesel heater", "Wind-vane steering", "Teak interior", "Liferaft (2025)"], hi: ["A classic Swedish centre-cockpit cruiser — seaworthy, solid and dry.", "Repowered in 2009."], iss: ["Original teak deck worn in places."] },
  { g: "m", brand: "Jeanneau", model: "Merry Fisher 695", cat: "motor", year: 2019, len: 650, beam: 254, draft: 50, mat: "Polyester", e: [1, "Yamaha", 150, 310, "Petrol", "outboard"], berths: 2, city: "La Rochelle", cc: "FR", start: 29500, ceil: 38200, cond: "water",
    feat: ["Rod holders", "Fishfinder", "VHF radio", "Electric windlass", "Live bait well"], hi: ["A versatile Atlantic fishing and family boat with a protective wheelhouse.", "Low-hour Yamaha F150."], iss: [] },
  { g: "m", brand: "Sea Ray", model: "Sundancer 265", cat: "speed", year: 2008, len: 820, beam: 259, draft: 94, mat: "Polyester", e: [1, "MerCruiser", 300, 640, "Petrol", "sterndrive"], berths: 4, city: "Nieuwpoort", cc: "BE", start: 19000, ceil: 26300, cond: "shed",
    feat: ["Bravo III drive", "Cockpit fridge", "Hot water", "Camper canvas", "Swim platform"], hi: ["A compact sports cruiser with cabin, galley and heads.", "New risers and manifolds in 2023."], iss: ["Two small tears in the cockpit upholstery."] },
  { g: "m", brand: "Frauscher", model: "747 Mirage", cat: "speed", year: 2016, len: 747, beam: 249, draft: 80, mat: "Polyester", e: [1, "Volvo Penta", 300, 280, "Petrol", "sterndrive"], berths: 2, city: "Gmunden", cc: "AT", start: 65000, ceil: 81500, cond: "shed", trailer: true,
    feat: ["Teak deck", "Sun lounger", "Bimini", "Bluetooth audio", "Tandem trailer"], hi: ["Hand-finished Austrian lake runabout with timeless lines.", "Winter-stored indoors and yard-serviced every season."], iss: [] },
  { g: "m", brand: "Brig", model: "Eagle 670", cat: "rib", year: 2022, len: 670, beam: 255, draft: 45, mat: "Hypalon / polyester", e: [1, "Honda", 150, 120, "Petrol", "outboard"], berths: 0, city: "Vlissingen", cc: "NL", start: 27000, ceil: 36200, cond: "land", trailer: true,
    feat: ["Hypalon tubes", "Console display", "Ski arch", "Sun pad", "Road trailer"], hi: ["Nearly new, fast and dry — a premium RIB for the Zeeland delta.", "Only 120 engine hours."], iss: [] },
  { g: "m", pal: 0, brand: "Rapsody", model: "R29 OC", cat: "sloop", year: 2017, len: 880, beam: 290, draft: 85, mat: "Polyester", e: [1, "Volvo Penta", 150, 420, "Diesel", "sterndrive"], berths: 2, city: "Muiden", cc: "NL", start: 75000, ceil: 93500, cond: "water",
    feat: ["Teak deck", "Bow thruster", "Heating", "Canopy", "Swim platform"], hi: ["A luxury open-cabin sloep — big enough for the IJsselmeer, small enough for the canals.", "Diesel with Duoprop drive."], iss: [] },
  { g: "r", brand: "Princess", model: "42 Fly", cat: "motor", year: 2006, len: 1300, beam: 400, draft: 100, mat: "Polyester", e: [2, "Volvo Penta", 370, 1100, "Diesel", "inboard"], berths: 6, city: "Hellevoetsluis", cc: "NL", start: 110000, final: 141000, out: "awarded", nb: 14, cond: "water",
    feat: ["Flybridge", "Generator", "Air conditioning", "Bow thruster"], hi: ["A British flybridge cruiser.", ""], iss: [] },
  { g: "r", brand: "Contest", model: "33", cat: "sail", year: 1984, len: 1000, beam: 325, draft: 160, mat: "Polyester", e: [1, "Volvo Penta", 28, 3400, "Diesel", "inboard"], berths: 6, city: "Medemblik", cc: "NL", start: 14000, final: 19250, out: "awarded", nb: 9, cond: "land",
    feat: ["Sprayhood", "Autopilot", "Furling genoa"], hi: ["A sturdy Dutch-built cruiser.", ""], iss: [] },
];

function thirdMonday(y, m) { const d = new Date(y, m, 1, 20, 0, 0, 0); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); return d; }
function upcoming(now, n) {
  const out = []; const d0 = new Date(now); let y = d0.getFullYear(), m = d0.getMonth();
  for (let k = 0; out.length < n && k < 36; k++) {
    const d = thirdMonday(y, m);
    if (d.getTime() > now + 6 * DAY) { const v = new Date(d); v.setDate(v.getDate() - 2); v.setHours(10, 0, 0, 0); out.push({ close: d.getTime(), view: v.getTime() }); }
    if (++m > 11) { m = 0; y++; }
  }
  return out;
}

function buildState(now) {
  const rng = mulberry32(2610);
  const main = upcoming(now, 1)[0];
  const lots = {}; let xi = 0, mi = 0, ri = 0;
  RAW.forEach((r, i) => {
    const l = {
      ...r, id: "L" + (7701 + i), no: 7701 + i,
      eng: { n: r.e[0], brand: r.e[1], hp: r.e[2], h: r.e[3], fuel: r.e[4], type: r.e[5] },
      pal: r.pal != null ? r.pal : (i * 3 + 1) % 4, noRes: !!r.noRes, trailer: !!r.trailer, vat: r.vat || 0,
      reserve: r.noRes ? null : Math.round((r.start * (1.04 + rng() * 0.14)) / 100) * 100,
      acceptsBelow: rng() < 0.55, decideMs: (8 + Math.floor(rng() * 9)) * 1000,
      views: 140 + Math.floor(rng() * 2300), watchers: 3 + Math.floor(rng() * 36), regs: Math.floor(rng() * 11),
      bids: [], proxies: {}, price: null, leader: null, leaderTs: 0, ext: 0, phase: "live", sellerId: "s" + i, viewing: null,
    };
    if (r.g === "x") { l.auction = "flash"; l.endsAt = now + (4 + xi++) * MIN + 20000; }
    else if (r.g === "m") { l.auction = "main"; l.endsAt = main.close + mi++ * MIN; l.viewing = main.view; }
    else { l.auction = "prev"; l.endsAt = now - (3 + ri++) * DAY; }
    let price = null, last = null;
    if (r.g !== "r") {
      const nb = r.g === "x" ? 3 + Math.floor(rng() * 4) : Math.floor(rng() * 6);
      const span = r.g === "x" ? 2 * HOUR : 4 * DAY;
      for (let k = 0; k < nb; k++) {
        const amt = price == null ? l.start : price + step(price) * (rng() < 0.75 ? 1 : 2);
        if (amt > l.ceil * 0.88) break;
        let b; do { b = BOTS[Math.floor(rng() * BOTS.length)]; } while (b === last);
        l.bids.push({ id: k + 1, b, amt, kind: "manual", ts: now - span + Math.floor(((k + 1) * (span - 10 * MIN)) / (nb + 1)) });
        price = amt; last = b;
      }
      if (l.bids.length && rng() < 0.4) { const mx = Math.min(Math.floor(l.ceil * 0.95), price + step(price) * (2 + Math.floor(rng() * 3))); if (mx > price) l.proxies[last] = { max: mx, ts: l.bids[l.bids.length - 1].ts }; }
    } else {
      for (let k = 0; k < r.nb; k++) {
        const amt = k === r.nb - 1 ? r.final : Math.round((r.start + ((r.final - r.start) * k) / (r.nb - 1)) / 50) * 50;
        if (price != null && amt <= price) continue;
        let b; do { b = BOTS[Math.floor(rng() * BOTS.length)]; } while (b === last);
        l.bids.push({ id: l.bids.length + 1, b, amt, kind: rng() < 0.3 ? "auto" : "manual", ts: l.endsAt - (r.nb - k) * 6 * MIN });
        price = amt; last = b;
      }
      l.phase = r.out; l.closedAt = l.endsAt;
    }
    if (l.bids.length) { l.price = price; l.leader = last; l.leaderTs = l.bids[l.bids.length - 1].ts; }
    lots[l.id] = l;
  });
  return { seq: 1, lots, main, user: null, watch: {}, notes: [], activity: [], flags: {}, regs: {}, bots: true };
}

function describe(l) {
  const kind = CAT[l.cat] ? CAT[l.cat].one : "boat", e = l.eng, hi = l.hi || [];
  const fuel = e.fuel === "Electric" ? "electric power" : String(e.fuel).toLowerCase();
  return [
    { h: `What kind of ${kind} is the ${l.brand} ${l.model}?`, p: `The ${l.brand} ${l.model} is a ${l.year} ${String(l.mat).toLowerCase()} ${kind} measuring ${meters(l.len)} by ${meters(l.beam)}, with a draught of ${meters(l.draft)}. ${hi[0] || ""}` },
    { h: "Engine & performance", p: `${e.n > 1 ? `Twin ${e.brand} engines deliver about ${e.hp} hp each` : `A single ${e.brand} ${e.type} delivers about ${e.hp} hp`} on ${fuel}, with roughly ${Number(e.h).toLocaleString("en-GB")} running hours declared by the seller. ${hi[1] || ""}` },
    { h: "Accommodation & equipment", p: `${l.berths ? `She sleeps ${l.berths}.` : "An open layout made for day trips."} The inventory includes ${l.feat.slice(0, 4).join(", ")}${l.feat.length > 4 ? " and more" : ""}.` },
    { h: "Points of attention", p: l.iss.length ? l.iss.join(" ") : "The seller reports no known defects. As with any used boat, we recommend the viewing day or an independent survey." },
    { h: "Viewing & handover", p: `${COND[l.cond]}. ${l.trailer ? "A trailer is included." : "Sold without trailer."} Sold as-is, where-is under the general auction terms. As a public auction under bailiff supervision, the statutory right of withdrawal does not apply.` },
  ];
}

/* ============ STATE ============ */
const T = (l) => `${l.brand} ${l.model}`;
function addNote(s, n, now) { const id = s.seq + 1; return { ...s, seq: id, notes: [{ id, ts: now, read: false, ...n }, ...s.notes].slice(0, 60) }; }

function tick(s, now) {
  let lots = null, flags = null; const notes = [];
  const put = (l) => { if (!lots) lots = { ...s.lots }; lots[l.id] = l; };
  for (const l0 of Object.values(s.lots)) {
    const t = T(l0), iBid = l0.bids.some((x) => x.b === "me");
    if (l0.phase === "live" && now >= l0.endsAt) {
      const l = { ...l0, closedAt: l0.endsAt };
      if (!l.bids.length) l.phase = "unsold";
      else if (l.noRes) {
        l.phase = "awarded"; l.awardedAt = now;
        if (l.leader === "me") notes.push({ kind: "won", lotId: l.id, title: `You won the ${t}!`, body: `No reserve — sold to you for ${money(l.price)}. Your invoice follows.` });
        else if (iBid) notes.push({ kind: "lost", lotId: l.id, title: "Lot closed — you were outbid", body: `${t} sold for ${money(l.price)}.` });
      } else {
        l.phase = "pending";
        if (l.leader === "me") notes.push({ kind: "pending", lotId: l.id, title: "Highest bid — awaiting the seller", body: `${t} closed at ${money(l.price)}. The seller has up to ${CONFIG.awardHours} hours to accept.` });
        else if (iBid) notes.push({ kind: "lost", lotId: l.id, title: "Lot closed — you were outbid", body: `${t} closed at ${money(l.price)}.` });
      }
      put(l);
    } else if (l0.phase === "pending" && now >= l0.closedAt + l0.decideMs) {
      const ok = l0.reserve == null || l0.price >= l0.reserve || l0.acceptsBelow;
      put({ ...l0, phase: ok ? "awarded" : "declined", awardedAt: now });
      if (l0.leader === "me") notes.push(ok
        ? { kind: "won", lotId: l0.id, title: `Accepted — the ${t} is yours`, body: `The seller accepted ${money(l0.price)}. Invoice within 24h; pay within ${CONFIG.payDays} days.` }
        : { kind: "lost", lotId: l0.id, title: "The seller declined", body: `${t} was not awarded. Nothing is owed.` });
    } else if (l0.phase === "live" && l0.endsAt - now <= 10 * MIN && !s.flags[l0.id] && (s.watch[l0.id] || iBid)) {
      if (!flags) flags = { ...s.flags }; flags[l0.id] = true;
      notes.push({ kind: "soon", lotId: l0.id, title: "Closing soon", body: `${t} closes in ${countdown(l0.endsAt - now)}.` });
    }
  }
  if (!lots && !flags && !notes.length) return s;
  let n = { ...s }; if (lots) n.lots = lots; if (flags) n.flags = flags;
  for (const x of notes) n = addNote(n, x, now);
  return n;
}

function reducer(s, a) {
  switch (a.type) {
    case "TICK": return tick(s, a.now);
    case "BID": {
      const l0 = s.lots[a.lotId]; if (!l0) return s;
      const res = bidOnLot(l0, a.b, a.amount, a.mode, a.now);
      if (res.error) return a.b === "me" ? addNote(s, { kind: "error", lotId: l0.id, title: "Bid not placed", body: res.error }, a.now) : s;
      const l = res.lot, t = T(l), fresh = l.bids.slice(l0.bids.length);
      let n = { ...s, lots: { ...s.lots, [l.id]: l }, activity: [...fresh.map((x) => ({ ...x, lotId: l.id })).reverse(), ...s.activity].slice(0, 40) };
      const was = l0.leader === "me", is = l.leader === "me";
      if (a.b === "me") {
        if (a.mode === "single") n = addNote(n, is ? { kind: "ok", lotId: l.id, title: `Bid placed · ${money(a.amount)}`, body: `You're the highest bidder on the ${t}.` } : { kind: "outbid", lotId: l.id, title: "Outbid instantly", body: `An existing automatic bid covered yours. Now ${money(l.price)}.` }, a.now);
        else n = addNote(n, is ? { kind: "auto", lotId: l.id, title: `Auto-bid set · max ${money(a.amount)}`, body: `You lead at ${money(l.price)}. We only bid what's needed.` } : { kind: "outbid", lotId: l.id, title: "Your maximum wasn't enough", body: `A higher or earlier maximum leads at ${money(l.price)}.` }, a.now);
      } else if (was && !is) n = addNote(n, { kind: "outbid", lotId: l.id, title: "You've been outbid", body: `${t} is now at ${money(l.price)}.` }, a.now);
      else if (was && is && fresh.some((x) => x.b === "me")) n = addNote(n, { kind: "auto", lotId: l.id, title: "Your auto-bid kept you ahead", body: `${t} · ${money(l.price)}` }, a.now);
      if ((l.ext || 0) > (l0.ext || 0) && l.bids.some((x) => x.b === "me")) n = addNote(n, { kind: "ext", lotId: l.id, title: "Soft close · time extended", body: `${t} now closes ${fmtDT(l.endsAt)}.` }, a.now);
      return n;
    }
    case "CANCEL_AUTO": {
      const l0 = s.lots[a.lotId]; if (!l0 || !l0.proxies.me) return s;
      const proxies = { ...l0.proxies }; delete proxies.me;
      return addNote({ ...s, lots: { ...s.lots, [l0.id]: { ...l0, proxies } } }, { kind: "info", lotId: l0.id, title: "Auto-bid cancelled", body: "Your most recent bid stays valid and binding." }, a.now);
    }
    case "WATCH": { const on = !s.watch[a.lotId], l = s.lots[a.lotId]; return { ...s, watch: { ...s.watch, [a.lotId]: on }, lots: { ...s.lots, [l.id]: { ...l, watchers: Math.max(0, l.watchers + (on ? 1 : -1)) } } }; }
    case "VIEW": { const l = s.lots[a.lotId]; return l ? { ...s, lots: { ...s.lots, [l.id]: { ...l, views: l.views + 1 } } } : s; }
    case "REG": { const l = s.lots[a.lotId]; return { ...s, regs: { ...s.regs, [l.id]: a.data }, lots: { ...s.lots, [l.id]: { ...l, regs: l.regs + 1 } } }; }
    case "LOGIN": return { ...s, user: { name: a.name, email: a.email, verified: false } };
    case "LOGOUT": return { ...s, user: null };
    case "VERIFY": return s.user ? { ...s, user: { ...s.user, verified: true } } : s;
    case "READ": return { ...s, notes: s.notes.map((x) => (x.read ? x : { ...x, read: true })) };
    case "BOTS": return { ...s, bots: a.on };
    case "RESET": return { ...buildState(a.now), user: s.user, bots: s.bots };
    default: return s;
  }
}

function botMove(s, now) {
  if (!s.bots) return null;
  const live = Object.values(s.lots).filter((l) => l.phase === "live" && l.endsAt - now > 1500);
  if (!live.length) return null;
  const w = live.map((l) => { const rem = l.endsAt - now; let x = rem > DAY ? 0.4 : rem > HOUR ? 1 : rem > 20 * MIN ? 3 : 8; if (l.leader === "me") x += 3; if (s.watch[l.id]) x += 0.5; return x; });
  let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
  while (r > w[i] && i < w.length - 1) { r -= w[i]; i++; }
  const l = live[i], need = nextMin(l);
  if (need > l.ceil) return null;
  const heat = (need - l.start) / Math.max(1, l.ceil - l.start);
  let p = 0.9 - heat * heat * 0.7;
  if (l.endsAt - now < CONFIG.softWindow) p *= l.ext > 3 ? 0.15 : 0.4;
  if (Math.random() > p) return null;
  const pool = BOTS.filter((b) => b !== l.leader), b = pool[Math.floor(Math.random() * pool.length)];
  if (Math.random() < 0.28) return { type: "BID", lotId: l.id, b, mode: "auto", now, amount: Math.round(Math.min(l.ceil, need + step(need) * (1 + Math.floor(Math.random() * 5)))) };
  return { type: "BID", lotId: l.id, b, mode: "single", now, amount: Math.round(Math.min(l.ceil, Math.random() < 0.8 ? need : need + step(need))) };
}

/* ============ ART — generated boat scenes (swap for real photos in production) ============ */
const PAL = [
  { n: "dawn", sky: ["#FDE8D7", "#F2AE96"], sea: ["#8AA4BE", "#33506F"], sun: "#FFF2E4", hill: "#A98597", hull: "#FCF8F3", deck: "#EEE6DC", glass: "#2D3B57", trim: "#C8553D", sail: "#FFFBF6", mast: "#3B3446", sx: 300, sy: 156 },
  { n: "noon", sky: ["#DFF2FC", "#8ECCEC"], sea: ["#3AA1C5", "#0E4E70"], sun: "#FFFFFF", hill: "#6FA093", hull: "#FFFFFF", deck: "#ECF2F5", glass: "#15324A", trim: "#0E7C86", sail: "#FFFFFF", mast: "#25384A", sx: 92, sy: 62 },
  { n: "golden", sky: ["#FFE6B0", "#F2965F"], sea: ["#4F7FA1", "#1C3956"], sun: "#FFF5D2", hill: "#8F6B57", hull: "#FFF8EF", deck: "#F2E4D1", glass: "#2B2F45", trim: "#B4472F", sail: "#FFF5E6", mast: "#3A2F3A", sx: 118, sy: 150 },
  { n: "nordic", sky: ["#EFF4F7", "#BED0DB"], sea: ["#7E9BAD", "#36525E"], sun: "#FFFFFF", hill: "#74868D", hull: "#FFFFFF", deck: "#E2E9ED", glass: "#2E3F4A", trim: "#2F6F86", sail: "#FFFFFF", mast: "#33454F", sx: 318, sy: 98 },
  { n: "dusk", sky: ["#3F3460", "#DC806E"], sea: ["#34476F", "#131E37"], sun: "#FFD7AA", hill: "#3D3658", hull: "#1C2339", deck: "#272F49", glass: "#FFC98F", trim: "#FF8A5B", sail: "#EFD9D0", mast: "#0E1426", sx: 282, sy: 166 },
  { n: "night", sky: ["#0C1B34", "#284770"], sea: ["#13294B", "#060F1F"], sun: "#F3EFD8", hill: "#10264A", hull: "#0F1B2F", deck: "#172642", glass: "#FFD38B", trim: "#5EC8D8", sail: "#C9D6E8", mast: "#050B16", sx: 84, sy: 58 },
];
const VIEWS = [{ s: 1, x: 200, f: 1, dp: 0 }, { s: 1.6, x: 236, f: 1, dp: 0 }, { s: 1.05, x: 200, f: -1, dp: 1 }, { s: 0.62, x: 150, f: 1, dp: 2 }, { s: 1.12, x: 206, f: -1, fix: 5 }, { s: 1.32, x: 172, f: -1, dp: 3 }];
const HILLS = ["M0,182 L0,170 Q34,160 70,167 T140,165 T205,173 L205,182 Z", "M196,182 L196,175 Q238,160 284,167 T352,163 T400,170 L400,182 Z", "M0,182 L0,177 Q62,168 124,174 T248,171 T372,175 L400,174 L400,182 Z"];
const KSCALE = { cat: 0.92, speed: 1.05, rib: 1.05, sloop: 1.05 };
const H = 182;
const wave = (y, amp, off) => { let d = `M${off - 40},${y}`; for (let x = off - 40; x < 440; x += 40) d += ` q10,${-amp} 20,0 t20,0`; return d; };
const CAT_HULL = "M-98,-14 L92,-14 L106,-22 Q100,0 78,6 L-86,6 Q-98,0 -98,-14 Z";

function BoatShape({ kind, p }) {
  if (kind === "sail") return (<g>
    <rect x="9" y="-162" width="3" height="152" fill={p.mast} />
    <path d="M7,-154 C-8,-112 -38,-54 -64,-18 L7,-18 Z" fill={p.sail} />
    <path d="M16,-148 L92,-13 L5,-15 Q15,-80 16,-148 Z" fill={p.sail} opacity="0.88" />
    <rect x="-68" y="-20" width="78" height="3" rx="1.5" fill={p.mast} />
    <path d="M-102,-12 L98,-12 Q92,2 66,6 L-80,6 Q-98,2 -102,-12 Z" fill={p.hull} />
    <path d="M-100,-5 L95,-5 L93,-2 L-99,-2 Z" fill={p.trim} />
    <path d="M-38,-12 L34,-12 L26,-23 L-26,-23 Z" fill={p.deck} />
    <rect x="-18" y="-20" width="34" height="4" rx="2" fill={p.glass} />
  </g>);
  if (kind === "cat") return (<g>
    <rect x="5" y="-176" width="3" height="134" fill={p.mast} />
    <path d="M3,-168 C-12,-128 -40,-74 -62,-44 L3,-44 Z" fill={p.sail} />
    <path d="M11,-160 L84,-16 L4,-44 Q12,-100 11,-160 Z" fill={p.sail} opacity="0.88" />
    <g transform="translate(18,-8) scale(0.94)"><path d={CAT_HULL} fill={p.deck} /></g>
    <path d="M-70,-14 L66,-14 L58,-40 L-56,-40 Z" fill={p.deck} />
    <path d="M-50,-34 L48,-34 L54,-22 L-60,-22 Z" fill={p.glass} />
    <path d={CAT_HULL} fill={p.hull} />
    <path d="M-96,-4 L100,-4 L99,-1 L-95,-1 Z" fill={p.trim} />
  </g>);
  if (kind === "speed") return (<g>
    <rect x="-40" y="-20" width="28" height="8" rx="3" fill={p.deck} />
    <rect x="-72" y="-18" width="20" height="6" rx="3" fill={p.deck} />
    <path d="M4,-12 L22,-28 L40,-28 L48,-12 Z" fill={p.glass} opacity="0.85" />
    <path d="M-96,-12 L92,-12 L114,-22 Q106,0 82,6 L-86,6 Q-96,0 -96,-12 Z" fill={p.hull} />
    <path d="M-94,-4 L108,-15 L106,-11 L-92,-1 Z" fill={p.trim} />
  </g>);
  if (kind === "rib") return (<g>
    <path d="M-104,-30 L-92,-30 L-90,-6 L-98,6 L-104,6 Z" fill={p.mast} />
    <path d="M-10,-16 L18,-16 L16,-36 L-6,-36 Z" fill={p.hull} />
    <path d="M-4,-36 L14,-36 L22,-47 L2,-47 Z" fill={p.glass} opacity="0.85" />
    <rect x="-52" y="-25" width="28" height="9" rx="3" fill={p.deck} />
    <path d="M-90,-4 L92,-4 Q86,6 60,7 L-70,7 Q-88,4 -90,-4 Z" fill={p.mast} opacity="0.85" />
    <path d="M-96,-17 L84,-17 Q106,-17 108,-7 Q106,3 84,1 L-96,1 Q-104,-8 -96,-17 Z" fill={p.trim} />
    <path d="M-92,-11 L96,-11" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.2" />
  </g>);
  if (kind === "sloop") return (<g>
    <path d="M-40,-16 L-38,-44 M30,-18 L32,-44" stroke={p.mast} strokeWidth="1.6" fill="none" />
    <path d="M-48,-44 L40,-44 L33,-51 L-41,-51 Z" fill={p.deck} />
    <rect x="-62" y="-25" width="96" height="8" rx="4" fill={p.deck} />
    <path d="M-92,-14 Q0,-20 92,-18 L100,-25 Q96,0 72,6 L-80,6 Q-94,0 -92,-14 Z" fill={p.hull} />
    <path d="M-92,-14 Q0,-20 92,-18 L94,-15 Q0,-16.5 -91,-10.5 Z" fill={p.trim} />
  </g>);
  return (<g>
    <rect x="-34" y="-70" width="3.5" height="16" fill={p.mast} />
    <rect x="-44" y="-72" width="24" height="3" rx="1.5" fill={p.mast} />
    <path d="M-56,-40 L30,-40 L22,-54 L-48,-54 Z" fill={p.deck} />
    <path d="M10,-53 L22,-53 L28,-41 L16,-41 Z" fill={p.glass} />
    <path d="M-84,-18 L74,-18 L58,-40 L-74,-40 Z" fill={p.deck} />
    <path d="M-66,-35 L52,-35 L60,-24 L-70,-24 Z" fill={p.glass} />
    <path d="M-112,-18 L102,-18 L124,-30 L118,-8 Q104,5 70,6 L-104,6 Q-114,0 -112,-18 Z" fill={p.hull} />
    <path d="M-109,-3 L115,-3 L113,0 L-107,0 Z" fill={p.trim} />
    {[-46, -28, -10].map((x) => <rect key={x} x={x} y="-13" width="11" height="3" rx="1.5" fill={p.glass} />)}
  </g>);
}

const BoatArt = memo(function BoatArt({ kind = "motor", pal = 0, v = 0 }) {
  const uid = useMemo(() => "ba" + Math.random().toString(36).slice(2, 9), []);
  const V = VIEWS[v % VIEWS.length];
  const p = PAL[V.fix != null ? V.fix : (pal + (V.dp || 0)) % 5];
  const sx = V.f === -1 ? 400 - p.sx : p.sx, s = V.s * (KSCALE[kind] || 1), night = p.n === "night";
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="block w-full h-full" role="img" aria-label={`Illustration of a ${kind}`}>
      <defs>
        <linearGradient id={uid + "s"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sky[0]} /><stop offset="1" stopColor={p.sky[1]} /></linearGradient>
        <linearGradient id={uid + "w"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.sea[0]} /><stop offset="1" stopColor={p.sea[1]} /></linearGradient>
        <radialGradient id={uid + "g"}><stop offset="0" stopColor={p.sun} stopOpacity="0.85" /><stop offset="1" stopColor={p.sun} stopOpacity="0" /></radialGradient>
        <clipPath id={uid + "c"}><rect x="0" y={H} width="400" height={300 - H} /></clipPath>
      </defs>
      <rect width="400" height="300" fill={`url(#${uid}s)`} />
      {night && [[40, 30], [120, 48], [210, 22], [260, 60], [330, 34], [370, 80], [160, 90], [300, 110]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 0.9 : 1.4} fill="#fff" opacity="0.8" />)}
      <circle cx={sx} cy={p.sy} r={night ? 46 : 74} fill={`url(#${uid}g)`} />
      <circle cx={sx} cy={p.sy} r={night ? 11 : 15} fill={p.sun} />
      <path d={HILLS[(pal + v) % 3]} fill={p.hill} opacity="0.6" />
      <rect y={H} width="400" height={300 - H} fill={`url(#${uid}w)`} />
      {Array.from({ length: 9 }).map((_, i) => { const w = 10 + i * 7; return <rect key={i} x={sx - w / 2 + ((i * 37) % 9) - 4} y={H + 5 + i * 12} width={w} height="1.6" rx="0.8" fill={p.sun} opacity={Math.max(0.06, 0.5 - i * 0.05)} />; })}
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={wave(H + 14 + i * 22, 1.5 + i * 0.6, (i * 13) % 40)} fill="none" stroke="#fff" strokeOpacity={0.1 + i * 0.03} strokeWidth="1" />)}
      <g clipPath={`url(#${uid}c)`} opacity="0.22"><g transform={`translate(${V.x},${H + 4}) scale(${s * V.f},${-s})`}><BoatShape kind={kind} p={p} /></g></g>
      <g transform={`translate(${V.x},${H + 4}) scale(${s * V.f},${s})`}><BoatShape kind={kind} p={p} /></g>
      <ellipse cx={V.x} cy={H + 7} rx={112 * s} ry="2.6" fill="#fff" opacity="0.28" />
    </svg>
  );
});

/* ============ UI PRIMITIVES ============ */
function Btn({ children, variant = "primary", size = "md", className = "", ...rest }) {
  const v = { primary: "bg-slate-900 text-white hover:bg-slate-700", accent: "bg-teal-600 text-white hover:bg-teal-700", hot: "bg-orange-500 text-white hover:bg-orange-600", ghost: "text-slate-700 hover:bg-slate-100", outline: "border border-slate-300 text-slate-800 hover:border-slate-900 bg-white", light: "bg-white text-slate-900 hover:bg-slate-100" };
  const z = { sm: "text-xs px-3 py-1.5", md: "text-sm px-5 py-2.5", lg: "text-base px-6 py-3.5" };
  return <button type="button" className={cx("inline-flex items-center justify-center gap-2 font-semibold rounded-full transition focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-40 disabled:cursor-not-allowed", v[variant], z[size], className)} {...rest}>{children}</button>;
}
function Pill({ tone = "slate", children, className = "" }) {
  const t = { slate: "bg-slate-100 text-slate-700", teal: "bg-teal-50 text-teal-800 ring-1 ring-teal-200", orange: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200", dark: "bg-slate-900 text-white", white: "bg-white text-slate-900 shadow" };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", t[tone], className)}>{children}</span>;
}
function LiveDot({ color = "bg-emerald-400" }) { return <span className="relative inline-flex h-2.5 w-2.5"><span className={cx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)} /><span className={cx("relative inline-flex rounded-full h-2.5 w-2.5", color)} /></span>; }
function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => { if (!open) return; const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(8,18,32,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className={cx("relative w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl tb-up", wide ? "sm:max-w-4xl" : "sm:max-w-lg")} style={{ maxHeight: "92vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function LotImage({ lot, v = 0 }) { return <div className="absolute inset-0"><BoatArt kind={lot.cat} pal={lot.pal} v={v} /></div>; }
function myStatus(l) {
  if (!l.bids.some((b) => b.b === "me") && !l.proxies.me) return null;
  if (l.phase === "live") return l.leader === "me" ? "leading" : "outbid";
  if (l.leader !== "me") return "lost";
  return { pending: "pending", awarded: "won", declined: "declined" }[l.phase] || null;
}
const STATUS = { leading: ["emerald", "You're leading"], outbid: ["rose", "Outbid"], lost: ["slate", "Not won"], pending: ["amber", "Awaiting seller"], won: ["emerald", "Won"], declined: ["slate", "Not awarded"] };
function PhaseChip({ lot }) {
  const m = { pending: ["amber", "Awaiting seller"], awarded: ["emerald", "Sold"], declined: ["slate", "Not awarded"], unsold: ["slate", "No bids"] }[lot.phase];
  return m ? <Pill tone={m[0]}>{m[1]}</Pill> : null;
}
function TimeLeft({ lot, now, className = "" }) {
  if (lot.phase !== "live") return <PhaseChip lot={lot} />;
  const rem = lot.endsAt - now;
  return <span className={cx("tabular-nums font-bold", rem < CONFIG.softWindow ? "text-orange-600" : rem < HOUR ? "text-amber-700" : "text-slate-800", className)}>{countdown(rem)}</span>;
}

/* ============ CARDS ============ */
function LotCard({ lot, ctx }) {
  const { now, state, dispatch, go } = ctx;
  const st = myStatus(lot), live = lot.phase === "live", rem = lot.endsAt - now, hasBids = lot.bids.length > 0;
  return (
    <article onClick={() => go({ name: "lot", id: lot.id })} className="group cursor-pointer rounded-3xl bg-white border border-stone-200 overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition duration-300">
      <div className="relative" style={{ aspectRatio: "4 / 3" }}>
        <LotImage lot={lot} />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {lot.noRes && <Pill tone="white">No reserve</Pill>}
          {lot.auction === "flash" && live && <Pill tone="dark"><Zap size={12} />Flash</Pill>}
        </div>
        <button type="button" aria-label={state.watch[lot.id] ? "Remove from watchlist" : "Add to watchlist"} onClick={(e) => { e.stopPropagation(); dispatch({ type: "WATCH", lotId: lot.id }); }}
          className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white shadow hover:scale-110 transition">
          <Heart size={16} className={state.watch[lot.id] ? "text-rose-500" : "text-slate-600"} fill={state.watch[lot.id] ? "currentColor" : "none"} />
        </button>
        {live && rem < HOUR && <div className="absolute bottom-3 left-3"><Pill tone="orange"><Timer size={12} />Closing {countdown(rem)}</Pill></div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-slate-900 leading-tight">{T(lot)}</h3>
          <span className="text-xs text-slate-400 tabular-nums">#{lot.no}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500 flex items-center gap-1 truncate"><MapPin size={13} />{lot.city}, {COUNTRY[lot.cc]}</p>
        <p className="mt-0.5 text-xs text-slate-500">{lot.year} · {meters(lot.len)} · {lot.mat}</p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <div className="text-xs text-slate-500">{live ? (hasBids ? "Current bid" : "Starting bid") : "Final bid"}</div>
            <div className="text-xl font-extrabold text-slate-900 tabular-nums">{money(hasBids ? lot.price : lot.start)}</div>
            <div className="text-xs text-slate-500">{lot.bids.length} bid{lot.bids.length === 1 ? "" : "s"}</div>
          </div>
          <div className="text-right">{live && <div className="text-xs text-slate-500">Closes in</div>}<TimeLeft lot={lot} now={now} /></div>
        </div>
        {st && <div className="mt-3"><Pill tone={STATUS[st][0]}>{STATUS[st][1]}</Pill></div>}
      </div>
    </article>
  );
}

/* ============ HEADER / FOOTER / TOASTS ============ */
function Header({ ctx, onAuth }) {
  const { state, go, route, dispatch, now } = ctx;
  const [q, setQ] = useState(""); const [notes, setNotes] = useState(false); const [acct, setAcct] = useState(false);
  const unread = state.notes.filter((n) => !n.read).length;
  const watchN = Object.values(state.watch).filter(Boolean).length;
  const nav = [{ l: "Auctions", r: { name: "catalog", tab: "live" }, on: route.name === "catalog" || route.name === "lot" }, { l: "How it works", r: { name: "how" }, on: route.name === "how" }, { l: "My bids", r: { name: "mine" }, on: route.name === "mine" }];
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200" style={{ background: "rgba(247,245,240,0.86)", backdropFilter: "saturate(180%) blur(14px)", WebkitBackdropFilter: "saturate(180%) blur(14px)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
        <button type="button" onClick={() => go({ name: "home" })} className="flex items-center gap-2 flex-shrink-0" aria-label={`${BRAND} home`}>
          <span className="w-9 h-9 rounded-2xl bg-slate-900 text-white grid place-items-center"><Anchor size={18} /></span>
          <span className="text-xl font-bold tracking-tight text-slate-900" style={{ fontFamily: SERIF }}>{BRAND}</span>
        </button>
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {nav.map((n) => <button type="button" key={n.l} onClick={() => go(n.r)} className={cx("px-3 py-2 rounded-full text-sm font-medium transition", n.on ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900 hover:bg-white")}>{n.l}</button>)}
        </nav>
        <div className="hidden lg:flex flex-1 max-w-sm ml-auto items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go({ name: "catalog", tab: "live", q: q.trim() }); }} placeholder="Search brand, model, harbour…  ↵" className="flex-1 bg-transparent outline-none text-sm" aria-label="Search lots" />
        </div>
        <div className="flex items-center gap-1 ml-auto lg:ml-0">
          <button type="button" aria-label="Watchlist" onClick={() => go({ name: "mine" })} className="relative w-10 h-10 grid place-items-center rounded-full hover:bg-white">
            <Heart size={18} />{watchN > 0 && <span className="absolute top-0.5 right-0.5 text-white bg-slate-900 rounded-full font-bold px-1.5" style={{ fontSize: 10 }}>{watchN}</span>}
          </button>
          <div className="relative">
            <button type="button" aria-label="Notifications" onClick={() => { setNotes(!notes); setAcct(false); }} className="relative w-10 h-10 grid place-items-center rounded-full hover:bg-white">
              <Bell size={18} />{unread > 0 && <span className="absolute top-0.5 right-0.5 text-white bg-orange-500 rounded-full font-bold px-1.5" style={{ fontSize: 10 }}>{unread}</span>}
            </button>
            {notes && (<>
              <div className="fixed inset-0 z-40" onClick={() => setNotes(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden tb-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100"><b className="text-sm">Notifications</b><button type="button" className="text-xs font-semibold text-teal-700" onClick={() => dispatch({ type: "READ" })}>Mark all read</button></div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                  {state.notes.length === 0 && <p className="p-6 text-sm text-slate-500 text-center">No notifications yet. Watch a lot or place a bid.</p>}
                  {state.notes.slice(0, 25).map((n) => (
                    <button type="button" key={n.id} onClick={() => { setNotes(false); if (n.lotId) go({ name: "lot", id: n.lotId }); }} className={cx("w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-stone-50", !n.read && "bg-teal-50")}>
                      <div className="text-sm font-semibold text-slate-900">{n.title}</div><div className="text-xs text-slate-600">{n.body}</div><div className="text-xs text-slate-400 mt-1">{ago(now - n.ts)}</div>
                    </button>))}
                </div>
              </div></>)}
          </div>
          {state.user ? (
            <div className="relative">
              <button type="button" onClick={() => { setAcct(!acct); setNotes(false); }} className="ml-1 w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-sm grid place-items-center" aria-label="Account">{state.user.name.slice(0, 1).toUpperCase()}</button>
              {acct && (<>
                <div className="fixed inset-0 z-40" onClick={() => setAcct(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 p-2 tb-up">
                  <div className="px-3 py-2"><div className="font-semibold text-sm">{state.user.name}</div><div className="text-xs text-slate-500">{state.user.email}</div>
                    <div className="mt-2">{state.user.verified ? <Pill tone="emerald"><BadgeCheck size={12} />ID verified</Pill> : <Pill tone="amber">ID not verified</Pill>}</div></div>
                  <button type="button" onClick={() => { setAcct(false); go({ name: "mine" }); }} className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-stone-100 flex items-center gap-2"><Gavel size={15} />My bids & watchlist</button>
                  <button type="button" onClick={() => { setAcct(false); dispatch({ type: "LOGOUT" }); }} className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-stone-100 flex items-center gap-2"><LogOut size={15} />Sign out</button>
                </div></>)}
            </div>
          ) : <Btn size="sm" className="ml-1" onClick={onAuth}>Sign in</Btn>}
        </div>
      </div>
      <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
        {nav.map((n) => <button type="button" key={n.l} onClick={() => go(n.r)} className={cx("px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap", n.on ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-stone-200")}>{n.l}</button>)}
      </div>
    </header>
  );
}

function Toasts({ items, go }) {
  const tone = { outbid: "border-rose-400", won: "border-emerald-500", ok: "border-emerald-500", auto: "border-teal-500", error: "border-rose-500", ext: "border-orange-400", soon: "border-amber-400", pending: "border-amber-400" };
  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-50 flex flex-col gap-2 w-80" aria-live="polite">
      {items.map((t) => (
        <button type="button" key={t.id} onClick={() => t.lotId && go({ name: "lot", id: t.lotId })} className={cx("text-left bg-white rounded-2xl shadow-2xl border-l-4 px-4 py-3 tb-in", tone[t.kind] || "border-slate-400")}>
          <div className="text-sm font-bold text-slate-900">{t.title}</div>{t.body && <div className="text-xs text-slate-600 mt-0.5">{t.body}</div>}
        </button>))}
    </div>
  );
}

function DemoDock({ ctx }) {
  const { state, dispatch } = ctx; const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 z-40">
      {open && (
        <div className="mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 p-4 text-sm tb-up">
          <b>Demo controls</b>
          <p className="text-xs text-slate-500 mt-1">Simulated bidders compete with you. In production these are real users over WebSockets.</p>
          <label className="mt-3 flex items-center justify-between"><span className="flex items-center gap-2"><Bot size={15} />Simulated bidders</span>
            <input type="checkbox" checked={state.bots} onChange={(e) => dispatch({ type: "BOTS", on: e.target.checked })} style={{ accentColor: "#0d9488" }} /></label>
          <Btn variant="outline" size="sm" className="mt-3 w-full" onClick={() => dispatch({ type: "RESET", now: Date.now() })}><RotateCcw size={14} />Restart auctions</Btn>
        </div>)}
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-slate-900 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-xl"><Activity size={14} />Demo {state.bots ? "· live" : "· paused"}</button>
    </div>
  );
}

function Footer({ go }) {
  return (
    <footer className="mt-20 text-slate-300" style={{ background: "#0B1F33" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div><div className="flex items-center gap-2 text-white"><Anchor size={18} /><span className="text-xl font-bold" style={{ fontFamily: SERIF }}>{BRAND}</span></div>
          <p className="mt-3 text-slate-400">The online auction house for boats. Monthly auctions, viewing days, bailiff-supervised closing, escrow-protected payment.</p></div>
        <div><b className="text-white">Buy</b><div className="mt-3 space-y-2">
          <button type="button" className="block hover:text-white" onClick={() => go({ name: "catalog", tab: "live" })}>All live lots</button>
          <button type="button" className="block hover:text-white" onClick={() => go({ name: "catalog", tab: "flash" })}>Flash auction</button>
          <button type="button" className="block hover:text-white" onClick={() => go({ name: "catalog", tab: "results" })}>Results</button></div></div>
        <div><b className="text-white">Learn</b><div className="mt-3 space-y-2">
          <button type="button" className="block hover:text-white" onClick={() => go({ name: "how" })}>How bidding works</button>
          <button type="button" className="block hover:text-white" onClick={() => go({ name: "how" })}>Fees & costs</button></div></div>
        <div><b className="text-white">Trust</b><p className="mt-3 text-slate-400">Closings supervised by a court bailiff. Buyer payments held in a third-party (escrow) account until handover.</p></div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} {BRAND} · Prototype · Prices in EUR · Public auction: no statutory right of withdrawal</div>
    </footer>
  );
}

/* ============ HOME ============ */
function Home({ ctx }) {
  const { state, now, go } = ctx;
  const all = Object.values(state.lots);
  const live = all.filter((l) => l.phase === "live").sort((a, b) => a.endsAt - b.endsAt);
  const spot = all.find((l) => l.spot && l.phase === "live") || live[0];
  const results = all.filter((l) => ["awarded", "declined", "pending", "unsold"].includes(l.phase)).sort((a, b) => b.closedAt - a.closedAt).slice(0, 4);
  const totalBids = live.reduce((s, l) => s + l.bids.length, 0);
  return (
    <div>
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg,#0B1F33 0%,#0E3350 55%,#0F4C5C 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 text-white">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)" }}><LiveDot />{live.length} lots live{live[0] && <> · next closing in <b className="tabular-nums">{countdown(live[0].endsAt - now)}</b></>}</span>
            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none" style={{ fontFamily: SERIF }}>The auction<br />house <span style={{ color: "#7FE0D6" }}>for boats.</span></h1>
            <p className="mt-6 text-lg text-slate-300 max-w-xl">Monthly online auctions for motorboats, sailboats, sloeps and RIBs across Europe. Inspect on viewing day, bid in real time, pay safely through escrow.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="light" size="lg" onClick={() => go({ name: "catalog", tab: "live" })}>Browse live lots <ArrowRight size={18} /></Btn>
              <Btn size="lg" className="border border-slate-500" onClick={() => go({ name: "how" })}>How it works</Btn>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[[live.length, "live lots"], [totalBids, "bids placed"], [Object.keys(COUNTRY).length, "countries"]].map(([n, l]) => <div key={l}><div className="text-3xl font-bold tabular-nums">{n}</div><div className="text-xs text-slate-400">{l}</div></div>)}
            </div>
          </div>
          {spot && (
            <div className="lg:col-span-6">
              <div onClick={() => go({ name: "lot", id: spot.id })} className="relative rounded-3xl overflow-hidden shadow-2xl cursor-pointer" style={{ aspectRatio: "5 / 4" }}>
                <LotImage lot={spot} />
                <div className="absolute top-4 left-4"><Pill tone="white"><Zap size={12} />Spotlight</Pill></div>
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl p-4 flex items-end justify-between gap-4" style={{ background: "rgba(255,255,255,0.86)", backdropFilter: "blur(12px)" }}>
                  <div className="min-w-0"><div className="font-bold text-slate-900 truncate">{T(spot)}</div><div className="text-xs text-slate-600">{spot.city}, {COUNTRY[spot.cc]} · {spot.year} · {meters(spot.len)}</div>
                    <div className="mt-2 text-2xl font-extrabold tabular-nums">{money(spot.bids.length ? spot.price : spot.start)}</div></div>
                  <div className="text-right flex-shrink-0"><div className="text-xs text-slate-500">Closes in</div><TimeLeft lot={spot} now={now} /><div className="mt-2"><Btn size="sm" variant="accent">Bid now</Btn></div></div>
                </div>
              </div>
            </div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="flex items-end justify-between"><div><h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>Closing next</h2><p className="text-slate-500 text-sm mt-1">Lots close one after another — follow every final minute.</p></div>
          <Btn variant="outline" size="sm" onClick={() => go({ name: "catalog", tab: "live" })}>See all <ArrowRight size={14} /></Btn></div>
        <div className="mt-6 flex gap-5 overflow-x-auto pb-4 tb-noscroll">
          {live.slice(0, 8).map((l) => <div key={l.id} className="w-72 flex-shrink-0"><LotCard lot={l} ctx={ctx} /></div>)}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>Browse by type</h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATS.map((c, i) => { const n = live.filter((l) => l.cat === c.id).length; return (
            <button type="button" key={c.id} onClick={() => go({ name: "catalog", tab: "live", cat: c.id })} className="text-left rounded-3xl overflow-hidden bg-white border border-stone-200 hover:shadow-lg transition">
              <div className="relative" style={{ aspectRatio: "4 / 3" }}><div className="absolute inset-0"><BoatArt kind={c.id} pal={i % 4} v={3} /></div></div>
              <div className="p-3"><div className="font-semibold text-slate-900 text-sm">{c.label}</div><div className="text-xs text-slate-500">{n} live</div></div>
            </button>); })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 grid md:grid-cols-6 gap-4">
        {[
          { c: "md:col-span-3", i: <Eye size={20} />, t: "Viewing day before every auction", d: "The Saturday before closing, 10:00–12:00, with the owner on board. See it, touch it, then bid with confidence." },
          { c: "md:col-span-3", i: <ShieldCheck size={20} />, t: "Bailiff-supervised closing", d: "An independent court bailiff oversees the closing and the bid log, so every bid is authentic." },
          { c: "md:col-span-2", i: <Timer size={20} />, t: "Soft close — no sniping", d: "A bid in the final 5 minutes keeps the lot open 5 more minutes." },
          { c: "md:col-span-2", i: <Lock size={20} />, t: "Escrow-protected payment", d: "Your money sits in a third-party account until the boat is handed over." },
          { c: "md:col-span-2", i: <Scale size={20} />, t: "Transparent costs", d: "Premium, VAT and total are shown before you confirm any bid." },
        ].map((b) => (
          <div key={b.t} className={cx("rounded-3xl bg-white border border-stone-200 p-6", b.c)}>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 grid place-items-center">{b.i}</div>
            <h3 className="mt-4 font-bold text-slate-900">{b.t}</h3><p className="mt-1 text-sm text-slate-600">{b.d}</p>
          </div>))}
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-stone-200 p-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><LiveDot />Live activity</h3>
          <div className="mt-4 divide-y divide-stone-100">
            {state.activity.length === 0 && <p className="text-sm text-slate-500 py-4">Bids will appear here in real time…</p>}
            {state.activity.slice(0, 7).map((x) => { const l = state.lots[x.lotId]; return (
              <button type="button" key={x.lotId + "-" + x.id} onClick={() => go({ name: "lot", id: x.lotId })} className="w-full flex items-center justify-between py-2.5 text-sm text-left tb-in">
                <span className="truncate"><b>{who(x.b)}</b> <span className="text-slate-500">bid on</span> {T(l)}</span>
                <span className="flex items-center gap-3 flex-shrink-0"><b className="tabular-nums">{money(x.amt)}</b><span className="text-xs text-slate-400 w-14 text-right">{ago(now - x.ts)}</span></span>
              </button>); })}
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-stone-200 p-6">
          <h3 className="font-bold text-slate-900">Recent results</h3>
          <div className="mt-4 divide-y divide-stone-100">
            {results.map((l) => (
              <button type="button" key={l.id} onClick={() => go({ name: "lot", id: l.id })} className="w-full flex items-center justify-between py-2.5 text-sm text-left">
                <span className="truncate">{T(l)} <span className="text-slate-400">· {l.bids.length} bids</span></span>
                <span className="flex items-center gap-3"><b className="tabular-nums">{money(l.price || 0)}</b><PhaseChip lot={l} /></span>
              </button>))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============ CATALOG ============ */
function Catalog({ ctx }) {
  const { state, now, route, go } = ctx;
  const [tab, setTab] = useState(route.tab || "live");
  const [q, setQ] = useState(route.q || "");
  const [cats, setCats] = useState(route.cat ? [route.cat] : []);
  const [ccs, setCcs] = useState([]);
  const [rng, setRng] = useState({ pmin: "", pmax: "", lmin: "", lmax: "", ymin: "", ymax: "" });
  const [fl, setFl] = useState({ noRes: false, trailer: false, soon: false });
  const [sort, setSort] = useState("end");
  const [showF, setShowF] = useState(false);
  useEffect(() => { setTab(route.tab || "live"); if (route.q != null) setQ(route.q); if (route.cat) setCats([route.cat]); }, [route.tab, route.q, route.cat]);
  const all = Object.values(state.lots);
  const inTab = (l) => tab === "results" ? l.phase !== "live" : l.phase === "live" && (tab === "live" || l.auction === tab);
  const price = (l) => (l.bids.length ? l.price : l.start);
  const n = (v) => (v === "" ? null : Number(v));
  const ql = q.trim().toLowerCase();
  const pass = (l, ignoreCat) => {
    if (ql && !`${T(l)} ${l.city} ${COUNTRY[l.cc]} ${CAT[l.cat].label} ${l.no}`.toLowerCase().includes(ql)) return false;
    if (!ignoreCat && cats.length && !cats.includes(l.cat)) return false;
    if (ccs.length && !ccs.includes(l.cc)) return false;
    const p = price(l);
    if (n(rng.pmin) != null && p < n(rng.pmin)) return false; if (n(rng.pmax) != null && p > n(rng.pmax)) return false;
    if (n(rng.lmin) != null && l.len < n(rng.lmin) * 100) return false; if (n(rng.lmax) != null && l.len > n(rng.lmax) * 100) return false;
    if (n(rng.ymin) != null && l.year < n(rng.ymin)) return false; if (n(rng.ymax) != null && l.year > n(rng.ymax)) return false;
    if (fl.noRes && !l.noRes) return false; if (fl.trailer && !l.trailer) return false;
    if (fl.soon && !(l.phase === "live" && l.endsAt - now < DAY)) return false;
    return true;
  };
  const sorters = { end: (a, b) => (tab === "results" ? b.closedAt - a.closedAt : a.endsAt - b.endsAt), plow: (a, b) => price(a) - price(b), phigh: (a, b) => price(b) - price(a), bids: (a, b) => b.bids.length - a.bids.length, len: (a, b) => b.len - a.len, year: (a, b) => b.year - a.year };
  const list = all.filter((l) => inTab(l) && pass(l)).sort(sorters[sort]);
  const tabs = [["live", "All live"], ["flash", "Flash auction"], ["main", "Monthly auction"], ["results", "Results"]];
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const active = cats.length + ccs.length + Object.values(rng).filter(Boolean).length + Object.values(fl).filter(Boolean).length + (ql ? 1 : 0);
  const clear = () => { setCats([]); setCcs([]); setRng({ pmin: "", pmax: "", lmin: "", lmax: "", ymin: "", ymax: "" }); setFl({ noRes: false, trailer: false, soon: false }); setQ(""); };
  const main = state.main;
  const rangeRow = (label, a, b) => (
    <div><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        <input inputMode="numeric" value={rng[a]} onChange={(e) => setRng({ ...rng, [a]: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Min" aria-label={label + " minimum"} className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
        <input inputMode="numeric" value={rng[b]} onChange={(e) => setRng({ ...rng, [b]: e.target.value.replace(/[^\d.]/g, "") })} placeholder="Max" aria-label={label + " maximum"} className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
      </div></div>);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>{tab === "flash" ? "Flash auction" : tab === "main" ? `${new Date(main.close).toLocaleString("en-GB", { month: "long" })} auction` : tab === "results" ? "Results" : "All live lots"}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tab === "flash" && "Demo auction · one lot closes every minute · soft close applies"}
            {tab === "main" && <>Closes {fmtDay(main.close)} from 20:00, one lot per minute · Viewing day {fmtDay(main.view)}, 10:00–12:00</>}
            {tab === "live" && "Every lot currently open for bidding, across all auctions"}
            {tab === "results" && "Closed lots and their outcome"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 w-full sm:w-80">
          <Search size={16} className="text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this auction…" className="flex-1 outline-none text-sm bg-transparent" aria-label="Search" />
          {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search"><X size={14} /></button>}
        </div>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto tb-noscroll">
        {tabs.map(([id, label]) => { const c = all.filter((l) => (id === "results" ? l.phase !== "live" : l.phase === "live" && (id === "live" || l.auction === id))).length; return (
          <button type="button" key={id} onClick={() => { setTab(id); go({ name: "catalog", tab: id }); }} className={cx("px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition", tab === id ? "bg-slate-900 text-white" : "bg-white border border-stone-200 text-slate-700 hover:border-slate-400")}>{label} <span className="opacity-60">{c}</span></button>); })}
      </div>
      <div className="mt-6 grid lg:grid-cols-12 gap-6">
        <aside className={cx("lg:col-span-3 space-y-6", showF ? "block" : "hidden lg:block")}>
          <div className="rounded-3xl bg-white border border-stone-200 p-5 space-y-6">
            <div><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</div>
              <div className="mt-2 flex flex-wrap gap-2">{CATS.map((c) => { const k = all.filter((l) => inTab(l) && l.cat === c.id && pass(l, true)).length; const on = cats.includes(c.id); return (
                <button type="button" key={c.id} onClick={() => toggle(cats, setCats, c.id)} className={cx("px-3 py-1.5 rounded-full text-xs font-semibold border transition", on ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-stone-200 text-slate-700 hover:border-slate-400")}>{c.label} <span className="opacity-60">{k}</span></button>); })}</div></div>
            {rangeRow("Current bid (€)", "pmin", "pmax")}
            {rangeRow("Length (m)", "lmin", "lmax")}
            {rangeRow("Year built", "ymin", "ymax")}
            <div><div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Country</div>
              <div className="mt-2 flex flex-wrap gap-2">{Object.entries(COUNTRY).map(([k, v]) => <button type="button" key={k} onClick={() => toggle(ccs, setCcs, k)} className={cx("px-3 py-1.5 rounded-full text-xs font-semibold border", ccs.includes(k) ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-stone-200 text-slate-700")}>{v}</button>)}</div></div>
            <div className="space-y-2">
              {[["noRes", "No reserve only"], ["trailer", "Trailer included"], ["soon", "Closing within 24h"]].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={fl[k]} onChange={(e) => setFl({ ...fl, [k]: e.target.checked })} style={{ accentColor: "#0d9488" }} />{l}</label>))}
            </div>
            {active > 0 && <Btn variant="outline" size="sm" className="w-full" onClick={clear}>Clear all filters ({active})</Btn>}
          </div>
        </aside>
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Btn variant="outline" size="sm" className="lg:hidden" onClick={() => setShowF(!showF)}><SlidersHorizontal size={14} />Filters{active ? ` (${active})` : ""}</Btn>
              <span className="text-sm text-slate-500">{list.length} lot{list.length === 1 ? "" : "s"}</span>
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm" aria-label="Sort">
              <option value="end">{tab === "results" ? "Most recent" : "Closing soonest"}</option><option value="plow">Price: low to high</option><option value="phigh">Price: high to low</option>
              <option value="bids">Most bids</option><option value="len">Longest</option><option value="year">Newest build</option>
            </select>
          </div>
          {list.length === 0 ? (
            <div className="rounded-3xl bg-white border border-dashed border-stone-300 p-12 text-center"><Search className="mx-auto text-slate-300" size={36} /><p className="mt-3 font-semibold text-slate-700">No lots match these filters</p><Btn variant="outline" size="sm" className="mt-4" onClick={clear}>Clear filters</Btn></div>
          ) : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{list.map((l) => <LotCard key={l.id} lot={l} ctx={ctx} />)}</div>}
        </div>
      </div>
    </div>
  );
}

/* ============ LOT PAGE ============ */
function LotPage({ ctx }) {
  const { state, now, dispatch, go, route, flash } = ctx;
  const lot = state.lots[route.id];
  const [img, setImg] = useState(0); const [lb, setLb] = useState(false); const [tab, setTab] = useState("overview");
  const panel = useRef(null);
  useEffect(() => { if (state.lots[route.id]) dispatch({ type: "VIEW", lotId: route.id }); setImg(0); setTab("overview"); }, [route.id]);
  if (!lot) return <div className="max-w-xl mx-auto py-24 text-center"><h1 className="text-2xl font-bold">Lot not found</h1><Btn className="mt-6" onClick={() => go({ name: "catalog", tab: "live" })}>Back to auctions</Btn></div>;
  const live = lot.phase === "live", watched = !!state.watch[lot.id];
  const similar = Object.values(state.lots).filter((l) => l.id !== lot.id && l.phase === "live" && (l.cat === lot.cat || Math.abs(l.start - lot.start) < lot.start * 0.4)).slice(0, 4);
  const share = async () => { const url = `https://${BRAND.toLowerCase()}.com/lot/${lot.no}`; try { await navigator.clipboard.writeText(url); flash("Link copied", url); } catch (e) { flash("Share this lot", url); } };
  const facts = [["Year", lot.year], ["Length", meters(lot.len)], ["Beam", meters(lot.beam)], ["Draught", meters(lot.draft)], ["Material", lot.mat], ["Engine", lot.eng.n ? `${lot.eng.n > 1 ? "2× " : ""}${lot.eng.brand} ${lot.eng.hp} hp` : "None"], ["Berths", lot.berths || "—"], ["Status", COND[lot.cond]]];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 lg:pb-8">
      <div className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
        <button type="button" className="hover:text-slate-900" onClick={() => go({ name: "catalog", tab: "live" })}>Auctions</button><ChevronRight size={14} />
        <button type="button" className="hover:text-slate-900" onClick={() => go({ name: "catalog", tab: "live", cat: lot.cat })}>{CAT[lot.cat].label}</button><ChevronRight size={14} /><span>Lot {lot.no}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>{T(lot)}</h1>
          <p className="mt-1 text-slate-500 flex items-center gap-1.5 flex-wrap"><MapPin size={15} />{lot.city}, {COUNTRY[lot.cc]} · {CAT[lot.cat].one} · {lot.year}
            <span className="flex items-center gap-1 ml-2 text-xs"><Eye size={13} />{lot.views.toLocaleString("en-GB")}</span><span className="flex items-center gap-1 text-xs"><Heart size={13} />{lot.watchers}</span></p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" onClick={() => dispatch({ type: "WATCH", lotId: lot.id })}><Heart size={14} className={watched ? "text-rose-500" : ""} fill={watched ? "currentColor" : "none"} />{watched ? "Watching" : "Watch"}</Btn>
          <Btn variant="outline" size="sm" onClick={share}><Share2 size={14} />Share</Btn>
        </div>
      </div>
      <div className="mt-6 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 min-w-0">
          <div className="relative rounded-3xl overflow-hidden bg-slate-200 cursor-pointer" style={{ aspectRatio: "16 / 10" }} onClick={() => setLb(true)}>
            <div className="absolute inset-0"><BoatArt kind={lot.cat} pal={lot.pal} v={img} /></div>
            <div className="absolute top-4 left-4 flex gap-2">{lot.noRes && <Pill tone="white">No reserve</Pill>}{lot.vat > 0 && <Pill tone="white">VAT on hammer</Pill>}</div>
            <div className="absolute bottom-4 right-4"><Pill tone="dark">{img + 1} / {VIEWS.length}</Pill></div>
            {[[-1, "left-3", ChevronLeft], [1, "right-3", ChevronRight]].map(([d, pos, Icon]) => (
              <button type="button" key={d} aria-label={d < 0 ? "Previous image" : "Next image"} onClick={(e) => { e.stopPropagation(); setImg((img + d + VIEWS.length) % VIEWS.length); }} className={cx("absolute top-1/2 w-10 h-10 -mt-5 rounded-full bg-white shadow grid place-items-center", pos)}><Icon size={18} /></button>))}
          </div>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {VIEWS.map((_, i) => <button type="button" key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={cx("relative rounded-xl overflow-hidden ring-2 transition", img === i ? "ring-teal-600" : "ring-transparent opacity-70 hover:opacity-100")} style={{ aspectRatio: "4 / 3" }}><div className="absolute inset-0"><BoatArt kind={lot.cat} pal={lot.pal} v={i} /></div></button>)}
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {facts.map(([k, v]) => <div key={k} className="rounded-2xl bg-white border border-stone-200 px-4 py-3"><div className="text-xs text-slate-500">{k}</div><div className="font-semibold text-slate-900 text-sm truncate">{v}</div></div>)}
          </div>
          <div className="lg:hidden mt-6" ref={panel}><BidPanel lot={lot} ctx={ctx} /></div>
          <div className="mt-8 flex gap-1 border-b border-stone-200 overflow-x-auto tb-noscroll">
            {[["overview", "Overview"], ["specs", "Specifications"], ["viewing", "Viewing day"], ["location", "Location"]].map(([id, l]) => (
              <button type="button" key={id} onClick={() => setTab(id)} className={cx("px-4 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap", tab === id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800")}>{l}</button>))}
          </div>
          <div className="pt-6">
            {tab === "overview" && <div className="space-y-6">
              {describe(lot).map((s) => <section key={s.h}><h2 className="text-lg font-bold text-slate-900">{s.h}</h2><p className="mt-1.5 text-slate-700 leading-relaxed">{s.p}</p></section>)}
              <div className="flex flex-wrap gap-2">{lot.feat.map((f) => <Pill key={f} tone="teal"><Check size={12} />{f}</Pill>)}</div>
            </div>}
            {tab === "specs" && <Specs lot={lot} />}
            {tab === "viewing" && <Viewing lot={lot} ctx={ctx} />}
            {tab === "location" && <LocationBox lot={lot} />}
          </div>
        </div>
        <aside className="hidden lg:block lg:col-span-4"><div className="sticky top-24 space-y-4"><BidPanel lot={lot} ctx={ctx} /><TrustBox /></div></aside>
      </div>
      {similar.length > 0 && <section className="mt-14"><h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>You may also like</h2>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{similar.map((l) => <LotCard key={l.id} lot={l} ctx={ctx} />)}</div></section>}
      {live && <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between shadow-2xl">
        <div><div className="text-xs text-slate-500">{lot.bids.length ? "Current bid" : "Starting bid"} · <TimeLeft lot={lot} now={now} /></div><div className="text-lg font-extrabold tabular-nums">{money(lot.bids.length ? lot.price : lot.start)}</div></div>
        <Btn variant="accent" onClick={() => panel.current && panel.current.scrollIntoView({ behavior: "smooth", block: "start" })}><Gavel size={16} />Bid</Btn>
      </div>}
      <Modal open={lb} onClose={() => setLb(false)} title={`${T(lot)} · ${img + 1}/${VIEWS.length}`} wide>
        <div className="relative bg-slate-900" style={{ aspectRatio: "16 / 10" }}><div className="absolute inset-0"><BoatArt kind={lot.cat} pal={lot.pal} v={img} /></div>
          {[[-1, "left-3", ChevronLeft], [1, "right-3", ChevronRight]].map(([d, pos, Icon]) => <button type="button" key={d} aria-label="Change image" onClick={() => setImg((img + d + VIEWS.length) % VIEWS.length)} className={cx("absolute top-1/2 -mt-6 w-12 h-12 rounded-full bg-white shadow grid place-items-center", pos)}><Icon size={20} /></button>)}
        </div>
      </Modal>
    </div>
  );
}

function BidPanel({ lot, ctx }) {
  const { now, dispatch, requireAuth } = ctx;
  const [mode, setMode] = useState("single"); const [val, setVal] = useState(""); const [err, setErr] = useState(""); const [review, setReview] = useState(null); const [all, setAll] = useState(false);
  useEffect(() => setErr(""), [val, mode]);
  const live = lot.phase === "live" && lot.endsAt > now, need = nextMin(lot), mine = lot.proxies.me, isLeader = lot.leader === "me";
  const def = mode === "single" ? need : need + step(need) * 2;
  const amount = val === "" ? def : parseInt(val, 10), st = myStatus(lot), rem = lot.endsAt - now, rate = premiumRate(lot.start);
  const check = (m, a) => {
    if (!(lot.phase === "live" && lot.endsAt > Date.now())) return "Bidding on this lot has closed.";
    if (!Number.isInteger(a) || a <= 0) return "Enter an amount in whole euros.";
    const nm = nextMin(lot);
    if (m === "single" && a < nm) return `The minimum bid is ${money(nm)}.`;
    if (m === "auto") { if (lot.leader === "me") { const f = Math.max(lot.price, lot.proxies.me ? lot.proxies.me.max : 0); if (a <= f) return `Set a maximum above ${money(f)}.`; } else if (a < nm) return `Your maximum must be at least ${money(nm)}.`; }
    return "";
  };
  const open = () => { const e = check(mode, amount); if (e) return setErr(e); requireAuth(() => setReview({ mode, amount })); };
  const chips = mode === "single" ? [need, need + step(need), need + step(need) * 3] : [need + step(need) * 2, need + step(need) * 5, need + step(need) * 10];
  const hist = lot.bids.slice().reverse();
  return (
    <div className="rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden">
      <div className={cx("px-5 py-3 flex items-center justify-between text-sm", live && rem < CONFIG.softWindow ? "bg-orange-50" : "bg-stone-50")}>
        {live ? <><span className="flex items-center gap-2 font-semibold text-slate-700"><Clock size={15} />Closes in</span><TimeLeft lot={lot} now={now} className="text-lg" /></> : <><span className="font-semibold text-slate-700">Bidding closed</span><PhaseChip lot={lot} /></>}
      </div>
      {live && <div className="px-5 pt-1 text-xs text-slate-500">{fmtDT(lot.endsAt)}{lot.ext > 0 && <span className="text-orange-600 font-semibold"> · extended ×{lot.ext}</span>}</div>}
      <div className="p-5">
        <div className="flex items-end justify-between">
          <div><div className="text-xs text-slate-500">{lot.bids.length ? (live ? "Current bid" : "Final bid") : "Starting bid"}</div>
            <div key={lot.price} className="text-4xl font-extrabold text-slate-900 tabular-nums tb-flash rounded-xl">{money(lot.bids.length ? lot.price : lot.start)}</div></div>
          <div className="text-right text-xs text-slate-500"><div className="font-semibold text-slate-700">{lot.bids.length} bids</div>{lot.noRes ? "No reserve" : "Subject to seller acceptance"}</div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Excl. {Math.round(rate * 100)}% buyer's premium + {Math.round(CONFIG.vatPremium * 100)}% VAT on the premium{lot.vat ? ` · ${lot.vat * 100}% VAT on the bid` : ""}.</p>
        {st && <div className={cx("mt-4 rounded-2xl px-4 py-3 text-sm", st === "leading" || st === "won" ? "bg-emerald-50 text-emerald-800" : st === "pending" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-800")}>
          <div className="font-bold flex items-center gap-2">{st === "leading" || st === "won" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{STATUS[st][1]}</div>
          {mine && live && isLeader && <div className="mt-1 flex items-center justify-between gap-2"><span>Auto-bid active up to <b>{money(mine.max)}</b></span><button type="button" className="text-xs font-semibold underline" onClick={() => dispatch({ type: "CANCEL_AUTO", lotId: lot.id, now: Date.now() })}>Cancel</button></div>}
          {st === "pending" && <div className="mt-1 text-xs">The seller has up to {CONFIG.awardHours}h to accept. We'll notify you.</div>}
        </div>}
        {live && <div className="mt-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-full text-sm font-semibold">
            {[["single", "Single bid"], ["auto", "Auto-bid (max)"]].map(([m, l]) => <button type="button" key={m} onClick={() => setMode(m)} className={cx("py-2 rounded-full transition", mode === m ? "bg-white shadow text-slate-900" : "text-slate-500")}>{l}</button>)}
          </div>
          <p className="mt-3 text-xs text-slate-500">{mode === "single" ? "Places exactly this amount, once." : "Set your maximum. We bid the smallest step needed, only when you're outbid."}</p>
          <label className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-stone-200 px-4 py-3 transition">
            <span className="text-slate-400 font-bold">€</span>
            <input inputMode="numeric" aria-label="Bid amount in euros" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") open(); }} placeholder={String(def)} className="flex-1 outline-none text-xl font-bold tabular-nums bg-transparent" />
          </label>
          <div className="mt-2 flex gap-2 flex-wrap">{chips.map((c) => <button type="button" key={c} onClick={() => setVal(String(c))} className="px-3 py-1.5 rounded-full border border-stone-200 text-xs font-semibold hover:border-slate-900 tabular-nums">{money(c)}</button>)}</div>
          <div className="mt-3 text-xs text-slate-500 flex justify-between"><span>Min. {money(need)} · step {money(step(lot.price || lot.start))}</span>{Number.isInteger(amount) && amount > 0 && <span>Total ≈ <b className="text-slate-800">{money(costs(lot, amount).total)}</b></span>}</div>
          {err && <p className="mt-3 text-sm text-rose-600 font-medium">{err}</p>}
          {lot.sellerId === "me" ? <p className="mt-4 text-sm text-slate-500">This is your listing.</p> : <Btn variant="accent" size="lg" className="w-full mt-4" onClick={open}><Gavel size={18} />Review bid</Btn>}
        </div>}
        <div className="mt-6">
          <div className="flex items-center justify-between"><h4 className="font-bold text-slate-900 text-sm">Bid history</h4>{hist.length > 6 && <button type="button" className="text-xs font-semibold text-teal-700" onClick={() => setAll(!all)}>{all ? "Show less" : `Show all ${hist.length}`}</button>}</div>
          <div className="mt-2 divide-y divide-stone-100">
            {hist.length === 0 && <p className="text-sm text-slate-500 py-3">No bids yet — be the first.</p>}
            {(all ? hist : hist.slice(0, 6)).map((b, i, arr) => (
              <div key={b.id} className={cx("flex items-center justify-between py-2 text-sm", i === 0 && "font-semibold")}>
                <span className="flex items-center gap-2"><span className={b.b === "me" ? "text-teal-700" : "text-slate-700"}>{who(b.b)}</span>{b.kind === "auto" && <Pill tone="slate" className="py-0">auto</Pill>}{arr[i + 1] && arr[i + 1].amt === b.amt && <span className="text-xs text-slate-400">tie · earlier max wins</span>}</span>
                <span className="flex items-center gap-3"><span className="tabular-nums">{money(b.amt)}</span><span className="text-xs text-slate-400 w-16 text-right">{ago(now - b.ts)}</span></span>
              </div>))}
          </div>
        </div>
      </div>
      {review && <ReviewModal lot={lot} review={review} ctx={ctx} onClose={() => setReview(null)} onDone={() => { setReview(null); setVal(""); }} check={check} />}
    </div>
  );
}

function ReviewModal({ lot, review, ctx, onClose, onDone, check }) {
  const { state, dispatch } = ctx;
  const [agree, setAgree] = useState(false); const [err, setErr] = useState(""); const [verifying, setVerifying] = useState(false);
  const c = costs(lot, review.amount), needV = lot.start >= CONFIG.verifyFrom && state.user && !state.user.verified;
  const big = review.amount >= nextMin(lot) * 2;
  const place = () => {
    const e = check(review.mode, review.amount); if (e) return setErr(e);
    dispatch({ type: "BID", lotId: lot.id, b: "me", amount: review.amount, mode: review.mode, now: Date.now() }); onDone();
  };
  const verify = () => { setVerifying(true); setTimeout(() => { dispatch({ type: "VERIFY" }); setVerifying(false); }, 1400); };
  const rows = [["Your " + (review.mode === "auto" ? "maximum" : "bid"), money2(c.amount)], [`VAT on the bid (${c.vr * 100}%)`, money2(c.bidVat)], [`Buyer's premium (${Math.round(c.rate * 100)}%)`, money2(c.prem)], [`VAT on premium (${CONFIG.vatPremium * 100}%)`, money2(c.premVat)]];
  return (
    <Modal open onClose={onClose} title="Review your bid">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative w-24 rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: "4 / 3" }}><LotImage lot={lot} /></div>
          <div><div className="font-bold text-slate-900">{T(lot)}</div><div className="text-xs text-slate-500">Lot {lot.no} · closes {fmtDT(lot.endsAt)}</div><div className="mt-1"><Pill tone={review.mode === "auto" ? "teal" : "slate"}>{review.mode === "auto" ? "Auto-bid" : "Single bid"}</Pill></div></div>
        </div>
        {needV ? (
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
            <div className="font-bold flex items-center gap-2"><BadgeCheck size={16} />Identity check required</div>
            <p className="mt-1">Lots starting from {money(CONFIG.verifyFrom)} require a one-time ID verification (passport or ID card + selfie). In production this runs through a KYC provider.</p>
            <Btn variant="primary" className="mt-4" onClick={verify} disabled={verifying}>{verifying ? "Verifying…" : "Verify my identity (demo)"}</Btn>
          </div>
        ) : (<>
          <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm">
            {rows.map(([k, v]) => <div key={k} className="flex justify-between py-1.5"><span className="text-slate-600">{k}</span><span className="tabular-nums">{v}</span></div>)}
            <div className="flex justify-between pt-3 mt-2 border-t border-stone-200 font-bold text-base"><span>{review.mode === "auto" ? "Total if you win at your max" : "Total if you win"}</span><span className="tabular-nums">{money2(c.total)}</span></div>
          </div>
          {review.mode === "auto" && <p className="mt-3 text-xs text-slate-500 flex gap-2"><Info size={14} className="flex-shrink-0" />You'll usually pay less: the system only bids one step above competing bids, up to your maximum.</p>}
          {big && <p className="mt-3 text-xs text-orange-700 flex gap-2"><AlertTriangle size={14} className="flex-shrink-0" />This is well above the minimum of {money(nextMin(lot))}. Double-check the amount.</p>}
          <label className="mt-5 flex gap-3 text-sm text-slate-700"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" style={{ accentColor: "#0d9488" }} />
            <span>I understand my bid is <b>binding</b> and can't be withdrawn. As this is a public auction under bailiff supervision, the right of withdrawal doesn't apply.{lot.noRes ? "" : ` The sale is subject to seller acceptance within ${CONFIG.awardHours}h.`}</span></label>
          {err && <div className="mt-4 rounded-xl bg-rose-50 text-rose-700 text-sm p-3">{err}<div className="mt-2"><Btn size="sm" variant="outline" onClick={onClose}>Update my bid</Btn></div></div>}
          <Btn variant="accent" size="lg" className="w-full mt-5" disabled={!agree} onClick={place}><Lock size={16} />Place binding bid · {money(review.amount)}</Btn>
        </>)}
      </div>
    </Modal>
  );
}

function Specs({ lot }) {
  const c = costs(lot, lot.price || lot.start);
  const groups = [
    ["General", [["Brand", lot.brand], ["Model", lot.model], ["Type", CAT[lot.cat].label], ["Year built", lot.year], ["Length", meters(lot.len)], ["Beam", meters(lot.beam)], ["Draught", meters(lot.draft)], ["Hull material", lot.mat], ["Berths", lot.berths || "—"], ["Status", COND[lot.cond]], ["Trailer included", lot.trailer ? "Yes" : "No"]]],
    ["Engine", [["Number of engines", lot.eng.n], ["Make", lot.eng.brand], ["Power", `${lot.eng.hp} hp${lot.eng.n > 1 ? " each" : ""}`], ["Running hours", Number(lot.eng.h).toLocaleString("en-GB")], ["Fuel", lot.eng.fuel], ["Drive", lot.eng.type]]],
    ["Auction terms", [["Lot number", lot.no], ["Starting price", money(lot.start)], ["Buyer's premium", `${Math.round(c.rate * 100)}% + 21% VAT on premium`], ["VAT on hammer price", lot.vat ? `${lot.vat * 100}%` : "0% (private sale)"], ["Award", lot.noRes ? "No reserve — sold to the highest bidder" : `Subject to seller acceptance (${CONFIG.awardHours}h)`], ["Payment", `Within ${CONFIG.payDays} days into escrow`], ["Collection", `Within ${CONFIG.pickupDays} days of award`]]],
  ];
  return <div className="grid md:grid-cols-2 gap-6">{groups.map(([g, rows]) => (
    <div key={g} className="rounded-3xl bg-white border border-stone-200 overflow-hidden"><div className="px-5 py-3 font-bold text-sm bg-stone-50">{g}</div>
      <div className="divide-y divide-stone-100">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-5 py-2.5 text-sm"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900 text-right">{v}</span></div>)}</div></div>))}</div>;
}

function Viewing({ lot, ctx }) {
  const { state, dispatch, requireAuth, flash } = ctx;
  const reg = state.regs[lot.id];
  const [f, setF] = useState({ name: state.user ? state.user.name : "", email: state.user ? state.user.email : "", phone: "", people: "1" });
  const [err, setErr] = useState("");
  if (!lot.viewing) return <div className="rounded-3xl bg-white border border-stone-200 p-6 text-sm text-slate-600"><b className="text-slate-900">Viewing by appointment.</b> Flash-auction lots (demo) have no fixed viewing day. In the monthly auction, viewing is the Saturday before closing, 10:00–12:00.</div>;
  const submit = () => {
    if (!f.name.trim() || !/\S+@\S+\.\S+/.test(f.email)) return setErr("Please enter your name and a valid email.");
    setErr("");
    requireAuth(() => { dispatch({ type: "REG", lotId: lot.id, data: f }); flash("You're registered for the viewing day", `${fmtDay(lot.viewing)} · 10:00–12:00 · ${lot.city}`, "ok"); });
  };
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-3xl text-white p-6" style={{ background: "#0B1F33" }}>
        <Calendar size={22} className="text-teal-300" />
        <div className="mt-4 text-2xl font-bold" style={{ fontFamily: SERIF }}>{fmtDay(lot.viewing)}</div>
        <div className="text-slate-300">10:00 – 12:00 · {lot.city}, {COUNTRY[lot.cc]}</div>
        <p className="mt-4 text-sm text-slate-300">The owner is on board to answer questions. Bring ID. Exact berth details are sent to registered visitors. {lot.regs} people registered so far.</p>
      </div>
      {reg ? <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-900"><CheckCircle2 size={22} /><div className="mt-3 font-bold">You're registered</div><p className="text-sm mt-1">We'll send the exact location and a reminder to {reg.email}.</p></div> : (
        <div className="rounded-3xl bg-white border border-stone-200 p-6 space-y-3">
          <b>Register for the viewing</b>
          {[["name", "Full name"], ["email", "Email"], ["phone", "Phone (optional)"]].map(([k, l]) => <input key={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder={l} aria-label={l} className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />)}
          <select value={f.people} onChange={(e) => setF({ ...f, people: e.target.value })} className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" aria-label="Number of visitors">{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} visitor{n > 1 ? "s" : ""}</option>)}</select>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <Btn variant="accent" className="w-full" onClick={submit}>Register</Btn>
        </div>)}
    </div>
  );
}

function LocationBox({ lot }) {
  return (
    <div className="rounded-3xl overflow-hidden border border-stone-200 bg-white">
      <div className="relative" style={{ aspectRatio: "21 / 9" }}>
        <svg viewBox="0 0 600 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="600" height="260" fill="#D7ECF1" />
          <path d="M0,0 L600,0 L600,84 Q520,118 468,98 T360,128 T248,108 T140,148 T0,118 Z" fill="#F2EEE4" />
          {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={i * 52} y1="0" x2={i * 52} y2="260" stroke="#ffffff" strokeOpacity="0.5" />)}
          <circle cx="300" cy="150" r="64" fill="#0d9488" opacity="0.12" /><circle cx="300" cy="150" r="30" fill="#0d9488" opacity="0.18" />
          <path d="M300,150 m-9,-16 a9,9 0 1,1 18,0 c0,8 -9,18 -9,18 c0,0 -9,-10 -9,-18 z" fill="#0B1F33" />
        </svg>
      </div>
      <div className="p-5 text-sm"><b>{lot.city}, {COUNTRY[lot.cc]}</b><p className="text-slate-500 mt-1">Approximate location. The exact berth is shared with registered viewers and with the buyer after award.</p></div>
    </div>
  );
}

function TrustBox() {
  return (
    <div className="rounded-3xl bg-white border border-stone-200 p-5 text-sm space-y-3">
      {[[ShieldCheck, "Closing supervised by a court bailiff"], [Lock, "Payment held in escrow until handover"], [Users, "Seller identity and ownership checked"], [Banknote, `Collect within ${CONFIG.pickupDays} days of award`]].map(([I, t]) => <div key={t} className="flex items-center gap-3 text-slate-700"><I size={16} className="text-teal-700 flex-shrink-0" />{t}</div>)}
    </div>
  );
}

/* ============ MY BIDS & WATCHLIST ============ */
function MineRow({ l, now, go }) {
  const st = myStatus(l), my = l.bids.filter((b) => b.b === "me");
  return (
    <button type="button" onClick={() => go({ name: "lot", id: l.id })} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 text-left">
      <div className="relative w-24 rounded-xl overflow-hidden flex-shrink-0" style={{ aspectRatio: "4 / 3" }}><LotImage lot={l} /></div>
      <div className="flex-1 min-w-0"><div className="font-semibold text-slate-900 truncate">{T(l)}</div><div className="text-xs text-slate-500">Lot {l.no} · {l.city}</div>
        <div className="mt-1 flex gap-2 flex-wrap">{st && <Pill tone={STATUS[st][0]}>{STATUS[st][1]}</Pill>}{l.proxies.me && l.phase === "live" && <Pill tone="teal">Auto max {money(l.proxies.me.max)}</Pill>}</div></div>
      <div className="text-right flex-shrink-0"><div className="font-bold tabular-nums">{money(l.price || l.start)}</div>{my.length > 0 && <div className="text-xs text-slate-500">Your bid {money(my[my.length - 1].amt)}</div>}<div className="text-xs mt-1"><TimeLeft lot={l} now={now} /></div></div>
    </button>
  );
}
function Mine({ ctx }) {
  const { state, now, go } = ctx;
  const all = Object.values(state.lots);
  const mine = all.filter((l) => myStatus(l)).sort((a, b) => (a.phase === "live") === (b.phase === "live") ? a.endsAt - b.endsAt : a.phase === "live" ? -1 : 1);
  const watched = all.filter((l) => state.watch[l.id]);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>My bids</h1>
      {!state.user && <p className="mt-2 text-sm text-slate-500">Sign in to bid. Your watchlist works without an account.</p>}
      <div className="mt-6 rounded-3xl bg-white border border-stone-200 p-3">
        {mine.length === 0 ? <div className="p-10 text-center text-sm text-slate-500"><Gavel className="mx-auto text-slate-300" size={32} /><p className="mt-3">You haven't bid yet.</p><Btn size="sm" className="mt-4" onClick={() => go({ name: "catalog", tab: "flash" })}>Try the Flash auction</Btn></div> : mine.map((l) => <MineRow key={l.id} l={l} now={now} go={go} />)}
      </div>
      <h2 className="mt-10 text-2xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>Watchlist</h2>
      {watched.length === 0 ? <p className="mt-3 text-sm text-slate-500">Tap the heart on any lot to follow it and get a reminder 10 minutes before closing.</p> :
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{watched.map((l) => <LotCard key={l.id} lot={l} ctx={ctx} />)}</div>}
    </div>
  );
}

/* ============ HOW IT WORKS ============ */
function ProxyDemo() {
  const [start, setStart] = useState("10000"), [mine, setMine] = useState("14000"), [rival, setRival] = useState("12500"), [first, setFirst] = useState("rival");
  const res = useMemo(() => {
    let l = { id: "demo", start: parseInt(start, 10) || 0, bids: [], proxies: {}, price: null, leader: null, leaderTs: 0, phase: "live", endsAt: 9e15, ext: 0 };
    const order = first === "rival" ? [["rival", rival], ["me", mine]] : [["me", mine], ["rival", rival]]; const errs = [];
    order.forEach(([b, m], i) => { const r = bidOnLot(l, b, parseInt(m, 10) || 0, "auto", 1000 + i); if (r.error) errs.push((b === "me" ? "Your max: " : "Rival max: ") + r.error); else l = r.lot; });
    return { l, errs };
  }, [start, mine, rival, first]);
  const inp = (v, s, l) => <label className="text-xs font-semibold text-slate-500">{l}<input inputMode="numeric" value={v} onChange={(e) => s(e.target.value.replace(/[^\d]/g, ""))} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold text-slate-900" /></label>;
  return (
    <div className="rounded-3xl bg-white border border-stone-200 p-6">
      <h3 className="font-bold text-slate-900">Try it: how two automatic bids resolve</h3>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">{inp(start, setStart, "Starting price €")}{inp(mine, setMine, "Your maximum €")}{inp(rival, setRival, "Rival maximum €")}
        <label className="text-xs font-semibold text-slate-500">Who set their max first?<select value={first} onChange={(e) => setFirst(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"><option value="rival">Rival</option><option value="me">You</option></select></label></div>
      {res.errs.map((e) => <p key={e} className="mt-3 text-sm text-rose-600">{e}</p>)}
      {res.l.leader && <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm">
        <div className="font-bold">{res.l.leader === "me" ? "You lead" : "Rival leads"} at {money(res.l.price)}</div>
        <div className="mt-2 flex flex-wrap gap-2">{res.l.bids.map((b) => <Pill key={b.id} tone={b.b === "me" ? "teal" : "slate"}>{b.b === "me" ? "You" : "Rival"} {money(b.amt)}</Pill>)}</div>
        <p className="mt-3 text-xs text-slate-500">The higher maximum wins at one step above the other maximum. On equal maximums, the one set first wins.</p>
      </div>}
    </div>
  );
}
function How() {
  const [start, setStart] = useState("18000"), [bid, setBid] = useState("21000");
  const c = costs({ start: parseInt(start, 10) || 0, vat: 0 }, parseInt(bid, 10) || 0);
  const steps = [["Register & verify", "Free account. Lots starting from €25,000 need a one-time ID check."], ["Inspect", "Come to the viewing day, the Saturday before closing, 10:00–12:00."], ["Bid", "Single or automatic bids in whole euros. Bids are binding. A bid in the last 5 minutes extends the lot by 5 minutes."], ["Award", `The seller has ${CONFIG.awardHours}h to accept the highest bid (no-reserve lots are awarded instantly).`], ["Pay into escrow", `Invoice within 24h; pay within ${CONFIG.payDays} days into the third-party account.`], ["Sign & collect", `Sign the transfer document; collect within ${CONFIG.pickupDays} days. The seller is paid after handover.`]];
  const faq = [["What does “subject to seller acceptance” mean?", `After closing, the seller decides within ${CONFIG.awardHours} hours whether to accept the highest bid. If not, the sale doesn't go ahead and you owe nothing.`], ["Why is a lot still open after its closing time?", "Soft close: a bid in the final 5 minutes keeps the lot open until 5 minutes have passed without a new bid. This stops last-second sniping."], ["Can I withdraw a bid?", "No. Bids are binding. Because these are public auctions under bailiff supervision, the statutory right of withdrawal for distance purchases doesn't apply."], ["When do I become the owner?", `Once you've paid and signed the transfer document — or automatically ${CONFIG.pickupDays} days after award if handover is later. Arrange insurance from that moment.`], ["What are special conditions?", "Some lots carry extra terms (for example on mooring rights or VAT). They're shown on the lot and take precedence over the general terms."], ["What is a CE design category?", "An EU rating of the conditions a boat is built for: A (ocean), B (offshore), C (inshore) and D (sheltered waters)."]];
  const [openQ, setOpenQ] = useState(0);
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-5xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>How it works</h1>
      <p className="mt-3 text-slate-600 max-w-2xl">Clear rules, transparent costs and independent supervision. Here's the full journey from first bid to handover.</p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{steps.map(([t, d], i) => <div key={t} className="rounded-3xl bg-white border border-stone-200 p-6"><div className="text-sm font-bold text-teal-700 tabular-nums">0{i + 1}</div><h3 className="mt-2 font-bold text-slate-900">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div>)}</div>
      <h2 className="mt-14 text-3xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>Costs</h2>
      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white border border-stone-200 p-6"><h3 className="font-bold">Buyer's premium</h3><p className="text-xs text-slate-500 mt-1">Tier set by the lot's starting price, plus 21% VAT on the premium.</p>
          {[["Up to €25,000", "18%"], ["€25,000 – €100,000", "12%"], ["From €100,000", "8%"]].map(([k, v]) => <div key={k} className="flex justify-between py-2 border-b border-stone-100 text-sm"><span>{k}</span><b>{v}</b></div>)}</div>
        <div className="rounded-3xl bg-white border border-stone-200 p-6"><h3 className="font-bold">Seller's fee (flat)</h3><p className="text-xs text-slate-500 mt-1">Charged by boat length. No commission on the sale price.</p>
          {[["Up to 5 m", 100], ["5 – 10 m", 200], ["10 – 15 m", 300], ["Over 15 m", 500]].map(([k, v]) => <div key={k} className="flex justify-between py-2 border-b border-stone-100 text-sm"><span>{k}</span><b>{money(v)}</b></div>)}</div>
        <div className="rounded-3xl text-white p-6" style={{ background: "#0B1F33" }}><h3 className="font-bold">Cost calculator</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">{[[start, setStart, "Starting price €"], [bid, setBid, "Your bid €"]].map(([v, s, l]) => <label key={l} className="text-xs text-slate-300">{l}<input inputMode="numeric" value={v} onChange={(e) => s(e.target.value.replace(/[^\d]/g, ""))} className="mt-1 w-full rounded-xl px-3 py-2 text-sm font-bold text-slate-900" /></label>)}</div>
          <div className="mt-4 text-sm space-y-1"><div className="flex justify-between"><span className="text-slate-300">Premium {Math.round(c.rate * 100)}%</span><span>{money2(c.prem)}</span></div><div className="flex justify-between"><span className="text-slate-300">VAT on premium</span><span>{money2(c.premVat)}</span></div>
            <div className="flex justify-between pt-2 mt-2 border-t border-slate-600 text-lg font-bold"><span>Total</span><span>{money2(c.total)}</span></div></div></div>
      </div>
      <div className="mt-6"><ProxyDemo /></div>
      <h2 className="mt-14 text-3xl font-bold text-slate-900" style={{ fontFamily: SERIF }}>Questions</h2>
      <div className="mt-6 rounded-3xl bg-white border border-stone-200 divide-y divide-stone-100">
        {faq.map(([q, a], i) => <div key={q}><button type="button" onClick={() => setOpenQ(openQ === i ? -1 : i)} className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-slate-900">{q}<ChevronRight size={16} className={cx("transform transition", openQ === i && "rotate-90")} /></button>{openQ === i && <p className="px-6 pb-5 text-sm text-slate-600 tb-up">{a}</p>}</div>)}
      </div>
    </div>
  );
}

/* ============ AUTH ============ */
function AuthModal({ open, onClose, onDone, dispatch }) {
  const [mode, setMode] = useState("signup"); const [f, setF] = useState({ name: "", email: "", pw: "" }); const [ok, setOk] = useState(false); const [err, setErr] = useState("");
  const submit = () => {
    if (mode === "signup" && !f.name.trim()) return setErr("Please enter your name.");
    if (!/\S+@\S+\.\S+/.test(f.email)) return setErr("Please enter a valid email address.");
    if (f.pw.length < 8) return setErr("Use at least 8 characters for your password.");
    if (mode === "signup" && !ok) return setErr("Please accept the auction terms to continue.");
    setErr(""); dispatch({ type: "LOGIN", name: f.name.trim() || f.email.split("@")[0], email: f.email.trim() }); onDone();
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };
  const passkey = () => { dispatch({ type: "LOGIN", name: "Alex Morgan", email: "alex@example.com" }); onDone(); };
  return (
    <Modal open={open} onClose={onClose} title={mode === "signup" ? "Create your bidder account" : "Welcome back"}>
      <div className="p-6 space-y-3">
        <Btn variant="outline" className="w-full" onClick={passkey}><User size={16} />Continue with passkey (demo)</Btn>
        <div className="text-center text-xs text-slate-400">or with email</div>
        {mode === "signup" && <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={onKey} placeholder="Full name" aria-label="Full name" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />}
        <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onKeyDown={onKey} placeholder="Email" aria-label="Email" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />
        <input type="password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} onKeyDown={onKey} placeholder="Password (min. 8 characters)" aria-label="Password" className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />
        {mode === "signup" && <label className="flex gap-3 text-xs text-slate-600"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5" style={{ accentColor: "#0d9488" }} />I'm 18 or older and accept the general auction terms. I understand bids are binding and public auctions carry no right of withdrawal.</label>}
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <Btn className="w-full" size="lg" onClick={submit}>{mode === "signup" ? "Create account" : "Sign in"}</Btn>
        <p className="text-center text-sm text-slate-500">{mode === "signup" ? "Already registered?" : "New here?"} <button type="button" className="font-semibold text-teal-700" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErr(""); }}>{mode === "signup" ? "Sign in" : "Create an account"}</button></p>
      </div>
    </Modal>
  );
}

/* ============ APP ============ */
function parseHash() {
  try {
    const [name, arg] = (window.location.hash || "").replace(/^#\/?/, "").split("/");
    if (name === "lot" && arg) return { name: "lot", id: arg };
    if (name === "auctions") return { name: "catalog", tab: arg || "live" };
    if (name === "mine" || name === "how") return { name };
  } catch (e) { /* sandboxed */ }
  return { name: "home" };
}
const toHash = (r) => (r.name === "lot" ? `#/lot/${r.id}` : r.name === "catalog" ? `#/auctions/${r.tab || "live"}` : r.name === "home" ? "#/" : `#/${r.name}`);

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, () => buildState(Date.now()));
  const [now, setNow] = useState(Date.now());
  const ref = useRef(state); ref.current = state;
  const [route, setRoute] = useState(parseHash);
  const [authOpen, setAuthOpen] = useState(false);
  const after = useRef(null);
  const [toasts, setToasts] = useState([]);
  const seen = useRef(0);

  useEffect(() => { const t = setInterval(() => { const n = Date.now(); setNow(n); dispatch({ type: "TICK", now: n }); }, 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let on = true, t;
    const loop = () => { if (!on) return; const a = botMove(ref.current, Date.now()); if (a) dispatch(a); t = setTimeout(loop, 1800 + Math.random() * 2400); };
    t = setTimeout(loop, 2500); return () => { on = false; clearTimeout(t); };
  }, []);
  useEffect(() => { const h = () => setRoute((p) => { const r = parseHash(); return toHash(p) === toHash(r) ? p : r; }); window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  const routeKey = toHash(route) + (route.q || "") + (route.cat || "");
  useEffect(() => { try { window.scrollTo(0, 0); } catch (e) { /* ignore */ } }, [routeKey]);
  useEffect(() => {
    const fresh = state.notes.filter((n) => n.id > seen.current);
    if (!fresh.length) return;
    seen.current = Math.max(...fresh.map((n) => n.id));
    const show = fresh.slice(0, 3);
    setToasts((t) => [...show, ...t].slice(0, 4));
    show.forEach((n) => setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 6000));
  }, [state.notes]);

  const go = (r) => { setRoute(r); try { const h = toHash(r); if (window.location.hash !== h) window.location.hash = h; } catch (e) { /* ignore */ } };
  const requireAuth = (fn) => { if (ref.current.user) fn(); else { after.current = fn; setAuthOpen(true); } };
  const flash = (title, body, kind = "info") => { const id = "u" + Math.random(); setToasts((t) => [{ id, title, body, kind }, ...t].slice(0, 4)); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500); };
  const ctx = { state, now, dispatch, go, requireAuth, flash, route };

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "#F6F4EF", fontFamily: 'Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif' }}>
      <style>{`
        @keyframes tbUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.tb-up{animation:tbUp .3s ease-out both}
        @keyframes tbIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}.tb-in{animation:tbIn .3s ease-out both}
        @keyframes tbFlash{0%{background:rgba(20,184,166,.28)}100%{background:transparent}}.tb-flash{animation:tbFlash 1.2s ease-out}
        .tb-noscroll::-webkit-scrollbar{display:none}.tb-noscroll{scrollbar-width:none}
      `}</style>
      <Header ctx={ctx} onAuth={() => setAuthOpen(true)} />
      {route.name === "home" && <Home ctx={ctx} />}
      {route.name === "catalog" && <Catalog ctx={ctx} />}
      {route.name === "lot" && <LotPage ctx={ctx} />}
      {route.name === "mine" && <Mine ctx={ctx} />}
      {route.name === "how" && <How />}
      <Footer go={go} />
      <Toasts items={toasts} go={go} />
      <DemoDock ctx={ctx} />
      <AuthModal open={authOpen} dispatch={dispatch} onClose={() => { setAuthOpen(false); after.current = null; }}
        onDone={() => { setAuthOpen(false); const fn = after.current; after.current = null; if (fn) setTimeout(fn, 0); }} />
    </div>
  );
}
