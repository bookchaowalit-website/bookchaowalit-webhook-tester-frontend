"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CapturedRequest {
  id: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  receivedAt: number;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function tryPrettyJson(body: string): { pretty: string; isJson: boolean } {
  if (!body.trim()) return { pretty: "(empty body)", isJson: false };
  try {
    return { pretty: JSON.stringify(JSON.parse(body), null, 2), isJson: true };
  } catch {
    return { pretty: body, isJson: false };
  }
}

export default function Home() {
  const [hookId, setHookId] = useState<string | null>(null);
  const [requests, setRequests] = useState<CapturedRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const existing = typeof window !== "undefined" ? localStorage.getItem("webhook-tester-hook-id") : null;
    const id = existing ?? crypto.randomUUID();
    if (!existing) localStorage.setItem("webhook-tester-hook-id", id);
    setHookId(id);
  }, []);

  const refresh = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/hook/${id}/requests`, { cache: "no-store" });
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch {
      // polling failure — leave existing state, next tick retries
    }
  }, []);

  useEffect(() => {
    if (!hookId) return;
    refresh(hookId);
    pollRef.current = setInterval(() => refresh(hookId), 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [hookId, refresh]);

  const hookUrl = hookId && typeof window !== "undefined" ? `${window.location.origin}/api/hook/${hookId}` : "";

  const handleCopy = async () => {
    if (!hookUrl) return;
    await navigator.clipboard.writeText(hookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSendTest = async () => {
    if (!hookId) return;
    setSending(true);
    try {
      await fetch(`/api/hook/${hookId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Test-Source": "webhook-tester-ui" },
        body: JSON.stringify({ event: "test.ping", sentAt: new Date().toISOString(), payload: { hello: "world" } }),
      });
      await refresh(hookId);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!hookId) return;
    await fetch(`/api/hook/${hookId}/requests`, { method: "DELETE" });
    setRequests([]);
    setSelectedId(null);
  };

  const selected = requests.find((r) => r.id === selectedId) ?? requests[0] ?? null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Webhook Tester</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Point a webhook at the URL below and watch requests land here in real time — no signup, no tunnel.
          </p>
        </header>

        <section className="mb-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">
            Your capture URL
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-mono">
              {hookUrl || "generating…"}
            </code>
            <button
              onClick={handleCopy}
              disabled={!hookUrl}
              className="rounded bg-zinc-900 dark:bg-zinc-100 px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleSendTest}
              disabled={!hookId || sending}
              className="rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send test request"}
            </button>
            <button
              onClick={handleClear}
              disabled={requests.length === 0}
              className="rounded border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Requests are held in memory for up to an hour and may be lost if the server restarts — this is a lightweight
            testing tool, not a permanent webhook archive.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              {requests.length === 0 ? "Waiting for requests…" : `${requests.length} captured`}
            </div>
            <ul className="max-h-[28rem] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {requests.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                      selected?.id === r.id ? "bg-zinc-100 dark:bg-zinc-800" : ""
                    }`}
                  >
                    <span className="font-mono font-semibold">{r.method}</span>{" "}
                    <span className="text-zinc-500">{formatTime(r.receivedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 min-h-[28rem]">
            {!selected ? (
              <div className="flex h-full min-h-[24rem] items-center justify-center text-sm text-zinc-500">
                Send a request to the capture URL above to see it inspected here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-900 dark:bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-white dark:text-zinc-900">
                    {selected.method}
                  </span>
                  <span className="text-xs text-zinc-500">{new Date(selected.receivedAt).toLocaleString()}</span>
                </div>
                <div>
                  <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">Headers</h2>
                  <pre className="overflow-x-auto rounded bg-zinc-50 dark:bg-zinc-950 p-3 text-xs font-mono leading-relaxed">
                    {Object.entries(selected.headers)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n")}
                  </pre>
                </div>
                <div>
                  <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-2">Body</h2>
                  <pre className="overflow-x-auto rounded bg-zinc-50 dark:bg-zinc-950 p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                    {tryPrettyJson(selected.body).pretty}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
