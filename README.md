# Meeting Planner

> Schedule meetings across timezones in Discord — without leaving the chat.

`/meet @friend your_city:Tokyo their_city:Berlin` opens an ephemeral setup right where you ran it. Pick a day, see every hour color-coded for both timezones (☀️ both in working hours, 🌤️ one of you is, 🌙 off-hours), propose up to 3 times across any mix of days, and send. The proposal posts in the chat with times primary in the receiver's zone. If your guess of their timezone was wrong, they tap *Wrong timezone?* and fix it in place — no re-send, no channel clutter. Accept a time and it's confirmed.

Works in **servers, DMs, and group DMs**. No profile setup. No persistent storage. One command.

---

## Quick start

```bash
git clone https://github.com/<your-username>/meeting-planner.git
cd meeting-planner
npm install
cp .env.example .env            # then fill in DISCORD_TOKEN + CLIENT_ID
npx ts-node src/deploy.ts       # one-time: registers /meet globally
npx ts-node src/bot.ts          # start the bot
```

To get the env values: create an application at [discord.com/developers/applications](https://discord.com/developers/applications), copy the **Application ID** from *General Information* and a fresh token from *Bot → Reset Token*. On *Installation*, enable both **User Install** and **Guild Install** (scope: `applications.commands` — no `bot` scope needed, since interactions carry their own auth). The generated install link covers both modes: install to your account and `/meet` follows you into any DM, group, or server; install to a server and everyone there gets it without installing anything themselves.

Optional — add to `package.json` for nicer scripts:

```json
"scripts": {
  "deploy": "ts-node src/deploy.ts",
  "start":  "ts-node src/bot.ts"
}
```

---

## Under the hood

A few design decisions worth calling out:

**Color-coded overlap as ambient metadata.** The hour picker renders all 24 hours with an emoji computed from both timezones' working hours. Timezone math becomes visual scanning — no mental conversion, no range-constraining decisions imposed on the user.

**Anchor-day model for multi-day proposals.** A single "day anchor" scopes the hour picker. Flip the anchor to a different day, propose more times — slots on other days are never touched by dropdown edits. Up to three slots total, any mix of days. The dropdown's `maxValues` dynamically adjusts based on slots on other days so the cap is enforced at the UI layer, not post-hoc.

**In-place receiver timezone correction.** The sender specifies the receiver's timezone as a best guess. If wrong, the receiver taps *Wrong timezone?* — the proposal message swaps to a timezone picker and back via `interaction.update`. Same message, no re-send, no channel noise. Accepting a time implicitly confirms the displayed zone.

**Discord-platform-correct for multi-context use.** `InteractionContextType` and `ApplicationIntegrationType` are set so the command works in every chat surface. Proposals are posted with `interaction.followUp` (not `channel.send`) so the bot doesn't need to be a member of the DM or group — the interaction webhook authorizes the send.

**DST-aware time conversion.** All hour math goes through `date-fns-tz`'s `fromZonedTime` + `formatInTimeZone`, so DST transitions are computed per-date rather than against a static offset. The anchor-day model reruns color coding whenever the day changes, so transition days render correctly.

**Stateless beyond the session.** A 24-hour in-memory TTL covers the setup-to-response flow; nothing is persisted. Swapping the `SessionStore` implementation for Redis is a single-file change if multi-process ever matters.

**Type safety end-to-end.** TypeScript strict mode, no `any` in the source tree, compiles clean against `discord.js@14.16.3`.

---

## Architecture

```
src/
├── bot.ts                    # Client wiring — only Guilds intent needed
├── deploy.ts                 # One-time global command registration
├── types.ts                  # Slot, MeetingSession, MAX_TIMES, compareSlot
├── commands/
│   ├── index.ts              # Command registry
│   └── meetCommand.ts        # /meet user your_city their_city
├── handlers/
│   ├── interactionRouter.ts  # Single top-level try/catch dispatch
│   ├── selectMenuHandler.ts  # Date + times (sender), TZ picker (target)
│   ├── buttonHandler.ts      # Send/cancel/clear + accept/decline/change_tz
│   └── modalHandler.ts       # Custom-time HH:MM input
├── services/
│   └── timezone.ts           # City DB, IANA validation, hour math, formatters
├── store/
│   └── sessions.ts           # In-memory session store, 24h TTL, swept
├── ui/
│   ├── setupScreen.ts        # Ephemeral setup UI (sender only sees this)
│   └── proposalMessage.ts    # In-channel proposal + in-place TZ picker
└── utils/
    └── customId.ts           # ':'-delimited, 100-char bounded
```

Three interaction types — slash command, component (select/button), modal submit — flow through one router. Handlers mutate the session; UI builders render from it. Nothing else.

---

## Stack

TypeScript · [discord.js](https://discord.js.org) v14 · [date-fns](https://date-fns.org) + [date-fns-tz](https://github.com/marnusw/date-fns-tz). No framework, no database. ~900 lines of source.

---

## License

[MIT](LICENSE)