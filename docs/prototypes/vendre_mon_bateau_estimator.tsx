import React, { useMemo, useState, useEffect } from "react";
import { Anchor, ArrowRight, Calendar, Check, ChevronDown, Info, ShieldCheck, Timer, X, Gavel, Phone, Mail, Camera, Key, TrendingDown, Calculator } from "lucide-react";

/* ===== Parameters — admin-editable and versioned in production (see spec: Seller acquisition) ===== */
const BRAND = "Tidebid";
const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const P = {
  version: "2026-10-04",
  berthA: 25, berthB: 2.25, // France: 25 × L^2.25 €/yr, through the 2026 marina observatory averages
  coast: { med: 1.3, corse: 1.0, atl: 0.85, manche: 0.75, inland: 0.55, nlbede: 0.8 },
  storage: { marina: 1, drystack: 0.8, buoy: 0.35, hard: 0.5, trailer: 0 },
  trailerFlat: 150,
  insRate: 0.01, insMin: 200,
  maintRate: 0.05, maintPerM: 75,
  winterPerMMonth: 15,
  depr: [[0, 0.15], [1, 0.07], [6, 0.05], [11, 0.04], [21, 0.03]], // [from age in years, yearly rate]
  cond: { excellent: 0.85, good: 1, fair: 1.25, work: 1.5 },
  savings: 0.017, // Livret A since 1 Aug 2026
  brokerRate: 0.08,
  sellerFee: [[5, 100], [10, 200], [15, 300], [Infinity, 500]], // by length in metres
  deadlineDays: 21,
};
const FR_ZONES = ["med", "corse", "atl", "manche", "inland"];
const SOURCES = [
  ["Observatoire national des ports de plaisance 2026", "https://www.bateaux.com/article/52044/que-revelent-les-chiffres-des-ports-de-plaisance-francais-sur-l-avenir-du-nautisme"],
  ["Banque Populaire — coût d'un bateau", "https://www.banquepopulaire.fr/nord/conseils/popnews-combien-coute-bateau/"],
  ["Giornale della Vela — décote", "https://www.giornaledellavela.com/2022/09/29/infographic-the-foolproof-method-for-evaluating-a-used-boat-and-not-getting-ripped-off/?lang=en"],
  ["info.gouv.fr — Livret A à 1,7 %", "https://www.info.gouv.fr/actualite/augmentation-du-taux-du-livret-a-a-compter-du-1er-aout-2026"],
  ["Simulateur TAEMUP officiel", "https://simulateur-taxe-plaisance.mer.gouv.fr/"],
  ["Royal Nautisme Brokerage — honoraires 8–10 %", "https://www.toute-la-franchise.com/franchise/royal-nautisme-brokerage"],
];

/* ===== The algorithm: pure, same function the platform uses (packages/domain) ===== */
function estimate(x, p = P) {
  const L = x.len, V = x.value, age = Math.max(0, new Date().getFullYear() - x.year);
  const berthModel = x.storage === "trailer" ? p.trailerFlat : p.berthA * Math.pow(L, p.berthB) * p.coast[x.zone] * p.storage[x.storage];
  const B = x.berthReal != null ? x.berthReal : berthModel;
  const I = x.insReal != null ? x.insReal : Math.max(p.insMin, V * p.insRate);
  const M = Math.max(V * p.maintRate, p.maintPerM * L);
  const W = x.winter && x.storage !== "trailer" ? p.winterPerMMonth * L * x.winterMonths : 0;
  const T = Math.max(0, x.tax || 0);
  let rate = p.depr[0][1];
  for (const [a, r] of p.depr) if (age >= a) rate = r;
  const D = V * rate * p.cond[x.cond];
  const O = V * p.savings;
  const items = [
    { key: "berth", value: B, how: x.berthReal != null ? "real" : x.storage === "trailer" ? "trailer" : "model" },
    { key: "maint", value: M }, { key: "depr", value: D }, { key: "opp", value: O },
    { key: "ins", value: I }, { key: "winter", value: W }, { key: "tax", value: T },
  ].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const yearly = items.reduce((s, i) => s + i.value, 0);
  const fee = p.sellerFee.find(([max]) => L <= max)[1];
  return { items, yearly, monthly: yearly / 12, perDay: x.days > 0 ? yearly / x.days : null, age, rate, condMult: p.cond[x.cond], berthModel, valueIn12: V - D, broker: V * p.brokerRate, fee };
}

/* ===== Auction calendar: third Monday of each month (production: admin calendar) ===== */
function thirdMonday(y, m) { const d = new Date(y, m, 1, 20, 0, 0); d.setDate(1 + ((8 - d.getDay()) % 7) + 14); return d; }
function nextSale(now = new Date()) {
  let y = now.getFullYear(), m = now.getMonth();
  for (let k = 0; k < 24; k++) {
    const sale = thirdMonday(y, m), deadline = new Date(sale); deadline.setDate(deadline.getDate() - P.deadlineDays); deadline.setHours(23, 59, 0, 0);
    if (deadline > now) return { sale, deadline, days: Math.ceil((deadline - now) / 86400000) };
    if (++m > 11) { m = 0; y++; }
  }
  return null;
}

