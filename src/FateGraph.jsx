import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Lock,
  Share2,
  ArrowRight,
  Star,
  Check,
  X,
  Flame,
  TrendingUp,
  Heart,
  Zap,
  Mail,
  Clock,
  Crown,
  Users,
  Eye,
  Copy,
  Twitter,
  Instagram,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types (JSDoc-style for runtime, ready for TS migration)
// ─────────────────────────────────────────────────────────────
/**
 * @typedef {Object} AlternateLife
 * @property {string} id
 * @property {string} title
 * @property {string} emoji
 * @property {string} summary     - 2 sentences
 * @property {number} wealth      - 0..100
 * @property {number} happiness   - 0..100
 * @property {number} chaos       - 0..100
 * @property {string} tradeoff    - "big tradeoff" line
 * @property {string} accent      - tailwind-friendly accent tag
 */

/**
 * @typedef {Object} OnboardingAnswers
 * @property {string} birthplace
 * @property {string} whatIf
 * @property {string} dream
 */

// ─────────────────────────────────────────────────────────────
// Mock data (swap for LLM output later)
// ─────────────────────────────────────────────────────────────
const MOCK_LIVES = [
  {
    id: "life-1",
    title: "The Kyoto Ceramicist",
    emoji: "🏯",
    summary:
      "You moved to Japan at 24 and apprenticed under a fourth-generation potter. Your hands became famous before your name did.",
    wealth: 42,
    happiness: 91,
    chaos: 18,
    tradeoff: "Quiet mastery — but you never saw your mother again.",
    accent: "gold",
  },
  {
    id: "life-2",
    title: "The Hedge Fund Prodigy",
    emoji: "📈",
    summary:
      "You took the Goldman offer. By 31 you ran your own book in Greenwich and answered to no one but the market.",
    wealth: 97,
    happiness: 38,
    chaos: 64,
    tradeoff: "Three homes, two divorces, zero Sundays off.",
    accent: "emerald",
  },
  {
    id: "life-3",
    title: "The Desert Founder",
    emoji: "🌵",
    summary:
      "You built a solar startup in Arizona out of a garage. It failed twice before becoming the thing everyone calls inevitable.",
    wealth: 78,
    happiness: 72,
    chaos: 82,
    tradeoff: "You changed an industry and lost a decade of sleep.",
    accent: "indigo",
  },
  {
    id: "life-4",
    title: "The Lisbon Novelist",
    emoji: "📖",
    summary:
      "You chose the sabbatical that never ended. Three novels later, a small but devoted readership knows your name in four languages.",
    wealth: 31,
    happiness: 84,
    chaos: 22,
    tradeoff: "Deep work, shallow bank account.",
    accent: "rose",
  },
  {
    id: "life-5",
    title: "The Field Medic",
    emoji: "⚕️",
    summary:
      "You said yes to the scholarship in Nairobi. You've delivered 400 babies and buried more friends than you'll admit.",
    wealth: 28,
    happiness: 76,
    chaos: 88,
    tradeoff: "A life of meaning, at the edge of burnout.",
    accent: "amber",
  },
];

// ─────────────────────────────────────────────────────────────
// Personalization engine
// ─────────────────────────────────────────────────────────────
// NOTE FOR LLM INTEGRATION:
// Replace `generateLivesFromAnswers` with an async function that calls
// your backend / LLM endpoint. The LLM should return JSON matching the
// AlternateLife[] shape documented at the top of this file. Everything
// downstream (cards, graph, share card) already consumes that shape.
//
// Example future swap:
//   export async function generateLivesFromAnswers(answers) {
//     const res = await fetch("/api/fate", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(answers),
//     });
//     const { lives } = await res.json(); // AlternateLife[]
//     return sanitizeLives(lives);
//   }
//
// WRITING CONTRACT (applies to local generator AND any future LLM):
//   • No invented ages, decades, or age milestones
//   • No locations other than what the user wrote (birthplace stays OK)
//   • No fabricated biographical facts (kids, divorces, job titles, degrees)
//   • Summaries interpret the fork, they don't narrate a résumé
//   • Two sentences max. Elegant, cinematic, emotionally sharp, slightly mystical.
// ─────────────────────────────────────────────────────────────

// Tiny deterministic hash → stable outputs for the same inputs
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// Seeded PRNG (mulberry32) so the same answers always yield the same fates
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const range = (rand, lo, hi) => Math.round(lo + rand() * (hi - lo));

// Region → emoji/accent only. We do NOT use this to invent cities anymore.
function inferRegion(birthplace = "") {
  const b = birthplace.toLowerCase();
  const map = [
    { test: /(japan|tokyo|kyoto|osaka|seoul|korea|taipei|taiwan)/, emoji: "🏯", accent: "rose" },
    { test: /(china|beijing|shanghai|hong kong|singapore|bangkok|vietnam|hanoi|manila|jakarta|bali)/, emoji: "🏮", accent: "rose" },
    { test: /(india|delhi|mumbai|bangalore|kolkata|pakistan|bangladesh|nepal)/, emoji: "🕌", accent: "amber" },
    { test: /(dubai|abu dhabi|qatar|saudi|tehran|iran|istanbul|turkey|beirut|cairo|egypt|morocco|tunis)/, emoji: "🕋", accent: "amber" },
    { test: /(italy|rome|milan|naples|florence|venice|sicily|italia|napoli|roma|milano)/, emoji: "🍋", accent: "gold" },
    { test: /(france|paris|lyon|marseille|nice)/, emoji: "🥐", accent: "rose" },
    { test: /(spain|madrid|barcelona|sevilla|lisbon|portugal|porto)/, emoji: "🍊", accent: "amber" },
    { test: /(germany|berlin|munich|hamburg|austria|vienna|zurich|swiss|switzerland|amsterdam|netherlands|belgium|brussels)/, emoji: "🌆", accent: "indigo" },
    { test: /(london|manchester|england|uk|scotland|edinburgh|dublin|ireland)/, emoji: "☕", accent: "indigo" },
    { test: /(stockholm|oslo|copenhagen|helsinki|reykjavik|norway|sweden|finland|denmark|iceland)/, emoji: "❄️", accent: "indigo" },
    { test: /(moscow|kyiv|kiev|warsaw|prague|budapest|romania|bulgaria|serbia|russia|ukraine|poland)/, emoji: "🏛️", accent: "indigo" },
    { test: /(new york|nyc|brooklyn|manhattan|boston|philadelphia|chicago|detroit|cleveland)/, emoji: "🗽", accent: "emerald" },
    { test: /(los angeles|la,|san francisco|sf,|seattle|portland|san diego|las vegas)/, emoji: "🌴", accent: "emerald" },
    { test: /(texas|austin|houston|dallas|miami|atlanta|nashville|new orleans|arizona|phoenix)/, emoji: "🌵", accent: "amber" },
    { test: /(usa|united states|america|canada|toronto|vancouver|montreal)/, emoji: "🏙️", accent: "emerald" },
    { test: /(mexico|cuba|havana|puerto rico|dominican|guatemala|costa rica|panama)/, emoji: "🌮", accent: "amber" },
    { test: /(brazil|rio|sao paulo|são paulo|argentina|buenos aires|chile|santiago|peru|lima|colombia|bogota|medellin)/, emoji: "🌺", accent: "rose" },
    { test: /(kenya|nairobi|nigeria|lagos|ghana|accra|south africa|johannesburg|cape town|ethiopia|uganda|tanzania|senegal)/, emoji: "🌍", accent: "amber" },
    { test: /(sydney|melbourne|brisbane|australia|auckland|wellington|new zealand)/, emoji: "🏖️", accent: "emerald" },
  ];
  for (const m of map) if (m.test.test(b)) return m;
  return { emoji: "🌍", accent: "indigo" };
}

