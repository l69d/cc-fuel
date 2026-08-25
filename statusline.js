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
    badge: "\x1b[1;30;46m",
    claude: "\x1b[1;38;5;173m", // Anthropic brand coral (#D97757)
    maxBadge: "\x1b[1;97;45m", // bold white on magenta, distinct from level colors
  };
  const levelColor = (pct) => (pct < 60 ? c.green : pct < 85 ? c.yellow : c.red);

  const bar = (pct, width = 10) => {
    const filled = Math.round((pct / 100) * width);
    const color = levelColor(pct);
    return `${color}${"█".repeat(filled)}${c.gray}${"░".repeat(width - filled)}${c.reset}`;
  };

  const toDate = (t) => (typeof t === "number" ? new Date(t * 1000) : new Date(t));

  const resetInDuration = (t) => {
    if (!t) return "";
    const ms = toDate(t).getTime() - Date.now();
    if (ms <= 0) return "resetting";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} hr ${m} min` : `${m} min`;
  };

  const resetAtClock = (t) => {
    if (!t) return "";
    const date = toDate(t);
    if (date.getTime() - Date.now() <= 0) return "resetting";
    const day = date.toLocaleDateString(undefined, { weekday: "short" });
    const time = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `Resets ${day} ${time}`;
  };

  const parts = [];
  const model = data.model?.display_name || data.model?.id;
  const effort = data.effort?.level;

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
      `${c.dim}current session${c.reset} ${bar(fivePct)} ${pc}${c.bold}${fivePct}%${c.reset} ${c.dim}(${resetInDuration(five.resets_at)})${c.reset}`
    );
  }
  if (weekPct !== null) {
    const pc = levelColor(weekPct);
    parts.push(
      `${c.dim}week [All Models]${c.reset} ${bar(weekPct)} ${pc}${c.bold}${weekPct}%${c.reset} ${c.dim}(${resetAtClock(week.resets_at)})${c.reset}`
    );
  }
  if (fivePct === null && weekPct === null) {
    parts.push(`${c.dim}rate limits unavailable (restart Claude Code, or not on Pro/Max)${c.reset}`);
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const modelPart = model
    ? `${c.dim}Current Model :${c.reset} ${c.claude}${model}${c.reset}`
    : "";
  const effortPart = effort
    ? effort === "max"
      ? `${c.dim}Effort :${c.reset} ${c.maxBadge} MAX ${c.reset}`
      : `${c.dim}Effort :${c.reset} ${c.claude}${cap(effort)}${c.reset}`
    : "";
  const modelLine = [`${c.claude}✳${c.reset}`, modelPart, effortPart]
    .filter(Boolean)
    .join("   ");
  const badge = `${c.badge} USAGE ${c.reset}`;
  const usageLine = `${badge} ${parts.join(`  ${c.gray}|${c.reset}  `)}`;
  const lines = [modelLine, usageLine].filter(Boolean);
  process.stdout.write(lines.join("\n\n"));
});