/* ===== Copy (fr default, en) ===== */
const L10N = {
  fr: {
    nav_buy: "Acheter", nav_sell: "Vendre mon bateau", kicker: "Vendre mon bateau",
    hero_title: "Chaque mois, votre bateau vous coûte de l'argent.",
    hero_sub: "Place de port, entretien, assurance, décote… Calculez en 30 secondes ce que l'attente vous coûte, puis vendez à date fixe avec un paiement sécurisé.",
    hero_live: "Votre estimation", per_month: "par mois", cta_estimate: "Calculer mes pertes", cta_sell: "Vendre mon bateau",
    inputs: "Votre bateau", f_type: "Type", f_len: "Longueur", f_year: "Année de construction", f_value: "Valeur estimée",
    f_value_hint: "Pas sûr ? Notre estimation est gratuite.", f_cond: "État", f_zone: "Où est-il ?", f_storage: "Stationnement",
    f_winter: "Hivernage à terre", f_months: "mois", f_tax_fr: "TAEMUP (taxe annuelle)", f_tax_other: "Autres taxes et frais annuels",
    tax_link: "Simulateur officiel", f_days: "Jours de navigation par an", f_real: "J'ai mes vrais chiffres",
    f_berth_real: "Place de port réelle (€/an)", f_ins_real: "Assurance réelle (€/an)", placeholder_auto: "auto",
    t_motor: "Bateau à moteur", t_sail: "Voilier", t_rib: "Semi-rigide", t_sloop: "Sloep", t_cat: "Catamaran", t_speed: "Vedette",
    c_excellent: "Excellent", c_good: "Bon", c_fair: "Correct", c_work: "À rénover",
    z_med: "Méditerranée", z_corse: "Corse", z_atl: "Atlantique", z_manche: "Manche, mer du Nord", z_inland: "Fleuves et canaux", z_nlbede: "Pays-Bas, Belgique, Allemagne",
    s_marina: "Port, à flot", s_drystack: "Port à sec", s_buoy: "Corps-mort", s_hard: "Terre-plein toute l'année", s_trailer: "Remorque chez moi",
    r_title: "Ce que votre bateau vous coûte", r_year: "par an", r_day: "par jour de navigation", r_share: "du total",
    i_berth: "Place de port, stockage", i_maint: "Entretien et réparations", i_depr: "Décote (perte de valeur)", i_opp: "Argent immobilisé",
    i_ins: "Assurance", i_winter: "Hivernage", i_tax: "Taxes et frais",
    wait_q: "Si vous attendez", wait_m: "{n} mois", wait_cost: "cela vous coûte environ",
    value_now: "Valeur aujourd'hui", value_12: "Dans 12 mois", fees_title: "Ce que coûte la vente", fees_broker: "Courtier ({p} %)",
    fees_us: "Nos frais vendeur (forfait)", fees_save: "Vous gardez {v} de plus", fees_note: "Les frais acheteur sont payés par l'acheteur.",
    next_sale: "Prochaine vente", deadline: "Dossier à déposer avant le {d}", days_left: "plus que {n} jours",
    cta_sale: "Vendre à la vente du {d}", cta_report: "Recevoir ce rapport", cta_call: "Être rappelé",
    how: "Comment c'est calculé ?", how_intro: "Estimation indicative à partir de moyennes publiques et de vos réponses. Chaque hypothèse se modifie ci-dessus.",
    h_berth_model: "25 × {L} m^2,25 × {c} (zone) × {s} (stationnement)", h_berth_trailer: "Forfait remorque {v}", h_berth_real: "Votre montant réel",
    h_maint: "Le plus élevé de 5 % de la valeur et 75 € × {L} m", h_depr: "{r} % par an à {a} ans × {m} (état)", h_opp: "1,7 % (Livret A) × valeur",
    h_ins: "1 % de la valeur, au moins 200 €", h_winter: "15 € × {L} m × {n} mois", h_tax: "Votre montant", sources: "Sources", params: "Paramètres v{v}",
    steps_title: "Vendre aux enchères, en 4 étapes",
    s1_t: "Estimation gratuite", s1_b: "Un conseiller vous rappelle, étudie les ventes récentes et fixe avec vous un prix de départ.",
    s2_t: "Annonce professionnelle", s2_b: "Photos, description et traductions en 4 langues, publiées auprès d'acheteurs dans toute l'Europe.",
    s3_t: "Visite puis enchères", s3_b: "Une journée de visite de 2 h, puis des enchères en ligne à date fixe, en direct.",
    s4_t: "Paiement sécurisé", s4_b: "L'acheteur paie sur un compte séquestre agréé. Vous êtes payé dès la remise des clés.",
    cmp_title: "Enchères, courtier ou petite annonce ?", cmp_auction: "Enchères " + BRAND, cmp_broker: "Courtier", cmp_ad: "Petite annonce",
    cmp_cost: "Coût pour vous", cmp_date: "Date de vente", cmp_pay: "Sécurité du paiement", cmp_time: "Votre temps",
    cmp_cost_a: "Forfait de 100 à 500 € selon la longueur", cmp_cost_b: "8 à 10 % du prix", cmp_cost_c: "Souvent gratuit",
    cmp_date_a: "Date fixe, la prochaine vente", cmp_date_b: "Variable", cmp_date_c: "Variable",
    cmp_pay_a: "Séquestre agréé jusqu'à la remise", cmp_pay_b: "Selon le courtier", cmp_pay_c: "À négocier entre particuliers",
    cmp_time_a: "Une visite de 2 h", cmp_time_b: "Faible", cmp_time_c: "Appels, visites, négociations",
    faq_title: "Questions fréquentes",
    q1: "Et si le prix final ne me convient pas ?", a1: "Vous avez 72 h pour accepter ou refuser l'offre la plus haute. Aucune obligation de vendre.",
    q2: "Combien vaut mon bateau ?", a2: "Nos conseillers vous donnent une estimation gratuite, fondée sur les ventes récentes de bateaux comparables.",
    q3: "Que paie l'acheteur ?", a3: "Des frais acheteur de 8 à 18 % selon le prix de départ, plus la TVA sur ces frais. Ils ne réduisent pas votre prix.",
    lead_title_sell: "Vendons votre bateau", lead_title_report: "Recevoir votre rapport", lead_title_call: "Être rappelé",
    lead_name: "Nom complet", lead_email: "E-mail", lead_phone: "Téléphone", lead_phone_opt: "Téléphone (facultatif)",
    lead_consent: "J'accepte d'être contacté au sujet de la vente de mon bateau. Je peux retirer mon accord à tout moment.",
    lead_submit: "Envoyer", lead_err_name: "Indiquez votre nom.", lead_err_email: "Indiquez un e-mail valide.", lead_err_phone: "Indiquez un téléphone pour être rappelé.",
    lead_err_consent: "Merci de cocher la case d'accord.", done_title: "C'est noté, merci !",
    done_body: "Un conseiller vous contacte sous 24 h ouvrées pour l'estimation gratuite.", done_next: "Prochaine étape : la vente du {d}, dossier avant le {e}.",
    close: "Fermer", disclaimer: "Estimation indicative, non contractuelle.", demo: "Prototype : aucune donnée n'est envoyée.",
    summary: "{type} de {L} m, {y}, estimé {v}",
  },
  en: {
    nav_buy: "Buy", nav_sell: "Sell my boat", kicker: "Sell my boat",
    hero_title: "Every month, your boat costs you money.",
    hero_sub: "Berth, maintenance, insurance, loss of value… See in 30 seconds what waiting costs you, then sell on a fixed date with secure payment.",
    hero_live: "Your estimate", per_month: "a month", cta_estimate: "Calculate what I lose", cta_sell: "Sell my boat",
    inputs: "Your boat", f_type: "Type", f_len: "Length", f_year: "Year built", f_value: "Estimated value",
    f_value_hint: "Not sure? Our valuation is free.", f_cond: "Condition", f_zone: "Where is it kept?", f_storage: "How is it kept?",
    f_winter: "Winters ashore", f_months: "months", f_tax_fr: "TAEMUP (annual boat tax)", f_tax_other: "Other annual taxes and fees",
    tax_link: "Official simulator", f_days: "Days on the water per year", f_real: "I know my real costs",
    f_berth_real: "Actual berth (€/year)", f_ins_real: "Actual insurance (€/year)", placeholder_auto: "auto",
    t_motor: "Motorboat", t_sail: "Sailboat", t_rib: "RIB", t_sloop: "Sloep", t_cat: "Catamaran", t_speed: "Speedboat",
    c_excellent: "Excellent", c_good: "Good", c_fair: "Fair", c_work: "Needs work",
    z_med: "Mediterranean", z_corse: "Corsica", z_atl: "Atlantic", z_manche: "Channel, North Sea", z_inland: "Rivers and canals", z_nlbede: "Netherlands, Belgium, Germany",
    s_marina: "Marina berth, afloat", s_drystack: "Dry stack", s_buoy: "Mooring buoy", s_hard: "Ashore all year", s_trailer: "Trailer at home",
    r_title: "What your boat costs you", r_year: "a year", r_day: "per day on the water", r_share: "of the total",
    i_berth: "Berth, storage", i_maint: "Maintenance and repairs", i_depr: "Loss of resale value", i_opp: "Money tied up",
    i_ins: "Insurance", i_winter: "Winter storage", i_tax: "Taxes and fees",
    wait_q: "If you wait", wait_m: "{n} months", wait_cost: "it costs you about",
    value_now: "Value today", value_12: "In 12 months", fees_title: "What selling costs", fees_broker: "Broker ({p}%)",
    fees_us: "Our seller fee (flat)", fees_save: "You keep {v} more", fees_note: "Buyer's fees are paid by the buyer.",
    next_sale: "Next auction", deadline: "Submit your boat before {d}", days_left: "{n} days left",
    cta_sale: "Sell in the {d} auction", cta_report: "Email me this report", cta_call: "Call me back",
    how: "How is this calculated?", how_intro: "An indicative estimate from public averages and your answers. Change any assumption above.",
    h_berth_model: "25 × {L} m^2.25 × {c} (area) × {s} (storage)", h_berth_trailer: "Trailer flat rate {v}", h_berth_real: "Your actual amount",
    h_maint: "The larger of 5% of value and €75 × {L} m", h_depr: "{r}% a year at {a} years × {m} (condition)", h_opp: "1.7% (French Livret A) × value",
    h_ins: "1% of value, at least €200", h_winter: "€15 × {L} m × {n} months", h_tax: "Your amount", sources: "Sources", params: "Parameters v{v}",
    steps_title: "Selling at auction, in 4 steps",
    s1_t: "Free valuation", s1_b: "An adviser calls you, studies recent sales and sets a starting price with you.",
    s2_t: "Professional listing", s2_b: "Photos, description and translations in 4 languages, shown to buyers across Europe.",
    s3_t: "Viewing, then bidding", s3_b: "A 2-hour viewing day, then live online bidding on a fixed date.",
    s4_t: "Secure payment", s4_b: "The buyer pays into a licensed escrow account. You are paid at handover.",
    cmp_title: "Auction, broker or classified ad?", cmp_auction: BRAND + " auction", cmp_broker: "Broker", cmp_ad: "Classified ad",
    cmp_cost: "Cost to you", cmp_date: "Sale date", cmp_pay: "Payment security", cmp_time: "Your time",
    cmp_cost_a: "Flat €100 to €500 by length", cmp_cost_b: "8 to 10% of the price", cmp_cost_c: "Often free",
    cmp_date_a: "Fixed: the next auction", cmp_date_b: "Varies", cmp_date_c: "Varies",
    cmp_pay_a: "Licensed escrow until handover", cmp_pay_b: "Depends on the broker", cmp_pay_c: "Up to the two parties",
    cmp_time_a: "One 2-hour viewing", cmp_time_b: "Low", cmp_time_c: "Calls, visits, haggling",
    faq_title: "Questions",
    q1: "What if I don't like the final price?", a1: "You have 72 hours to accept or decline the highest offer. No obligation to sell.",
    q2: "What is my boat worth?", a2: "Our advisers give you a free valuation based on recent sales of comparable boats.",
    q3: "What does the buyer pay?", a3: "A buyer's premium of 8 to 18% depending on the start price, plus VAT on it. It never reduces your price.",
    lead_title_sell: "Let's sell your boat", lead_title_report: "Get your report", lead_title_call: "Get a call back",
    lead_name: "Full name", lead_email: "Email", lead_phone: "Phone", lead_phone_opt: "Phone (optional)",
    lead_consent: "I agree to be contacted about selling my boat. I can withdraw this at any time.",
    lead_submit: "Send", lead_err_name: "Please enter your name.", lead_err_email: "Please enter a valid email.", lead_err_phone: "Please enter a phone number for the call back.",
    lead_err_consent: "Please tick the consent box.", done_title: "Thank you, we've got it!",
    done_body: "An adviser will contact you within one working day for your free valuation.", done_next: "Next step: the {d} auction, submit before {e}.",
    close: "Close", disclaimer: "Indicative estimate, not a quote.", demo: "Prototype: no data is sent.",
    summary: "{type}, {L} m, {y}, valued at {v}",
  },
};