// Pull 1–3 short keywords out of a free-text answer
function extractKeywords(text = "") {
  const stop = new Set([
    "the","a","an","and","or","but","if","i","my","me","we","you","to","of","in","on","at","for","with","by","is","was","were","be","been","being","have","has","had","do","does","did","it","this","that","those","these","about","would","could","should","not","no","so","up","down","out","over","under","into","from","as","than","then","there","their","they","them","our","your","his","her","its","him","she","he","just","more","most","much","very","really","like","when","where","what","who","how","why","gave","giving","given","become","became","becoming","want","wanted","wanting"
  ]);
  return (text.toLowerCase().match(/[a-zà-ÿ']{3,}/gi) || [])
    .filter((w) => !stop.has(w))
    .slice(0, 3);
}

function titleCase(s) {
  if (!s) return "";
  return s.split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
}

// Lowercase, trim trailing punctuation — useful when embedding the user's own
// line back into a sentence without it reading like a quote from a CV.
function softenFragment(s = "") {
  return s.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[.?!]+$/g, "");
}

// ─────────────────────────────────────────────────────────────
// Style guardrail
// ─────────────────────────────────────────────────────────────
// Filters/rewrites any sentence that slips in forbidden specifics:
//   • ages / decades ("at 24", "by 31", "in your thirties", "mid-thirties")
//   • invented locations (anything country-like or Proper-Case that wasn't
//     in the user's birthplace)
//   • invented facts (children, divorces, specific job titles, degrees,
//     house counts, etc.)
// If the whole sentence is unsalvageable, it gets replaced with a safe
// interpretive fallback so the UI never renders biography-flavored slop.
// ─────────────────────────────────────────────────────────────
const FORBIDDEN_PATTERNS = [
  // ages & decade markers
  /\bat\s+\d{1,2}\b/gi,
  /\bby\s+\d{1,2}\b/gi,
  /\b(in|by)\s+(your\s+)?(early|mid|late)[-\s]?(twenties|thirties|forties|fifties|sixties)\b/gi,
  /\b(your\s+)?(early|mid|late)[-\s]?(twenties|thirties|forties|fifties|sixties)\b/gi,
  /\bmid-?\d{2}s\b/gi,
  // invented biographical specifics
  /\b(two|three|four|five)\s+(kids|children|divorces|homes|marriages|degrees|novels|companies|startups)\b/gi,
  /\b\d+\s+(years|decades)\s+(later|on|in)\b/gi,
  /\b(goldman|greenwich|harvard|stanford|mit|oxford|cambridge)\b/gi,
];

function stripAgeAndInventedFacts(sentence) {
  let s = sentence;
  for (const p of FORBIDDEN_PATTERNS) s = s.replace(p, "");
  // collapse whitespace + orphaned punctuation (but leave em-dash spacing alone)
  s = s.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  s = s.replace(/^[\s,;—-]+/, "").replace(/[\s,;]+$/, "");
  return s;
}

// Build an allowlist of place-words the user actually mentioned.
// Anything else in ProperCase inside a summary/tradeoff will be scrubbed.
function buildAllowedPlaceSet(birthplace = "") {
  const tokens = birthplace
    .split(/[,\/&]| and | e /i)
    .map((t) => t.trim())
    .filter(Boolean);
  const set = new Set();
  for (const t of tokens) {
    for (const w of t.split(/\s+/)) {
      if (w.length >= 2) set.add(w.toLowerCase());
    }
  }
  return set;
}

// Strip ProperCase words that look like invented places (not in the allowed
// set, not common English ProperCase words). We err heavily on the side of
// keeping words — false positives ruin the prose far more than the occasional
// invented proper noun slipping through.
const ALLOWED_PROPER = new Set([
  // pronouns / articles / filler
  "the","you","your","a","an","i","it","he","she","they","we","us","me","my",
  // sentence-starter common words (ProperCase at start of sentence)
  "in","on","at","for","with","by","of","to","and","or","but","if","as","so",
  "this","that","those","these","here","there","now","then","when","while",
  "everything","nothing","something","anyone","someone","no one","nobody",
  "every","all","most","some","many","few","each","both",
  "what","which","who","how","why","where",
  // topical words we use in copy
  "home","dream","fork","door","other","letter","graph","fate","life","lives",
  "yes","no","never","always","sometimes","often","still","just",
  // common verbs/adjectives that may start a sentence
  "be","been","being","was","were","is","are","am","have","has","had","do","does","did",
  "nothing","quiet","loud","deep","small","specific","soft","sharp","light","dark",
]);
function scrubInventedPlaces(sentence, allowedPlaces) {
  // Split into sentences to exempt sentence-initial ProperCase words, which
  // are almost never invented place names — they're just capitalized because
  // they start the sentence.
  const parts = sentence.split(/(\s*[.!?]\s*)/);
  const scrubbed = parts.map((part, idx) => {
    // Delimiters go through unchanged
    if (idx % 2 === 1) return part;
    let firstWordSeen = false;
    return part.replace(/\b([A-Z][a-zà-ÿ]{2,})\b/g, (match, _w, offset, full) => {
      // Is this the first ProperCase word in this sentence fragment? Keep it.
      // (Any word that sits at the very start, possibly preceded by whitespace
      //  or an opening quote, is treated as sentence-initial.)
      const before = full.slice(0, offset);
      const isSentenceStart = !firstWordSeen && /^[\s"'\u201C\u2018(\[]*$/.test(before);
      if (isSentenceStart) { firstWordSeen = true; return match; }
      firstWordSeen = true;
      const lower = match.toLowerCase();
      if (allowedPlaces.has(lower)) return match;
      if (ALLOWED_PROPER.has(lower)) return match;
      // Looks like an invented place or proper noun → drop it.
      return "";
    });
  }).join("");
  return scrubbed.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}

// Safe interpretive fallbacks if a sentence is empty after sanitizing.
const SAFE_SUMMARY_FALLBACKS = [
  "In this life, the version of you that chose differently is steadier than the one who didn't.",
  "Here, the fork resolves in the quieter direction — and something in you finally exhales.",
  "This is the timeline where the question stopped being a question.",
  "On this branch, the thing you almost did became the thing you simply do.",
  "In this version, the door you didn't open in ours stands wide open — and you walked through without looking back.",
];
const SAFE_TRADEOFF_FALLBACKS = [
  "Clarity, at the cost of the life you could have explained to your parents.",
  "You gained the answer and lost the question.",
  "A quieter mind, a smaller room.",
  "You traded certainty for oxygen.",
  "Nothing is missing — except the noise.",
];

function sanitizeText(text, allowedPlaces, rand, fallbacks) {
  if (!text) return pick(rand, fallbacks);
  let out = stripAgeAndInventedFacts(text);
  out = scrubInventedPlaces(out, allowedPlaces);
  // If we shredded it down to nothing meaningful, use a safe fallback.
  if (out.replace(/[^\wà-ÿ]/gi, "").length < 20) return pick(rand, fallbacks);
  return out;
}

function sanitizeLives(lives, allowedPlaces, rand) {
  return lives.map((l) => ({
    ...l,
    summary: sanitizeText(l.summary, allowedPlaces, rand, SAFE_SUMMARY_FALLBACKS),
    tradeoff: sanitizeText(l.tradeoff, allowedPlaces, rand, SAFE_TRADEOFF_FALLBACKS),
  }));
}

/**
 * generateLivesFromAnswers
 * Deterministic local generator. Same inputs → same 5 lives.
 * Returns AlternateLife[] in the same shape as MOCK_LIVES.
 *
 * Branch allocation:
 *   #1 root/birthplace · #2 what-if (taken) · #3 what-if (refused)
 *   #4 dream (pursued directly) · #5 dream (refracted sideways)
 *
 * @param {OnboardingAnswers} answers
 * @returns {AlternateLife[]}
 */
function generateLivesFromAnswers(answers) {
  if (!answers || !answers.birthplace || !answers.whatIf || !answers.dream) {
    return MOCK_LIVES;
  }

  const { birthplace, whatIf, dream } = answers;
  const seed = hashString(`${birthplace}::${whatIf}::${dream}`);
  const rand = mulberry32(seed);

  const region = inferRegion(birthplace);
  const allowedPlaces = buildAllowedPlaceSet(birthplace);

  // Fragments we'll weave into summaries, grounded strictly in user text.
  const whatIfFragment = softenFragment(whatIf);                // "i'd taken the job in tokyo"
  const dreamFragment = softenFragment(dream);                  // "becoming a concert cellist"
  const dreamKeys = extractKeywords(dream);
  const whatIfKeys = extractKeywords(whatIf);
  const dreamNoun = dreamKeys[0] ? titleCase(dreamKeys[0]) : "the Dream";
  const whatIfNoun = whatIfKeys[0] ? titleCase(whatIfKeys[0]) : "the Fork";

  // Title archetypes — symbolic, not geographic, unless they can ride on
  // something the user actually typed (dreamNoun/whatIfNoun).
  const ROOT_TITLES = ["The One Who Stayed","The Quiet Inheritor","The Keeper of the Room","The Unleft Life"];
  const WHATIF_TAKEN_TITLES = [`The ${whatIfNoun} Path`,"The Door You Opened","The Line You Crossed","The Yes"];
  const WHATIF_REFUSED_TITLES = ["The Unsent Letter","The Other Door","The Quiet Defector","The Late Reversal"];
  const DREAM_DIRECT_TITLES = [`The ${dreamNoun} Devotee`,`The ${dreamNoun} Lifer`,"The Small, Specific Life","The Long Apprenticeship"];
  const DREAM_REFRACTED_TITLES = ["The Reluctant Translator","The Accidental Steward","The Half-Finished Thing","The Curator"];

  const lives = [
    // #1 — ROOT / birthplace-rooted: the stayed version of you
    {
      id: "life-1",
      title: pick(rand, ROOT_TITLES),
      emoji: region.emoji,
      summary: `In this life you never asked the question — you stayed inside the version of yourself the place first made. Everything that happens here happens slowly, and on purpose.`,
      wealth: range(rand, 35, 58),
      happiness: range(rand, 68, 84),
      chaos: range(rand, 12, 28),
      tradeoff: `A life with no missing pieces, and no thrown-open windows either.`,
      accent: region.accent,
    },

    // #2 — WHAT-IF TAKEN: you said yes to the fork
    {
      id: "life-2",
      title: pick(rand, WHATIF_TAKEN_TITLES),
      emoji: pick(rand, ["🗝️","🧭","🕯️","🪞","🪶"]),
      summary: `Here, the version of you that said yes to "${whatIfFragment}" is the only one that exists. Nothing about this life is louder than our own — it's just more clearly yours.`,
      wealth: range(rand, 55, 76),
      happiness: range(rand, 72, 88),
      chaos: range(rand, 25, 42),
      tradeoff: `You proved the door was real, and had to close every other one to do it.`,
      accent: "gold",
    },

    // #3 — WHAT-IF REFUSED: you said no, harder than in ours
    {
      id: "life-3",
      title: pick(rand, WHATIF_REFUSED_TITLES),
      emoji: pick(rand, ["✉️","🚪","🌒","🧳"]),
      summary: `In this timeline you didn't just refuse "${whatIfFragment}" — you built an entire life around refusing it. The shape of that no is everywhere, quiet and load-bearing.`,
      wealth: range(rand, 42, 64),
      happiness: range(rand, 54, 72),
      chaos: range(rand, 48, 70),
      tradeoff: `You got the answer you wanted, and a question you never asked for.`,
      accent: "indigo",
    },

    // #4 — DREAM PURSUED DIRECTLY
    {
      id: "life-4",
      title: pick(rand, DREAM_DIRECT_TITLES),
      emoji: pick(rand, ["🎻","📖","🎨","🎬","🪕"]),
      summary: `This is the life where you never let go of ${dreamFragment}. The work is small, specific, and entirely yours — and it is the only thing the day is really for.`,
      wealth: range(rand, 22, 45),
      happiness: range(rand, 82, 94),
      chaos: range(rand, 18, 36),
      tradeoff: `Deep meaning, thin margins — and a quiet no one ever tries to take from you.`,
      accent: "rose",
    },

    // #5 — DREAM REFRACTED: came back sideways, through other people
    {
      id: "life-5",
      title: pick(rand, DREAM_REFRACTED_TITLES),
      emoji: pick(rand, ["🎭","🏛️","🛠️","🎙️"]),
      summary: `Here, ${dreamFragment} refused to die — so it came back sideways, through the work you do for other people. You built the room, and the thing you once wanted lives in it now, wearing someone else's face.`,
      wealth: range(rand, 60, 82),
      happiness: range(rand, 62, 78),
      chaos: range(rand, 55, 78),
      tradeoff: `You became the person who makes it possible — instead of the person who makes it.`,
      accent: "emerald",
    },
  ];

  return sanitizeLives(lives, allowedPlaces, rand);
}

const TESTIMONIALS = [
  {
    name: "Amelia R.",
    location: "Brooklyn, NY",
    text: "I ugly-cried at life #3. It's the one I almost chose. How does this thing know.",
    stars: 5,
  },
  {
    name: "Marcus T.",
    location: "London, UK",
    text: "Shared mine at a dinner party. Half the table went quiet. Best £9 I've spent this year.",
    stars: 5,
  },
  {
    name: "Priya S.",
    location: "Toronto, CA",
    text: "More useful than my last therapy session. I'm not joking.",
    stars: 5,
  },
];

// ─────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────

const GoldButton = ({
  children,
  onClick,
  className = "",
  type = "primary",
  disabled = false,
}) => {
  const base =
    "relative overflow-hidden font-medium tracking-wide transition-all duration-300";
  const clickable = !disabled
    ? "active:scale-[0.98] cursor-pointer"
    : "cursor-not-allowed";

  if (type === "primary") {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-disabled={disabled}
        className={`${base} ${clickable} group w-full rounded-full px-6 py-4 ${
          disabled
            ? "bg-slate-700/60 text-slate-300 shadow-none"
            : "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 text-slate-900 shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(251,191,36,0.8)]"
        } ${className}`}
      >
        <span className="relative z-10 flex items-center justify-center gap-2 font-semibold">
          {children}
        </span>
        {!disabled && (
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        )}
      </button>
    );
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${base} ${clickable} w-full rounded-full border border-white/15 bg-white/5 px-6 py-4 text-white/90 backdrop-blur hover:bg-white/10 ${
        disabled ? "text-white/40" : ""
      } ${className}`}
    >
      <span className="flex items-center justify-center gap-2">{children}</span>
    </button>
  );
};

const Stat = ({ label, value, icon: Icon, color }) => (
  <div className="flex-1">
    <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-white/50">
      <Icon className="h-3 w-3" />
      {label}
    </div>
    <div className="mb-1 flex items-baseline gap-1">
      <span className="font-serif text-2xl text-white">{value}</span>
      <span className="text-xs text-white/40">/100</span>
    </div>
    <div className="h-1 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value}%`, transition: "width 1.2s cubic-bezier(.2,.8,.2,1)" }}
      />
    </div>
  </div>
);

const Starfield = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.08),transparent_60%)]" />
    <div className="stars" />
    <style>{`
      .stars {
        position: absolute; inset: 0;
        background-image:
          radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent),
          radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.4), transparent),
          radial-gradient(1.5px 1.5px at 65% 20%, rgba(255,255,255,0.5), transparent),
          radial-gradient(1px 1px at 80% 80%, rgba(255,255,255,0.6), transparent),
          radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.3), transparent),
          radial-gradient(1.5px 1.5px at 15% 85%, rgba(255,255,255,0.4), transparent),
          radial-gradient(1px 1px at 55% 50%, rgba(255,255,255,0.3), transparent);
        background-size: 100% 100%;
        animation: twinkle 6s ease-in-out infinite;
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes float-slow {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pulse-gold {
        0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.3); }
        50% { box-shadow: 0 0 40px rgba(251,191,36,0.6); }
      }
      @keyframes fadeSlide {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes draw-line {
        from { stroke-dashoffset: 200; }
        to { stroke-dashoffset: 0; }
      }
    `}</style>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Screens
