// js/utils.js

const MS_PER_DAY = 86400000;
const ROW_LABEL_WIDTH = 90;

// --- Date helpers ---
function parseDateFromInput(s) {
  if (!s) return null;
  s = s.trim();
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// More flexible parser for Excel-like and ISO-like date/time strings
function parseDateTimeFromInput(s) {
  if (!s) return null;
  s = s.trim();
  if (!s) return null;

  // 1) Try direct Date parsing
  let d = new Date(s);
  if (!isNaN(d)) return d;

  // 2) Replace / with - and try again
  let normalized = s.replace(/\//g, "-");
  if (normalized !== s) {
    d = new Date(normalized);
    if (!isNaN(d)) return d;
  }

  // 3) Manual parse of "YYYY-MM-DD[ T]HH:MM[ AM/PM]" style
  let datePart = "";
  let timePart = "";

  if (normalized.includes("T")) {
    [datePart, timePart] = normalized.split("T");
  } else {
    const parts = normalized.split(/\s+/);
    datePart = parts[0] || "";
    timePart = parts[1] || "";
  }

  if (!datePart) return null;

  const [y, m, dNum] = datePart.split("-").map(Number);
  if (!y || !m || !dNum) return null;

  let hh = 0, mm = 0;
  if (timePart) {
    let tp = timePart.trim().toUpperCase();
    const isPM = tp.includes("PM");
    const isAM = tp.includes("AM");
    tp = tp.replace(/AM|PM/gi, "").trim();
    const tParts = tp.split(":");
    hh = parseInt(tParts[0] || "0", 10);
    mm = parseInt(tParts[1] || "0", 10);

    if (isPM && hh < 12) hh += 12;
    if (isAM && hh === 12) hh = 0;
  }

  const dt = new Date(y, m - 1, dNum, hh || 0, mm || 0, 0, 0);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function toDateInputValue(d) {
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateTimeInputValue(d) {
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a, b) {
  const A = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const B = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((B - A) / MS_PER_DAY);
}

function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function addDaysFloat(d, n) {
  return new Date(d.getTime() + n * MS_PER_DAY);
}

function addTimeUnit(d, unit, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (unit === "days") x.setDate(x.getDate() + n);
  else if (unit === "weeks") x.setDate(x.getDate() + 7 * n);
  else if (unit === "months") x.setMonth(x.getMonth() + n);
  else if (unit === "years") x.setFullYear(x.getFullYear() + n);
  return x;
}

function formatLabel(d, unit) {
  if (unit === "days" || unit === "weeks")
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  if (unit === "months")
    return d.toLocaleDateString("en-CA", { year: "numeric", month: "short" });
  if (unit === "years")
    return d.toLocaleDateString("en-CA", { year: "numeric" });
  return d.toLocaleDateString("en-CA");
}

function getDuplicates(arr) {
  const counts = {};
  arr.forEach(v => { if (!v) return; counts[v] = (counts[v] || 0) + 1; });
  return Object.keys(counts).filter(k => counts[k] > 1);
}

// Hex -> rgba with alpha
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map(ch => ch + ch).join("");
  }
  const num = parseInt(c, 16);
  if (Number.isNaN(num)) return `rgba(0,0,0,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Normalize a date/time input field (for Excel paste)
function normalizeDateTimeInputField(inp) {
  if (!inp) return;
  const v = inp.value;
  if (!v) return;
  const d = parseDateTimeFromInput(v);
  if (!d) return;
  inp.value = toDateTimeInputValue(d);
}

// textarea auto-grow
function autoGrow(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

document.addEventListener("input", e => {
  if (e.target.matches("textarea.auto-grow")) {
    autoGrow(e.target);
  }
});

// sanity checks
(function sanityTests() {
  const d = new Date(2025, 0, 1);
  console.assert(daysBetween(d, addDays(d, 1)) === 1, "daysBetween / addDays");
  console.assert(toDateInputValue(parseDateFromInput("2025-01-10")) === "2025-01-10", "date roundtrip");
})();