/* ===== UI helpers ===== */
const cx = (...a) => a.filter(Boolean).join(" ");
function Btn({ children, variant = "primary", className = "", ...rest }) {
  const v = { primary: "bg-slate-900 text-white hover:bg-slate-700", accent: "bg-teal-600 text-white hover:bg-teal-700", light: "bg-white text-slate-900 hover:bg-slate-100", outline: "border border-slate-300 bg-white text-slate-800 hover:border-slate-900", ghostLight: "border border-slate-500 text-white hover:bg-white hover:bg-opacity-10" };
  return <button type="button" className={cx("inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-40", v[variant], className)} {...rest}>{children}</button>;
}
function Field({ label, aside, children }) {
  return <div><div className="flex items-baseline justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>{aside}</div><div className="mt-2">{children}</div></div>;
}
function Chips({ value, onChange, options }) {
  return <div className="flex flex-wrap gap-2">{options.map(([k, l]) => <button type="button" key={k} onClick={() => onChange(k)} aria-pressed={value === k} className={cx("rounded-full border px-3 py-1.5 text-xs font-semibold transition", value === k ? "border-teal-600 bg-teal-600 text-white" : "border-stone-200 bg-white text-slate-700 hover:border-slate-400")}>{l}</button>)}</div>;
}
function Range({ value, min, max, step, onChange, label }) {
  return <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ accentColor: "#0d9488" }} />;
}
const digits = (s) => String(s).replace(/[^\d]/g, "");

