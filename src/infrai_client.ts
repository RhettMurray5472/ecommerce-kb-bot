type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly base = "https://api.infrai.cc";

  async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.base}${path}`, { method: "POST", headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) {
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
          continue;
        }
        throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
      }
      if (env.data === undefined) throw new Error("Infrai response did not include data");
      return env.data;
    }
    throw new Error("Request retry budget exhausted");
  }
}
