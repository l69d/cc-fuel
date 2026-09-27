#!/usr/bin/env node
// node test.js — pipes fake statusLine payloads through statusline.js and checks the effort badge.
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const stdout = (text) => ({ type: "user", message: { role: "user", content: `<local-command-stdout>${text}</local-command-stdout>` } });
const att = (type) => ({ type: "attachment", attachment: { type, reminderType: "full" } });
const SET_ULTRA = stdout("Set effort level to ultracode (this session only): xhigh + dynamic workflow orchestration");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cc-fuel-"));
const render = (effort, records) => {
  const file = path.join(dir, "t.jsonl");
  fs.writeFileSync(file, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const payload = JSON.stringify({ model: { display_name: "Opus 5.5" }, effort: { level: effort }, transcript_path: file });
  return execFileSync("node", [path.join(__dirname, "statusline.js")], { input: payload }).toString();
};
const ultra = (effort, records) => render(effort, records).includes("ULTRACODE");

assert(!ultra("xhigh", []), "plain xhigh");
assert(ultra("xhigh", [SET_ULTRA]), "/effort ultracode");
assert(ultra("xhigh", [att("ultra_effort_enter")]), "enter reminder (e.g. --settings)");
assert(!ultra("xhigh", [SET_ULTRA, stdout("Set effort level to xhigh (saved as your default for new sessions): ...")]), "back to xhigh");
assert(!ultra("xhigh", [SET_ULTRA, stdout("Effort level set to auto")]), "auto at an xhigh-default model");
assert(!ultra("xhigh", [att("ultra_effort_enter"), att("ultra_effort_exit")]), "exit reminder");
assert(ultra("xhigh", [SET_ULTRA, stdout("Set effort level to high"), att("ultra_effort_enter")]), "re-entered after high");
assert(!ultra("high", [SET_ULTRA]), "stale marker, effort moved off xhigh");
// Tool output quoting a transcript line is JSON-escaped and must not count.
assert(!ultra("xhigh", [{ type: "user", message: { content: [{ type: "tool_result", content: JSON.stringify(SET_ULTRA) + JSON.stringify(att("ultra_effort_enter")) }] } }]), "escaped mention");
assert(ultra("xhigh", [stdout("Set model to `Opus 5.5` for this session only with `ultracode` effort")]), "/model picks ultracode");
assert(!ultra("xhigh", [SET_ULTRA, stdout("Set model to \u001b[1mOpus 5.5\u001b[22m for this session only with \u001b[1mxhigh\u001b[22m effort")]), "/model picks xhigh");
assert(ultra("xhigh", [SET_ULTRA, stdout("Set model to `Opus 5.5` and saved as your default for new sessions")]), "/model without effort keeps it");
assert(!ultra("xhigh", [SET_ULTRA, stdout("CLAUDE_CODE_EFFORT_LEVEL=xhigh overrides this session \u2014 clear it and high takes over")]), "env override reply");
assert(render("max", []).includes(" MAX "), "max badge");
assert(!execFileSync("node", [path.join(__dirname, "statusline.js")], { input: '{"effort":{"level":"xhigh"}}' }).toString().includes("ULTRACODE"), "no transcript_path");
fs.rmSync(dir, { recursive: true });
console.log("ok");
