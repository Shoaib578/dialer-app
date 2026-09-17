import "server-only";

// Server-side SignalWire REST integration. See ENV_USAGE.md for the env var -> credential
// mapping. Never import this from client components: it holds SIGNALWIRE_API_TOKEN.
//
// Call flow (click-to-call, customer first): the browser asks us to dial a customer number.
// We originate a PSTN call FROM our SignalWire number TO the customer. When the customer
// answers, SignalWire fetches cXML from a hosted "Agent Bridge" script that dials
// AGENT_PHONE_NUMBER and bridges the two legs together.

const PROJECT_ID = process.env.SIGNALWIRE_PROJECT_ID;
const API_TOKEN = process.env.SIGNALWIRE_API_TOKEN;
const SPACE_URL = process.env.SIGNALWIRE_SPACE_URL;
const CALLER_ID = process.env.SIGNALWIRE_PHONE_NUMBER;
const AGENT_PHONE_NUMBER = process.env.AGENT_PHONE_NUMBER;

const AGENT_BRIDGE_RESOURCE_NAME = "Agent Bridge";

function assertConfigured() {
  const missing = [
    ["SIGNALWIRE_PROJECT_ID", PROJECT_ID],
    ["SIGNALWIRE_API_TOKEN", API_TOKEN],
    ["SIGNALWIRE_SPACE_URL", SPACE_URL],
    ["SIGNALWIRE_PHONE_NUMBER", CALLER_ID],
    ["AGENT_PHONE_NUMBER", AGENT_PHONE_NUMBER],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

function authHeader(): string {
  const token = Buffer.from(`${PROJECT_ID}:${API_TOKEN}`).toString("base64");
  return `Basic ${token}`;
}

async function swFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SPACE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SignalWire API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

async function lamlFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SPACE_URL}/api/laml/2010-04-01/Accounts/${PROJECT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SignalWire LaML API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

interface FabricResource {
  id: string;
  display_name: string;
  type: string;
  cxml_script?: { request_url: string };
}

// The resource itself (and its hosted URL) is created once and cached, but its cXML
// contents are re-synced against the current env vars on every call — otherwise a
// changed SIGNALWIRE_PHONE_NUMBER or AGENT_PHONE_NUMBER would silently keep bridging
// with whatever values were live the first time this resource was created.
let cachedResourceId: string | null = null;
let cachedBridgeUrl: string | null = null;

function agentBridgeContents(): string {
  return `<Response><Dial callerId="${CALLER_ID}"><Number>${AGENT_PHONE_NUMBER}</Number></Dial></Response>`;
}

async function ensureAgentBridgeUrl(): Promise<string> {
  if (cachedResourceId && cachedBridgeUrl) {
    await swFetchJson(`/api/fabric/resources/cxml_scripts/${cachedResourceId}`, {
      method: "PATCH",
      body: JSON.stringify({ contents: agentBridgeContents() }),
    });
    return cachedBridgeUrl;
  }

  const page = await swFetchJson<{ data: FabricResource[] }>(
    "/api/fabric/resources?page_size=100"
  );
  let resource = page.data.find(
    (r) => r.type === "cxml_script" && r.display_name === AGENT_BRIDGE_RESOURCE_NAME
  );

  if (!resource) {
    resource = await swFetchJson<FabricResource>("/api/fabric/resources/cxml_scripts", {
      method: "POST",
      body: JSON.stringify({
        name: AGENT_BRIDGE_RESOURCE_NAME,
        contents: agentBridgeContents(),
      }),
    });
  } else {
    resource = await swFetchJson<FabricResource>(
      `/api/fabric/resources/cxml_scripts/${resource.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ contents: agentBridgeContents() }),
      }
    );
  }

  const url = resource.cxml_script?.request_url;
  if (!url) {
    throw new Error("SignalWire did not return a request URL for the agent bridge script");
  }

  cachedResourceId = resource.id;
  cachedBridgeUrl = url;
  return url;
}

interface LamlCallResponse {
  sid: string;
  status: string;
}

/**
 * Places the first leg of a click-to-call: rings `toNumber`. When answered, SignalWire
 * bridges in AGENT_PHONE_NUMBER via the hosted Agent Bridge script.
 */
export async function originateCallToCustomer(
  toNumber: string
): Promise<{ callSid: string; status: string }> {
  assertConfigured();
  const bridgeUrl = await ensureAgentBridgeUrl();

  const body = new URLSearchParams({
    To: toNumber,
    From: CALLER_ID as string,
    Url: bridgeUrl,
  });

  const call = await lamlFetchJson<LamlCallResponse>("/Calls.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  return { callSid: call.sid, status: call.status };
}

export async function getCallStatus(
  callSid: string
): Promise<{ status: string; durationSec: number }> {
  assertConfigured();
  const call = await lamlFetchJson<{ status: string; duration: string | null }>(
    `/Calls/${callSid}.json`
  );
  return {
    status: call.status,
    durationSec: call.duration ? parseInt(call.duration, 10) : 0,
  };
}

export async function hangUpCall(callSid: string): Promise<void> {
  assertConfigured();
  const body = new URLSearchParams({ Status: "completed" });
  await lamlFetchJson(`/Calls/${callSid}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

export async function sendSms(
  toNumber: string,
  body: string
): Promise<{ sid: string; status: string }> {
  assertConfigured();
  const formBody = new URLSearchParams({
    To: toNumber,
    From: CALLER_ID as string,
    Body: body,
  });

  const message = await lamlFetchJson<{ sid: string; status: string }>("/Messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });

  return { sid: message.sid, status: message.status };
}

export async function getMessageStatus(
  messageSid: string
): Promise<{ status: string; errorMessage: string | null }> {
  assertConfigured();
  const message = await lamlFetchJson<{ status: string; error_message: string | null }>(
    `/Messages/${messageSid}.json`
  );
  return { status: message.status, errorMessage: message.error_message };
}

export interface InboundSmsRecord {
  sid: string;
  from: string;
  body: string;
}

/** Polls SignalWire directly for messages received on our number — used instead of an inbound SMS webhook. */
export async function listInboundMessages(limit = 50): Promise<InboundSmsRecord[]> {
  assertConfigured();
  const data = await lamlFetchJson<{
    messages: Array<{ sid: string; from: string; body: string; direction: string }>;
  }>(`/Messages.json?To=${encodeURIComponent(CALLER_ID as string)}&PageSize=${limit}`);

  return data.messages
    .filter((m) => m.direction === "inbound")
    .map((m) => ({ sid: m.sid, from: m.from, body: m.body }));
}
