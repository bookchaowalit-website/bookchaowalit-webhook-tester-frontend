export interface CapturedRequest {
  id: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  receivedAt: number;
}

const MAX_REQUESTS_PER_HOOK = 50;
const MAX_HOOKS = 200;
const HOOK_TTL_MS = 60 * 60 * 1000; // 1 hour

interface HookBucket {
  requests: CapturedRequest[];
  lastAccess: number;
}

// `globalThis` survives Next.js dev-server HMR reloads and keeps requests
// visible across warm serverless invocations. It does not survive a cold
// start or a new instance being spun up — captured requests are ephemeral
// by design, not a permanent archive.
const globalForStore = globalThis as unknown as {
  __webhookStore?: Map<string, HookBucket>;
};

function getStore(): Map<string, HookBucket> {
  if (!globalForStore.__webhookStore) {
    globalForStore.__webhookStore = new Map();
  }
  return globalForStore.__webhookStore;
}

function pruneExpired(store: Map<string, HookBucket>) {
  const now = Date.now();
  for (const [id, bucket] of store) {
    if (now - bucket.lastAccess > HOOK_TTL_MS) {
      store.delete(id);
    }
  }
  if (store.size > MAX_HOOKS) {
    const oldest = [...store.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    for (const [id] of oldest.slice(0, store.size - MAX_HOOKS)) {
      store.delete(id);
    }
  }
}

export function captureRequest(hookId: string, req: Omit<CapturedRequest, "id">) {
  const store = getStore();
  pruneExpired(store);
  const bucket = store.get(hookId) ?? { requests: [], lastAccess: Date.now() };
  bucket.requests.unshift({ id: crypto.randomUUID(), ...req });
  if (bucket.requests.length > MAX_REQUESTS_PER_HOOK) {
    bucket.requests.length = MAX_REQUESTS_PER_HOOK;
  }
  bucket.lastAccess = Date.now();
  store.set(hookId, bucket);
}

export function getRequests(hookId: string): CapturedRequest[] {
  const store = getStore();
  const bucket = store.get(hookId);
  if (!bucket) return [];
  bucket.lastAccess = Date.now();
  return bucket.requests;
}

export function clearRequests(hookId: string) {
  getStore().delete(hookId);
}