// ─────────────────────────────────────────────────────────────

function HeroScreen({ onStart }) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-12">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 blur-sm opacity-60" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500">
              <Sparkles className="h-4 w-4 text-slate-900" />
            </div>
          </div>
          <span className="font-serif text-lg tracking-wider text-white">
            FateGraph
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span>1,247 reading fates now</span>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-1 flex-col justify-center py-12">
        <div
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1.5 text-xs text-amber-200/90"
          style={{ animation: "fadeSlide 0.8s ease-out" }}
        >
          <Flame className="h-3 w-3" />
          <span className="tracking-wide">Limited to 500 new readings today</span>
        </div>

        <h1
          className="font-serif text-[44px] leading-[1.05] tracking-tight text-white sm:text-5xl"
          style={{ animation: "fadeSlide 0.9s ease-out 0.1s both" }}
        >
          See the{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text italic text-transparent">
              5 lives
            </span>
            <svg
              className="absolute -bottom-1 left-0 w-full"
              height="6"
              viewBox="0 0 100 6"
              preserveAspectRatio="none"
            >
              <path
                d="M0,3 Q25,0 50,3 T100,3"
                stroke="url(#g)"
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0" stopColor="#fde68a" />
                  <stop offset="1" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <br />
          you could have lived.
        </h1>

        <p
          className="mt-5 max-w-md text-[15px] leading-relaxed text-white/60"
          style={{ animation: "fadeSlide 1s ease-out 0.25s both" }}
        >
          A cinematic AI reading of the lives waiting on the other side of your
          biggest what-ifs. Three questions. Ninety seconds. One you'll never forget.
        </p>

        <div
          className="mt-8"
          style={{ animation: "fadeSlide 1s ease-out 0.4s both" }}
        >
          <GoldButton onClick={onStart}>
            Read My Fate
            <ArrowRight className="h-4 w-4" />
          </GoldButton>
          <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-white/40">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" /> No signup to start
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" /> 90 seconds
            </span>
          </div>
        </div>
      </div>

      {/* Social proof */}
      <div
        className="space-y-4"
        style={{ animation: "fadeSlide 1s ease-out 0.6s both" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {["#fbbf24", "#a78bfa", "#f472b6", "#34d399"].map((c, i) => (
              <div
                key={i}
                className="h-7 w-7 rounded-full border-2 border-slate-950"
                style={{ background: `linear-gradient(135deg, ${c}, #1e293b)` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
            ))}
          </div>
          <span className="text-xs text-white/60">
            <span className="text-white/90">4.9</span> from 32,104 readings
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
          <div className="mb-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-300 text-amber-300" />
            ))}
          </div>
          <p className="text-sm italic text-white/80">"{TESTIMONIALS[0].text}"</p>
          <p className="mt-2 text-[11px] text-white/40">
            — {TESTIMONIALS[0].name}, {TESTIMONIALS[0].location}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function OnboardingScreen({ step, answers, setAnswers, onNext, onBack }) {
  const steps = [
    {
      key: "birthplace",
      label: "Where were you born?",
      hint: "City, country — we read the threads of place.",
      placeholder: "e.g. Naples, Italy",
      icon: "🌍",
    },
    {
      key: "whatIf",
      label: "Your biggest what-if.",
      hint: "The moment the path forked. Be specific.",
      placeholder: "e.g. If I'd taken the job in Tokyo at 23…",
      icon: "🔀",
      multiline: true,
    },
    {
      key: "dream",
      label: "A dream you gave up on.",
      hint: "Name it. The graph listens.",
      placeholder: "e.g. Becoming a concert cellist.",
      icon: "🕊️",
      multiline: true,
    },
  ];

  const current = steps[step];
  const value = answers[current.key] || "";
  const canProceed = value.trim().length >= 2;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="relative z-10 flex min-h-screen flex-col px-6 pb-10 pt-12">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-xs tracking-wide text-white/50 transition hover:text-white"
        >
          ← Back
        </button>
        <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-200 to-amber-400"
            style={{ width: `${progress}%`, transition: "width 0.5s ease-out" }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-white/40">
          {step + 1} / {steps.length}
        </span>
      </div>

      <div
        key={step}
        className="flex flex-1 flex-col justify-center py-10"
        style={{ animation: "fadeSlide 0.5s ease-out" }}
      >
        <div className="mb-5 text-4xl">{current.icon}</div>
        <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
          {current.label}
        </h2>
        <p className="mt-2 text-sm text-white/50">{current.hint}</p>

        <div className="mt-8">
          {current.multiline ? (
            <textarea
              autoFocus
              value={value}
              onChange={(e) =>
                setAnswers({ ...answers, [current.key]: e.target.value })
              }
              placeholder={current.placeholder}
              rows={4}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ WebkitTextFillColor: "#0f172a", color: "#0f172a" }}
              className="fg-input w-full resize-none rounded-2xl border border-white/20 bg-white px-4 py-4 text-[15px] text-slate-900 caret-slate-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40"
            />
          ) : (
            <input
              autoFocus
              value={value}
              onChange={(e) =>
                setAnswers({ ...answers, [current.key]: e.target.value })
              }
              placeholder={current.placeholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              style={{ WebkitTextFillColor: "#0f172a", color: "#0f172a" }}
              className="fg-input w-full rounded-2xl border border-white/20 bg-white px-4 py-4 text-[15px] text-slate-900 caret-slate-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40"
            />
          )}
        </div>
      </div>

      <GoldButton onClick={onNext} disabled={!canProceed}>
        {step === steps.length - 1 ? "Reveal My Fates" : "Continue"}
        <ArrowRight className="h-4 w-4" />
      </GoldButton>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function LoadingScreen({ onDone }) {
  const phases = [
    "Reading your birth coordinates…",
    "Mapping the fork in your timeline…",
    "Simulating 12,847 parallel lives…",
    "Collapsing the graph to 5…",
    "Almost there…",
  ];
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const total = 4800;
    const each = total / phases.length;
    const id = setInterval(() => {
      setPhase((p) => {
        if (p >= phases.length - 1) {
          clearInterval(id);
          setTimeout(onDone, each);
          return p;
        }
        return p + 1;
      });
    }, each);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
      <div className="relative mb-12">
        <div
          className="absolute inset-0 rounded-full bg-amber-300/20 blur-3xl"
          style={{ animation: "pulse-gold 2s ease-in-out infinite" }}
        />
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Orbits */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-amber-200/20"
              style={{
                inset: `${i * 12}px`,
                animation: `spin ${8 + i * 4}s linear infinite ${i % 2 ? "reverse" : ""}`,
              }}
            >
              <div
                className="absolute h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                style={{ top: "-3px", left: "50%", transform: "translateX(-50%)" }}
              />
            </div>
          ))}
          <Sparkles className="relative h-10 w-10 text-amber-200" />
        </div>
      </div>

      <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
        Calculating Destiny
      </div>
      <h3 className="mb-8 text-center font-serif text-2xl text-white">
        The FateGraph is forming…
      </h3>

      <div className="min-h-[1.5rem] text-center text-sm text-white/60">
        <span key={phase} style={{ animation: "fadeSlide 0.6s ease-out" }}>
          {phases[phase]}
        </span>
      </div>

      <div className="mt-8 flex gap-1.5">
        {phases.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full transition-all duration-500 ${
              i <= phase ? "bg-amber-300" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function LifeCard({ life, locked = false, index = 0, onUnlock }) {
  const accentMap = {
    gold: "from-amber-300 to-yellow-500",
    emerald: "from-emerald-300 to-teal-500",
    indigo: "from-indigo-300 to-violet-500",
    rose: "from-rose-300 to-pink-500",
    amber: "from-amber-300 to-orange-500",
  };
  const ring = accentMap[life.accent] || accentMap.gold;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur"
      style={{ animation: `fadeSlide 0.7s ease-out ${index * 0.08}s both` }}
    >
      {/* Glow accent */}
      <div
        className={`absolute -left-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${ring} opacity-20 blur-2xl`}
      />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${ring} text-xl shadow-lg`}
            >
              {life.emoji}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">
                Life {index + 1}
              </div>
              <h3 className="font-serif text-lg leading-tight text-white">
                {life.title}
              </h3>
            </div>
          </div>
        </div>

        <div className={locked ? "relative" : ""}>
          <div className={locked ? "select-none blur-md" : ""}>
            <p className="mb-4 text-[13px] leading-relaxed text-white/70">
              {life.summary}
            </p>

            <div className="mb-4 flex gap-4">
              <Stat
                label="Wealth"
                value={life.wealth}
                icon={TrendingUp}
                color="bg-gradient-to-r from-emerald-300 to-emerald-500"
              />
              <Stat
                label="Joy"
                value={life.happiness}
                icon={Heart}
                color="bg-gradient-to-r from-rose-300 to-pink-500"
              />
              <Stat
                label="Chaos"
                value={life.chaos}
                icon={Zap}
                color="bg-gradient-to-r from-amber-300 to-orange-500"
              />
            </div>

            <div className="rounded-xl border border-amber-200/10 bg-amber-200/[0.04] p-3">
              <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-amber-200/70">
                The Tradeoff
              </div>
              <p className="text-[13px] italic text-white/80">{life.tradeoff}</p>
            </div>
          </div>

          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/30 bg-slate-900/80 backdrop-blur">
                <Lock className="h-5 w-5 text-amber-200" />
              </div>
              <button
                onClick={onUnlock}
                className="mt-3 rounded-full border border-amber-200/40 bg-amber-200/10 px-4 py-1.5 text-xs font-medium tracking-wide text-amber-100 backdrop-blur transition hover:bg-amber-200/20"
              >
                Unlock this life
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function ResultsScreen({ answers, lives, unlocked, onUnlock, onShare, onRegen }) {
  return (
    <div className="relative z-10 min-h-screen px-6 pb-24 pt-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200/70">
            Your FateGraph
          </div>
          <h2 className="font-serif text-3xl text-white">The 5 lives.</h2>
        </div>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 backdrop-blur transition hover:bg-white/10"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </div>

      {/* Central node + graph visualization */}
      <div className="relative mb-8 flex h-44 items-center justify-center">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 300 180"
          preserveAspectRatio="none"
        >
          {[
            [60, 30],
            [240, 30],
            [40, 150],
            [260, 150],
            [150, 170],
          ].map(([x, y], i) => (
            <line
              key={i}
              x1="150"
              y1="90"
              x2={x}
              y2={y}
              stroke="url(#linegrad)"
              strokeWidth="1"
              strokeDasharray="200"
              style={{
                animation: `draw-line 1.5s ease-out ${i * 0.15}s both`,
              }}
            />
          ))}
          <defs>
            <linearGradient id="linegrad" x1="0" x2="1">
              <stop offset="0" stopColor="#fde68a" stopOpacity="0.6" />
              <stop offset="1" stopColor="#fde68a" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Branch dots */}
        {[
          { x: "20%", y: "17%" },
          { x: "80%", y: "17%" },
          { x: "13%", y: "83%" },
          { x: "87%", y: "83%" },
          { x: "50%", y: "95%" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-amber-300"
            style={{
              left: p.x,
              top: p.y,
              transform: "translate(-50%,-50%)",
              boxShadow: "0 0 12px rgba(251,191,36,0.8)",
              animation: `fadeSlide 0.6s ease-out ${0.6 + i * 0.12}s both`,
            }}
          />
        ))}

        {/* Center node */}
        <div className="relative z-10">
          <div
            className="absolute inset-0 rounded-full bg-amber-300/30 blur-2xl"
            style={{ animation: "pulse-gold 3s ease-in-out infinite" }}
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/40 bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-widest text-amber-200/70">
                You
              </div>
              <div className="font-serif text-xs text-white">now</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {lives.map((life, i) => (
          <LifeCard
            key={life.id}
            life={life}
            locked={!unlocked && i !== 0}
            index={i}
            onUnlock={onUnlock}
          />
        ))}
      </div>

      {/* Regenerate */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
            <Clock className="h-4 w-4 text-white/50" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-white/90">Generate a new fate</div>
            <div className="text-[11px] text-white/40">
              Available in 23h 47m — one reading per day
            </div>
          </div>
          <Lock className="h-4 w-4 text-white/30" />
        </div>
      </div>

      {/* Bottom share CTA */}
      {unlocked && (
        <button
          onClick={onShare}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-amber-200/30 bg-amber-200/[0.06] py-4 text-sm font-medium text-amber-100 backdrop-blur transition hover:bg-amber-200/10"
        >
          <Share2 className="h-4 w-4" />
          Share your fate
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function EmailCaptureModal({ onSubmit, onClose, livesPayload }) {
  const [email, setEmail] = useState("");
  const valid = /^\S+@\S+\.\S+$/.test(email);
  const formRef = useRef(null);

  // The form posts natively (no fetch) to Formspree and targets a hidden
  // iframe so the current page is NOT navigated away. After the browser
  // fires the POST, we continue the app flow via onSubmit(email).
  const handleRealSubmit = (e) => {
    if (!valid) {
      e.preventDefault();
      return;
    }
    // Let the native POST happen. Immediately after, advance the app.
    // We don't await Formspree — the hidden iframe receives its response.
    setTimeout(() => onSubmit(email), 50);
  };

  const messagePayload =
    typeof livesPayload === "string"
      ? livesPayload
      : JSON.stringify(livesPayload || {}, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-md sm:items-center">
      {/* Hidden iframe — swallows Formspree's "thanks" redirect so the
          current page doesn't navigate away. */}
      <iframe
        name="fategraph-formspree-sink"
        title="formspree-sink"
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl border-t border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 pt-8 sm:rounded-3xl sm:border"
        style={{ animation: "fadeSlide 0.5s ease-out" }}
      >
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500">
              <Mail className="h-5 w-5 text-slate-900" />
            </div>
          </div>

          <h3 className="mb-2 text-center font-serif text-2xl text-white">
            One step before the reveal.
          </h3>
          <p className="mb-6 text-center text-sm text-white/50">
            We'll send you a private copy of your FateGraph. No spam. Ever.
          </p>

          {/* Real native HTML form POST to Formspree. target=iframe
              prevents page navigation. */}
          <form
            ref={formRef}
            action="https://formspree.io/f/xzdyvpdb"
            method="POST"
            target="fategraph-formspree-sink"
            onSubmit={handleRealSubmit}
          >
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              inputMode="email"
              required
              style={{ WebkitTextFillColor: "#0f172a", color: "#0f172a" }}
              className="fg-input mb-4 w-full rounded-2xl border border-white/20 bg-white px-4 py-4 text-[15px] text-slate-900 caret-slate-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40"
            />

            {/* Hidden payload — Formspree will receive this as "message". */}
            <textarea
              name="message"
              defaultValue={messagePayload}
              readOnly
              style={{ display: "none" }}
              aria-hidden="true"
            />
            {/* Optional: a subject line in the Formspree email */}
            <input
              type="hidden"
              name="_subject"
              value="New FateGraph reading"
            />

            <button
              type="submit"
              disabled={!valid}
              className={`group relative w-full overflow-hidden rounded-full px-6 py-4 font-semibold tracking-wide transition-all duration-300 ${
                valid
                  ? "bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 text-slate-900 shadow-[0_10px_40px_-10px_rgba(251,191,36,0.6)] hover:shadow-[0_15px_50px_-10px_rgba(251,191,36,0.8)] active:scale-[0.98]"
                  : "cursor-not-allowed bg-slate-700/60 text-slate-300"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Reveal My FateGraph
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-center text-xs text-white/40 transition hover:text-white/70"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function PaywallModal({ onClose, onUnlock }) {
  const [plan, setPlan] = useState("lifetime");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/85 backdrop-blur-md sm:items-center">
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 pt-6 sm:rounded-3xl sm:border"
        style={{ animation: "fadeSlide 0.5s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative">
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-300/40 blur-xl" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-500">
                <Crown className="h-6 w-6 text-slate-900" />
              </div>
            </div>
          </div>

          <h3 className="mb-2 text-center font-serif text-[26px] leading-tight text-white">
            Unlock all 5 lives.
          </h3>
          <p className="mb-5 text-center text-sm text-white/50">
            You've seen one. The other four are waiting.
          </p>

          {/* Scarcity */}
          <div className="mb-6 flex items-center justify-center gap-2 rounded-full border border-rose-300/20 bg-rose-300/5 px-3 py-2">
            <Flame className="h-3.5 w-3.5 text-rose-300" />
            <span className="text-[11px] tracking-wide text-rose-200/90">
              Launch price ends tonight — <span className="font-bold">47% off</span>
            </span>
          </div>

          {/* Plans */}
          <div className="mb-4 space-y-3">
            <button
              onClick={() => setPlan("lifetime")}
              className={`relative w-full overflow-hidden rounded-2xl border p-4 text-left transition ${
                plan === "lifetime"
                  ? "border-amber-300/60 bg-gradient-to-br from-amber-300/10 to-amber-500/5"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="absolute right-3 top-3 rounded-full bg-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-900">
                Best Value
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    plan === "lifetime"
                      ? "border-amber-300 bg-amber-300"
                      : "border-white/30"
                  }`}
                >
                  {plan === "lifetime" && (
                    <Check className="h-3 w-3 text-slate-900" />
                  )}
                </div>
                <div className="font-medium text-white">Lifetime Access</div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-3xl text-white">$29</span>
                <span className="text-sm text-white/40 line-through">$55</span>
                <span className="text-xs text-white/50">once</span>
              </div>
              <div className="mt-2 text-[11px] text-white/50">
                Unlimited readings · share cards · new features first
              </div>
            </button>

            <button
              onClick={() => setPlan("monthly")}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                plan === "monthly"
                  ? "border-amber-300/60 bg-gradient-to-br from-amber-300/10 to-amber-500/5"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    plan === "monthly"
                      ? "border-amber-300 bg-amber-300"
                      : "border-white/30"
                  }`}
                >
                  {plan === "monthly" && (
                    <Check className="h-3 w-3 text-slate-900" />
                  )}
                </div>
                <div className="font-medium text-white">Monthly</div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-3xl text-white">$9</span>
                <span className="text-xs text-white/50">/ month</span>
              </div>
              <div className="mt-2 text-[11px] text-white/50">
                Cancel anytime · one reading per day
              </div>
            </button>
          </div>

          {/* Feature list */}
          <div className="mb-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            {[
              "All 5 alternate lives fully revealed",
              "Wealth, joy & chaos scores",
              "Shareable FateGraph card",
              "Weekly new readings",
              "Private email copy",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-white/80">
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-amber-300" />
                {f}
              </div>
            ))}
          </div>

          <GoldButton onClick={onUnlock}>
            <Crown className="h-4 w-4" />
            Unlock FateGraph — {plan === "lifetime" ? "$29 once" : "$9/mo"}
          </GoldButton>

          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/40">
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-400" /> 7-day refund
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> 32,104 unlocked
            </span>
          </div>

          {/* Micro testimonial */}
          <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-1 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <p className="text-[12px] italic text-white/70">
              "{TESTIMONIALS[1].text}"
            </p>
            <p className="mt-1 text-[10px] text-white/40">— {TESTIMONIALS[1].name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function ShareModal({ lives, onClose }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard?.writeText("fategraph.app/r/demo").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/85 backdrop-blur-md sm:items-center">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl border-t border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:rounded-3xl sm:border"
        style={{ animation: "fadeSlide 0.5s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="mb-1 pr-8 font-serif text-2xl text-white">Share your fate</h3>
        <p className="mb-5 text-sm text-white/50">
          A card built for the group chat.
        </p>

        {/* Shareable card preview */}
        <div
          ref={cardRef}
          className="relative mb-5 overflow-hidden rounded-2xl border border-amber-200/20 bg-gradient-to-br from-slate-800 via-slate-900 to-black p-5"
        >
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/20 blur-2xl" />
          <div className="relative">
            <div className="mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80">
                FateGraph
              </span>
            </div>
            <div className="mb-4 font-serif text-lg text-white">My 5 lives.</div>

            <div className="grid grid-cols-5 gap-1.5">
              {lives.map((l, i) => (
                <div
                  key={l.id}
                  className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg"
                >
                  {l.emoji}
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-white/50">Wealth range</span>
                <span className="text-white/90">
                  {Math.min(...lives.map((l) => l.wealth))} –{" "}
                  {Math.max(...lives.map((l) => l.wealth))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Peak joy</span>
                <span className="text-white/90">
                  {Math.max(...lives.map((l) => l.happiness))} / 100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Chaos avg</span>
                <span className="text-white/90">
                  {Math.round(
                    lives.reduce((s, l) => s + l.chaos, 0) / lives.length
                  )}{" "}
                  / 100
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-white/10 pt-3 text-[10px] text-white/40">
              fategraph.app
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80 hover:bg-white/10">
            <Twitter className="h-4 w-4" />
            X / Twitter
          </button>
          <button className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80 hover:bg-white/10">
            <Instagram className="h-4 w-4" />
            Stories
          </button>
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80 hover:bg-white/10"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────

export default function FateGraph() {
  const [screen, setScreen] = useState("hero"); // hero | onboarding | loading | results
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ birthplace: "", whatIf: "", dream: "" });
  const [generatedLives, setGeneratedLives] = useState(MOCK_LIVES);
  const [showEmail, setShowEmail] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  // ─── Admin mode ─────────────────────────────────────────────
  // When true, all 5 lives are unlocked and the paywall never fires.
  // Persisted in localStorage so a refresh keeps it on during QA/demos.
  // Can also be flipped via URL: ?admin=1 or ?admin=0 .
  const [adminMode, setAdminMode] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      const url = new URLSearchParams(window.location.search).get("admin");
      if (url === "1" || url === "true") return true;
      if (url === "0" || url === "false") return false;
      return window.localStorage?.getItem("fategraph.admin") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("fategraph.admin", adminMode ? "1" : "0");
      }
    } catch {}
    console.log("[FateGraph] ADMIN_MODE =", adminMode);
  }, [adminMode]);

  // Effective unlock — admin mode short-circuits the paywall entirely.
  const isUnlocked = unlocked || adminMode;

  // Only show the floating admin toggle when explicitly enabled via URL.
  // Keeps production clean while still giving you a way to preview paid
  // content: just visit  https://yoursite.com/?admin=1  once.
  const adminToggleVisible = (() => {
    try {
      if (typeof window === "undefined") return false;
      const url = new URLSearchParams(window.location.search).get("admin");
      return url !== null; // any ?admin=... value shows the toggle
    } catch {
      return false;
    }
  })();

  const handleStart = () => {
    setScreen("onboarding");
    setStep(0);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      // After final question → email gate
      setShowEmail(true);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
    else setScreen("hero");
  };

  // Generate personalized lives from the user's answers, then enter the
  // loading screen. When a real LLM endpoint is wired in, replace the
  // synchronous call with `await generateLivesFromAnswers(answers)`.
  const runGeneration = () => {
    const lives = generateLivesFromAnswers(answers);
    setGeneratedLives(lives && lives.length === 5 ? lives : MOCK_LIVES);
  };

  // Persist captured email and log it so the user/dev can verify it was
  // received. Safe-guarded for SSR and private-mode environments where
  // localStorage throws.
  const saveEmail = (email) => {
    if (!email) return;
    console.log("[FateGraph] captured email:", email);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("fategraph.email", email);
        window.localStorage.setItem(
          "fategraph.email_captured_at",
          new Date().toISOString()
        );
      }
    } catch (err) {
      console.warn("[FateGraph] could not persist email:", err);
    }
  };

  const handleEmailSubmit = (email) => {
    // The native form POST to Formspree has already fired by the time this
    // runs (the form's onSubmit triggers it). We just continue the app flow.
    saveEmail(email);
    const lives = generateLivesFromAnswers(answers);
    const finalLives = lives && lives.length === 5 ? lives : MOCK_LIVES;
    setGeneratedLives(finalLives);
    setShowEmail(false);
    setScreen("loading");
  };

  const handleEmailSkip = () => {
    console.log("[FateGraph] email step skipped");
    runGeneration();
    setShowEmail(false);
    setScreen("loading");
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-white antialiased"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Google Fonts + global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
        .font-serif { font-family: 'Cormorant Garamond', 'Times New Roman', serif; letter-spacing: -0.01em; }
        body { background: #020617; }
        ::-webkit-scrollbar { width: 0; }

        /* ─── FateGraph input safety layer ───
           Forces readable dark text on white inputs across
           iOS Safari, Chrome Android, and desktop autofill states. */
        .fg-input,
        input.fg-input,
        textarea.fg-input {
          color: #0f172a !important;              /* slate-900 */
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #0f172a !important;
          background-color: #ffffff !important;
          -webkit-appearance: none;
          appearance: none;
          font-size: 16px;                        /* prevents iOS zoom-on-focus */
          opacity: 1;
        }
        .fg-input::placeholder,
        input.fg-input::placeholder,
        textarea.fg-input::placeholder {
          color: #94a3b8 !important;              /* slate-400 */
          -webkit-text-fill-color: #94a3b8 !important;
          opacity: 1;
        }
        .fg-input:focus,
        input.fg-input:focus,
        textarea.fg-input:focus {
          color: #0f172a !important;
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #0f172a !important;
          background-color: #ffffff !important;
          outline: none;
        }
        /* Kill Chrome/Safari yellow autofill + white-on-white text */
        .fg-input:-webkit-autofill,
        .fg-input:-webkit-autofill:hover,
        .fg-input:-webkit-autofill:focus,
        .fg-input:-webkit-autofill:active,
        input.fg-input:-webkit-autofill,
        textarea.fg-input:-webkit-autofill {
          -webkit-text-fill-color: #0f172a !important;
          caret-color: #0f172a !important;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          box-shadow: 0 0 0px 1000px #ffffff inset !important;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      <Starfield />

      {/* Desktop frame */}
      <div className="relative mx-auto max-w-md">
        {screen === "hero" && <HeroScreen onStart={handleStart} />}
        {screen === "onboarding" && (
          <OnboardingScreen
            step={step}
            answers={answers}
            setAnswers={setAnswers}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {screen === "loading" && (
          <LoadingScreen onDone={() => setScreen("results")} />
        )}
        {screen === "results" && (
          <ResultsScreen
            answers={answers}
            lives={generatedLives}
            unlocked={isUnlocked}
            onUnlock={() => {
              if (adminMode) return; // admin bypasses paywall entirely
              setShowPaywall(true);
            }}
            onShare={() => setShowShare(true)}
            onRegen={() => {}}
          />
        )}
      </div>

      {/* Modals */}
      {showEmail && (
        <EmailCaptureModal
          onSubmit={handleEmailSubmit}
          onClose={handleEmailSkip}
          livesPayload={(() => {
            // Preview the lives we'd generate from current answers so the
            // email body has the real content, not an empty array.
            const preview = generateLivesFromAnswers(answers);
            return preview && preview.length === 5 ? preview : generatedLives;
          })()}
        />
      )}
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          onUnlock={() => {
            setUnlocked(true);
            setShowPaywall(false);
          }}
        />
      )}
      {showShare && (
        <ShareModal lives={generatedLives} onClose={() => setShowShare(false)} />
      )}

      {/* ─── Floating admin toggle (only visible with ?admin=... in URL) ──
          Small dev/QA button to flip ADMIN_MODE on/off without needing
          to go through the paywall. Sits above all modals (z-[60]). */}
      {adminToggleVisible && (
        <button
          onClick={() => setAdminMode((v) => !v)}
          aria-label={adminMode ? "Disable admin mode" : "Enable admin mode"}
          title={adminMode ? "Admin mode: ON (click to disable)" : "Admin mode: OFF (click to enable)"}
          className={`fixed bottom-4 right-4 z-[60] flex h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium tracking-wide shadow-lg backdrop-blur transition ${
            adminMode
              ? "border-amber-300/60 bg-amber-300/15 text-amber-100 shadow-amber-500/20"
              : "border-white/10 bg-slate-900/70 text-white/60 hover:text-white hover:bg-slate-800/80"
          }`}
        >
          {adminMode ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>ADMIN</span>
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              <span>admin</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
