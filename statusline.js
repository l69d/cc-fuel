#!/usr/bin/env node
// Reads Claude Code statusLine JSON on stdin, renders session/weekly usage bars.
let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    process.stdout.write("");
    return;
  }

  const c = {
    reset: "\x1b[0m",
    dim: "\x1b[38;5;250m",
    bold: "\x1b[1m",
    cyan: "\x1b[1;36m",
    green: "\x1b[1;32m",
    yellow: "\x1b[1;33m",
    red: "\x1b[1;31m",
    gray: "\x1b[38;5;240m",
  };
  const levelColor = (pct) => (pct < 60 ? c.green : pct < 85 ? c.yellow : c.red);

  const bar = (pct, width = 10) => {
    const filled = Math.round((pct / 100) * width);
    const color = levelColor(pct);
    return `${color}${"█".repeat(filled)}${c.gray}${"░".repeat(width - filled)}${c.reset}`;
  };

  const resetIn = (t) => {
    if (!t) return "";
    const ms = (typeof t === "number" ? t * 1000 : new Date(t).getTime()) - Date.now();
    if (ms <= 0) return "resetting";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (d > 0) return `${d}d${h}h`;
    return h > 0 ? `${h}h${m}m` : `${m}m`;
  };

  const parts = [];
  const model = data.model?.display_name || data.model?.id;
  if (model) parts.push(`${c.cyan}${c.bold}${model}${c.reset}`);

  const rl = data.rate_limits || {};
  const five = rl.five_hour;
  const week = rl.seven_day;

  const pctOf = (w) =>
    typeof w?.used_percentage === "number"
      ? Math.round(w.used_percentage)
      : typeof w?.utilization === "number"
      ? Math.round(w.utilization * 100)
      : null;

  const fivePct = pctOf(five);
  const weekPct = pctOf(week);

  if (fivePct !== null) {
    const pc = levelColor(fivePct);
    parts.push(
      `${c.dim}session${c.reset} ${bar(fivePct)} ${pc}${c.bold}${fivePct}%${c.reset} ${c.dim}(${resetIn(five.resets_at)})${c.reset}`
    );
  }
  if (weekPct !== null) {
    const pc = levelColor(weekPct);
    parts.push(
      `${c.dim}week${c.reset} ${bar(weekPct)} ${pc}${c.bold}${weekPct}%${c.reset} ${c.dim}(${resetIn(week.resets_at)})${c.reset}`
    );
  }
  if (fivePct === null && weekPct === null) {
    parts.push(`${c.dim}rate limits unavailable (restart Claude Code, or not on Pro/Max)${c.reset}`);
  }

  process.stdout.write(parts.join(`  ${c.gray}|${c.reset}  `));
});
