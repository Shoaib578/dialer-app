# Dialer App

A Next.js click-to-call dialer backed by SignalWire. The browser only triggers the call — the
actual audio path is a real two-leg PSTN bridge: SignalWire calls the entered number, and once
they answer, it rings your mobile phone and bridges the two together. No WebRTC, no browser
microphone.

## Setup

1. `npm install`
2. Make sure `.env.local` has the SignalWire credentials (see `ENV_USAGE.md` for exactly which
   ones and why). Nothing new needs to be added.
3. `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dialer`.
5. Dial a number and press the green call button. This places a real call — see the warning in
   `ENV_USAGE.md`.

On the first call, the server automatically creates a small SignalWire resource ("Agent Bridge")
that SignalWire uses to bridge your phone in after the customer answers.

## Project structure

```
app/dialer/page.tsx           dialer UI (keypad, call controls, status)
app/api/calls/dial/           originates the outbound call
app/api/calls/[sid]/          polls call status
app/api/calls/[sid]/hangup/   ends an in-progress call
components/Keypad.tsx         numeric keypad
components/CallControls.tsx   call / hang up buttons
components/CallStatus.tsx     call state + duration display
lib/signalwire.ts             server-side SignalWire REST integration (secrets stay here)
lib/phone.ts                  E.164 number validation/formatting
lib/useDialer.ts              client-side call state machine (fetch + status polling)
```

## Notes

- All SignalWire secrets are only read in `lib/signalwire.ts`, which is server-only
  (`import "server-only"` fails the build if it's ever imported from client code).
- Status is polled every 1.5s via the LaML call-status endpoint; there's no push/webhook wiring,
  so status can lag the real call state by up to that interval.