/* ===== Main ===== */
export default function App() {
  const [lang, setLang] = useState("fr");
  const t = (k, v) => { let s = L10N[lang][k] ?? L10N.en[k] ?? k; if (v) for (const [a, b] of Object.entries(v)) s = s.split(`{${a}}`).join(String(b)); return s; };
  const loc = lang === "fr" ? "fr-FR" : "en-IE";
  const money = useMemo(() => { const f = new Intl.NumberFormat(loc, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }); return (n) => f.format(Math.round(n || 0)); }, [loc]);
  const num = (n, d = 0) => new Intl.NumberFormat(loc, { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
  const dayFmt = (d) => new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long" }).format(d);
  const shortFmt = (d) => new Intl.DateTimeFormat(loc, { day: "numeric", month: "long" }).format(d);

  const [x, setX] = useState({ type: "motor", len: 10, year: 2008, value: 60000, cond: "good", zone: "med", storage: "marina", winter: false, winterMonths: 5, tax: 500, days: 15, berthReal: null, insReal: null });
  const set = (k) => (v) => setX((s) => ({ ...s, [k]: v }));
  const [wait, setWait] = useState(6);
  const [showReal, setShowReal] = useState(false);
  const [showHow, setShowHow] = useState(false);
  const [lead, setLead] = useState(null);
  const r = useMemo(() => estimate(x), [x]);
  const sale = useMemo(() => nextSale(), []);
  const isFR = FR_ZONES.includes(x.zone);
  const top = r.items.length ? r.items[0].value : 1;
  const scrollTo = (id) => { try { document.getElementById(id).scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { /* ignore */ } };

  const howLine = (it) => {
    if (it.key === "berth") return it.how === "real" ? t("h_berth_real") : it.how === "trailer" ? t("h_berth_trailer", { v: money(P.trailerFlat) }) : t("h_berth_model", { L: num(x.len, 1), c: num(P.coast[x.zone], 2), s: num(P.storage[x.storage], 2) });
    if (it.key === "maint") return t("h_maint", { L: num(x.len, 1) });
    if (it.key === "depr") return t("h_depr", { r: num(r.rate * 100), a: r.age, m: num(r.condMult, 2) });
    if (it.key === "opp") return t("h_opp");
    if (it.key === "ins") return x.insReal != null ? t("h_berth_real") : t("h_ins");
    if (it.key === "winter") return t("h_winter", { L: num(x.len, 1), n: x.winterMonths });
    return t("h_tax");
  };

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "#F6F4EF", fontFamily: 'Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif' }}>
      <style>{`@keyframes vmUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.vm-up{animation:vmUp .3s ease-out both}`}</style>

      <header className="sticky top-0 z-30 border-b border-stone-200" style={{ background: "rgba(247,245,240,0.88)", backdropFilter: "blur(14px)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white"><Anchor size={18} /></span><span className="text-xl font-bold" style={{ fontFamily: SERIF }}>{BRAND}</span></span>
          <nav className="ml-6 hidden items-center gap-1 sm:flex">
            <span className="rounded-full px-3 py-2 text-sm text-slate-500">{t("nav_buy")}</span>
            <span className="rounded-full bg-slate-900 px-3 py-2 text-sm font-medium text-white">{t("nav_sell")}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-full border border-stone-200 bg-white p-1 text-xs font-semibold" role="group" aria-label="Language">
              {["fr", "en"].map((l) => <button type="button" key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={cx("rounded-full px-3 py-1", lang === l ? "bg-slate-900 text-white" : "text-slate-600")}>{l.toUpperCase()}</button>)}
            </div>
            <Btn variant="accent" className="hidden px-4 py-2 sm:inline-flex" onClick={() => setLead("sell")}>{t("cta_sell")}</Btn>
          </div>
        </div>
      </header>

      <section style={{ background: "linear-gradient(160deg,#0B1F33 0%,#0E3350 55%,#0F4C5C 100%)" }}>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          <div className="text-white lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.1)" }}><TrendingDown size={14} />{t("kicker")}</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-6xl" style={{ fontFamily: SERIF }}>{t("hero_title")}</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">{t("hero_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn variant="light" onClick={() => scrollTo("estimator")}><Calculator size={16} />{t("cta_estimate")}</Btn>
              <Btn variant="ghostLight" onClick={() => setLead("sell")}>{t("cta_sell")} <ArrowRight size={16} /></Btn>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-3xl p-6 text-white shadow-2xl" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div className="text-sm text-slate-300">{t("hero_live")}</div>
              <div key={Math.round(r.monthly)} className="vm-up mt-1 text-5xl font-extrabold tabular-nums">{money(r.monthly)}</div>
              <div className="text-slate-300">{t("per_month")} · {money(r.yearly)} {t("r_year")}</div>
              <div className="mt-4 text-sm text-slate-300">{t("summary", { type: t("t_" + x.type), L: num(x.len, 1), y: x.year, v: money(x.value) })}</div>
              {sale && <div className="mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(127,224,214,0.12)" }}><Calendar size={16} className="text-teal-300" /><span>{t("next_sale")} : <b className="capitalize">{dayFmt(sale.sale)}</b> · {t("days_left", { n: sale.days })}</span></div>}
            </div>
          </div>
        </div>
      </section>

      <main id="estimator" className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-12">
        <div className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 lg:col-span-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: SERIF }}>{t("inputs")}</h2>
          <Field label={t("f_type")}><Chips value={x.type} onChange={set("type")} options={["motor", "sail", "rib", "sloop", "cat", "speed"].map((k) => [k, t("t_" + k)])} /></Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={t("f_len")} aside={<b className="tabular-nums">{num(x.len, 1)} m</b>}><Range label={t("f_len")} value={x.len} min={4} max={25} step={0.5} onChange={set("len")} /></Field>
            <Field label={t("f_year")} aside={<b className="tabular-nums">{x.year}</b>}><Range label={t("f_year")} value={x.year} min={1965} max={new Date().getFullYear()} step={1} onChange={set("year")} /></Field>
          </div>
          <Field label={t("f_value")} aside={<span className="text-xs text-slate-500">{t("f_value_hint")}</span>}>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-stone-200 px-4 py-2.5">
              <span className="font-bold text-slate-400">€</span>
              <input inputMode="numeric" aria-label={t("f_value")} value={num(x.value)} onChange={(e) => set("value")(Math.min(5000000, Number(digits(e.target.value)) || 0))} className="flex-1 bg-transparent text-lg font-bold tabular-nums outline-none" />
            </div>
            <div className="mt-3"><Range label={t("f_value")} value={Math.min(x.value, 400000)} min={2000} max={400000} step={1000} onChange={set("value")} /></div>
          </Field>
          <Field label={t("f_cond")}><Chips value={x.cond} onChange={set("cond")} options={["excellent", "good", "fair", "work"].map((k) => [k, t("c_" + k)])} /></Field>
          <Field label={t("f_zone")}><Chips value={x.zone} onChange={set("zone")} options={["med", "corse", "atl", "manche", "inland", "nlbede"].map((k) => [k, t("z_" + k)])} /></Field>
          <Field label={t("f_storage")}><Chips value={x.storage} onChange={set("storage")} options={["marina", "drystack", "buoy", "hard", "trailer"].map((k) => [k, t("s_" + k)])} /></Field>
          {x.storage !== "trailer" && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={x.winter} onChange={(e) => set("winter")(e.target.checked)} style={{ accentColor: "#0d9488" }} />{t("f_winter")}</label>
              {x.winter && <div className="flex items-center gap-2 text-sm"><input inputMode="numeric" aria-label={t("f_months")} value={x.winterMonths} onChange={(e) => set("winterMonths")(Math.min(12, Number(digits(e.target.value)) || 0))} className="w-14 rounded-xl border border-stone-200 px-2 py-1 text-center" />{t("f_months")}</div>}
            </div>)}
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label={isFR ? t("f_tax_fr") : t("f_tax_other")} aside={isFR ? <a href="https://simulateur-taxe-plaisance.mer.gouv.fr/" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-teal-700 underline">{t("tax_link")}</a> : null}>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2"><span className="text-slate-400">€</span><input inputMode="numeric" aria-label={isFR ? t("f_tax_fr") : t("f_tax_other")} value={x.tax} onChange={(e) => set("tax")(Number(digits(e.target.value)) || 0)} className="w-full bg-transparent outline-none tabular-nums" /></div>
            </Field>
            <Field label={t("f_days")} aside={<b className="tabular-nums">{x.days}</b>}><Range label={t("f_days")} value={x.days} min={0} max={90} step={1} onChange={set("days")} /></Field>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4">
            <button type="button" onClick={() => setShowReal(!showReal)} className="flex w-full items-center justify-between text-sm font-semibold text-slate-800" aria-expanded={showReal}>{t("f_real")}<ChevronDown size={16} className={cx("transform transition", showReal && "rotate-180")} /></button>
            {showReal && <div className="vm-up mt-4 grid gap-4 sm:grid-cols-2">
              {[["berthReal", "f_berth_real", r.berthModel], ["insReal", "f_ins_real", Math.max(P.insMin, x.value * P.insRate)]].map(([k, l, auto]) => (
                <Field key={k} label={t(l)}><input inputMode="numeric" aria-label={t(l)} value={x[k] == null ? "" : x[k]} placeholder={`${t("placeholder_auto")} ${money(auto)}`} onChange={(e) => { const d = digits(e.target.value); set(k)(d === "" ? null : Number(d)); }} className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 tabular-nums" /></Field>))}
            </div>}
          </div>
        </div>

        <aside className="lg:col-span-6">
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-stone-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-500">{t("r_title")}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span key={Math.round(r.monthly)} className="vm-up text-5xl font-extrabold tabular-nums">{money(r.monthly)}</span><span className="text-slate-500">{t("per_month")}</span>
              </div>
              <div className="mt-1 text-sm text-slate-600">{money(r.yearly)} {t("r_year")}{r.perDay != null && <> · <b>{money(r.perDay)}</b> {t("r_day")}</>}</div>
              <div className="mt-6 space-y-3">
                {r.items.map((it, i) => (
                  <div key={it.key}>
                    <div className="flex justify-between text-sm"><span className={i === 0 ? "font-semibold" : ""}>{t("i_" + it.key)}</span><span className="tabular-nums"><b>{money(it.value / 12)}</b> <span className="text-slate-400">· {Math.round((it.value / r.yearly) * 100)} %</span></span></div>
                    <div className="mt-1 h-2.5 rounded-full bg-stone-100"><div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${(it.value / top) * 100}%`, background: i === 0 ? "#0d9488" : "#B9B5A8" }} /></div>
                  </div>))}
              </div>
              <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
                <div className="flex flex-wrap items-center gap-2 text-sm"><Timer size={16} className="text-teal-300" />{t("wait_q")}
                  {[3, 6, 12].map((n) => <button type="button" key={n} onClick={() => setWait(n)} aria-pressed={wait === n} className={cx("rounded-full px-3 py-1 text-xs font-semibold", wait === n ? "bg-white text-slate-900" : "bg-white bg-opacity-10 text-white")}>{t("wait_m", { n })}</button>)}
                </div>
                <div className="mt-3 text-sm text-slate-300">{t("wait_cost")}</div>
                <div key={wait + "-" + Math.round(r.monthly)} className="vm-up text-3xl font-extrabold tabular-nums">{money(r.monthly * wait)}</div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.07)" }}><div className="text-slate-400">{t("value_now")}</div><div className="font-bold tabular-nums">{money(x.value)}</div></div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.07)" }}><div className="text-slate-400">{t("value_12")}</div><div className="font-bold tabular-nums">≈ {money(r.valueIn12)}</div></div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-stone-200 p-5">
                <div className="text-sm font-semibold">{t("fees_title")}</div>
                <div className="mt-2 flex justify-between text-sm"><span className="text-slate-600">{t("fees_broker", { p: num(P.brokerRate * 100) })}</span><span className="tabular-nums line-through decoration-slate-400">{money(r.broker)}</span></div>
                <div className="mt-1 flex justify-between text-sm"><span className="text-slate-600">{t("fees_us")}</span><span className="font-bold tabular-nums">{money(r.fee)}</span></div>
                {r.broker > r.fee && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800"><Check size={12} />{t("fees_save", { v: money(r.broker - r.fee) })}</div>}
                <div className="mt-2 text-xs text-slate-500">{t("fees_note")}</div>
              </div>
              {sale && <div className="mt-4 rounded-2xl bg-teal-50 p-4 text-sm text-teal-900"><div className="flex items-center gap-2 font-semibold"><Calendar size={16} />{t("next_sale")} : <span className="capitalize">{dayFmt(sale.sale)}</span></div><div className="mt-1">{t("deadline", { d: shortFmt(sale.deadline) })} · <b>{t("days_left", { n: sale.days })}</b></div></div>}
              <Btn variant="accent" className="mt-4 w-full py-4 text-base" onClick={() => setLead("sell")}><Gavel size={18} />{sale ? t("cta_sale", { d: shortFmt(sale.sale) }) : t("cta_sell")}</Btn>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Btn variant="outline" onClick={() => setLead("report")}><Mail size={15} />{t("cta_report")}</Btn>
                <Btn variant="outline" onClick={() => setLead("call")}><Phone size={15} />{t("cta_call")}</Btn>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">{t("disclaimer")}</p>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5">
              <button type="button" onClick={() => setShowHow(!showHow)} className="flex w-full items-center justify-between text-sm font-semibold" aria-expanded={showHow}><span className="flex items-center gap-2"><Info size={16} />{t("how")}</span><ChevronDown size={16} className={cx("transform transition", showHow && "rotate-180")} /></button>
              {showHow && <div className="vm-up mt-4 space-y-3 text-sm">
                <p className="text-slate-600">{t("how_intro")}</p>
                {r.items.map((it) => <div key={it.key} className="flex justify-between gap-4 border-b border-stone-100 pb-2"><div><div className="font-medium">{t("i_" + it.key)}</div><div className="text-xs text-slate-500">{howLine(it)}</div></div><div className="whitespace-nowrap tabular-nums">{money(it.value)} / {lang === "fr" ? "an" : "yr"}</div></div>)}
                <div className="pt-1 text-xs text-slate-500"><b>{t("sources")}</b> · {t("params", { v: P.version })}<ul className="mt-1 space-y-1">{SOURCES.map(([n, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{n}</a></li>)}</ul></div>
              </div>}
            </div>
          </div>
        </aside>
      </main>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold" style={{ fontFamily: SERIF }}>{t("steps_title")}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[[Calculator, "s1"], [Camera, "s2"], [Gavel, "s3"], [Key, "s4"]].map(([I, k], i) => (
            <div key={k} className="rounded-3xl border border-stone-200 bg-white p-6"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-teal-700"><I size={20} /></span><span className="text-sm font-bold tabular-nums text-slate-300">0{i + 1}</span></div><h3 className="mt-4 font-bold">{t(k + "_t")}</h3><p className="mt-1 text-sm text-slate-600">{t(k + "_b")}</p></div>))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold" style={{ fontFamily: SERIF }}>{t("cmp_title")}</h2>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-stone-200 bg-white">
          <table className="w-full min-w-max text-left text-sm">
            <thead><tr className="border-b border-stone-200"><th className="p-4" /><th className="bg-teal-50 p-4 font-bold text-teal-900">{t("cmp_auction")}</th><th className="p-4 font-semibold text-slate-600">{t("cmp_broker")}</th><th className="p-4 font-semibold text-slate-600">{t("cmp_ad")}</th></tr></thead>
            <tbody>{["cost", "date", "pay", "time"].map((k) => <tr key={k} className="border-b border-stone-100 last:border-0"><td className="p-4 font-semibold">{t("cmp_" + k)}</td><td className="bg-teal-50 p-4"><span className="inline-flex items-center gap-1"><Check size={14} className="text-teal-700" />{t(`cmp_${k}_a`)}</span></td><td className="p-4 text-slate-600">{t(`cmp_${k}_b`)}</td><td className="p-4 text-slate-600">{t(`cmp_${k}_c`)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-3xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold" style={{ fontFamily: SERIF }}>{t("faq_title")}</h2>
        <div className="mt-6 divide-y divide-stone-100 rounded-3xl border border-stone-200 bg-white">
          {["1", "2", "3"].map((n) => <details key={n} className="group p-5"><summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{t("q" + n)}<ChevronDown size={16} className="transition group-open:rotate-180" /></summary><p className="mt-2 text-sm text-slate-600">{t("a" + n)}</p></details>)}
        </div>
      </section>

      <footer className="mt-16 py-10 text-center text-xs text-slate-500" style={{ background: "#0B1F33" }}>
        <div className="flex items-center justify-center gap-2 text-slate-300"><ShieldCheck size={14} />{BRAND} · {t("disclaimer")} {t("demo")}</div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-stone-200 bg-white px-4 py-3 shadow-2xl sm:hidden">
        <div><div className="text-xs text-slate-500">{t("hero_live")}</div><div className="text-lg font-extrabold tabular-nums">{money(r.monthly)} <span className="text-xs font-normal text-slate-500">{t("per_month")}</span></div></div>
        <Btn variant="accent" className="px-4 py-2.5" onClick={() => setLead("sell")}>{t("cta_sell")}</Btn>
      </div>

      {lead && <LeadModal mode={lead} onClose={() => setLead(null)} t={t} sale={sale} shortFmt={shortFmt} summary={t("summary", { type: t("t_" + x.type), L: num(x.len, 1), y: x.year, v: money(x.value) })} monthly={money(r.monthly)} perMonth={t("per_month")} />}
    </div>
  );
}

function LeadModal({ mode, onClose, t, sale, shortFmt, summary, monthly, perMonth }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", consent: false });
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const needPhone = mode === "call";
  const submit = () => {
    if (!f.name.trim()) return setErr(t("lead_err_name"));
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr(t("lead_err_email"));
    if (needPhone && f.phone.replace(/[^\d]/g, "").length < 8) return setErr(t("lead_err_phone"));
    if (!f.consent) return setErr(t("lead_err_consent"));
    setErr(""); setDone(true); // production: POST /v1/leads with the estimator run id and the consent text version
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(8,18,32,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="vm-up relative w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 pb-3 pt-5">
          <h3 className="text-lg font-bold">{t("lead_title_" + mode)}</h3>
          <button type="button" onClick={onClose} aria-label={t("close")} className="rounded-full p-2 hover:bg-stone-100"><X size={18} /></button>
        </div>
        {done ? (
          <div className="p-6">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-teal-700"><Check size={22} /></div>
            <div className="mt-4 text-xl font-bold">{t("done_title")}</div>
            <p className="mt-2 text-sm text-slate-600">{t("done_body")}</p>
            {sale && <p className="mt-2 text-sm text-slate-600">{t("done_next", { d: shortFmt(sale.sale), e: shortFmt(sale.deadline) })}</p>}
            <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm"><div className="text-slate-600">{summary}</div><div className="mt-1 font-bold">{monthly} {perMonth}</div></div>
            <Btn className="mt-5 w-full" onClick={onClose}>{t("close")}</Btn>
          </div>
        ) : (
          <div className="space-y-3 p-6">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm"><div className="text-slate-600">{summary}</div><div className="mt-1 font-bold">{monthly} {perMonth}</div></div>
            {[["name", "lead_name"], ["email", "lead_email"], ["phone", needPhone ? "lead_phone" : "lead_phone_opt"]].map(([k, l]) => <input key={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} onKeyDown={onKey} placeholder={t(l)} aria-label={t(l)} inputMode={k === "phone" ? "tel" : k === "email" ? "email" : "text"} className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm" />)}
            <label className="flex gap-3 text-xs text-slate-600"><input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-0.5" style={{ accentColor: "#0d9488" }} />{t("lead_consent")}</label>
            {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
            <Btn variant="accent" className="w-full" onClick={submit}>{t("lead_submit")} <ArrowRight size={16} /></Btn>
            <p className="text-center text-xs text-slate-400">{t("demo")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
