# cc-fuel

A statusline for [Claude Code](https://claude.com/claude-code) that shows how much of your **5-hour session limit** and **weekly limit** you've burned — right in the terminal, always visible, no extra command to run.

```
╭◕‿-╮  Current Model : Opus 5.5   Effort :  ULTRACODE 
╰───╯   USAGE  current session █████░░░░░ 45% (2 hr 5 min)  |  week [All Models] ████░░░░░░ 35% (Resets Sat 2:58 PM)
```

Bars go green → yellow → red as you approach the limit. `MAX` and `ULTRACODE` get their own badges. Ultracode runs at `xhigh`, so the payload's `effort.level` can't tell them apart; when it's `xhigh`, cc-fuel checks the session transcript for the latest `/effort` or `/model` effort change (or ultracode on/off reminder). Claude Code doesn't re-run the statusline when you switch between `xhigh` and ultracode, so the badge catches up after the next reply; toggles that leave no transcript record (Remote Control, `--resume`) show after your next prompt. The little mascot face cycles between 8 expressions every 10 seconds.

## Requirements

- Claude Code 2.1.x+ (needs `rate_limits` in the statusLine JSON payload)
- A Pro or Max plan (API/pay-as-you-go accounts don't have session/weekly limits, so there's nothing to show)
- Node.js (already required by Claude Code itself)

## Install

```bash
git clone https://github.com/l69d/cc-fuel.git
cd cc-fuel
./install.sh
```

Then restart Claude Code (quit and relaunch — a running session won't pick up the config change).

## How it works

Claude Code invokes your configured `statusLine` command on every prompt, piping a JSON payload on stdin that includes `rate_limits.five_hour` and `rate_limits.seven_day` (each with `used_percentage` and `resets_at`) for Pro/Max accounts. `statusline.js` reads that JSON and renders it as two progress bars. No network calls, no reading your credentials file, no polling — the only file it opens is the session transcript Claude Code points it at, and only at `xhigh` effort.

## Uninstall

Remove the `statusLine` key from `~/.claude/settings.json` and delete `~/.claude/statusline.js`.

## License

MIT
