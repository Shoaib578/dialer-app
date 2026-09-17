# Environment Variable Usage

Only variables already present in `.env.local` are used (one, `AGENT_PHONE_NUMBER`, was
uncommented per your instruction — see below). No new variable names were invented.

| Variable | Used for |
|---|---|
| `SIGNALWIRE_PROJECT_ID` | Basic-auth username for all SignalWire REST calls (`lib/signalwire.ts`) |
| `SIGNALWIRE_API_TOKEN` | Basic-auth password for all SignalWire REST calls. Never sent to the browser. |
| `SIGNALWIRE_SPACE_URL` | Base URL for the SignalWire REST API |
| `SIGNALWIRE_PHONE_NUMBER` | Caller ID used as the `From` number for the outbound leg to the customer, and as the bridge leg's caller ID to your phone |
| `AGENT_PHONE_NUMBER` | Your mobile number — the second leg SignalWire dials once the customer answers. Was commented out; set to `+13158595090` per your instruction. |

## Why the SIP_* variables aren't used

`SIGNALWIRE_SIP_USERNAME` / `SIGNALWIRE_SIP_PASSWORD` / `SIGNALWIRE_SIP_DOMAIN` are for direct
SIP/WebRTC registration, a different calling approach than this app uses. Left untouched in case
other tools (e.g. a softphone) depend on them.

## How calling actually works

This is a click-to-call, two-leg PSTN bridge — the browser only triggers the call; no audio ever
flows through the browser or requires a microphone.

1. `POST /api/calls/dial { to }` validates the number, then calls SignalWire's LaML **Create a
   Call** REST API (`/api/laml/2010-04-01/Accounts/{project}/Calls.json`) with
   `From=SIGNALWIRE_PHONE_NUMBER`, `To=<customer number>`.
2. When the customer answers, SignalWire fetches cXML from a small hosted script — a `cxml_script`
   Fabric resource named "Agent Bridge" that `lib/signalwire.ts` creates once (idempotent, found
   by name on subsequent calls) and reuses for every call, since its destination
   (`AGENT_PHONE_NUMBER`) is fixed. Its content is:
   ```xml
   <Response><Dial callerId="SIGNALWIRE_PHONE_NUMBER"><Number>AGENT_PHONE_NUMBER</Number></Dial></Response>
   ```
3. That `<Dial>` rings your mobile and bridges the two legs together.
4. The browser polls `GET /api/calls/{sid}` (LaML call status: `queued`/`ringing`/`in-progress`/
   `completed`/etc.) to drive the on-screen status, and can end the call early via
   `POST /api/calls/{sid}/hangup`.

Pressing "Call" in the UI places a real phone call to whatever number is entered, and then rings
`AGENT_PHONE_NUMBER`. Test with numbers you're comfortable actually ringing.
