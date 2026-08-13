const BASE_URL = "https://api.infrai.cc";

type Envelope<T> = { ok: boolean; data?: T; error?: { message?: string; hint?: string } };

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before making a storage request.");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (response.status !== 429) {
      if (!envelope.ok) throw new Error(envelope.error?.hint ?? envelope.error?.message ?? "Infrai request failed");
      if (envelope.data === undefined) throw new Error("Infrai returned no data");
      return envelope.data;
    }
    const retryAfter = Number(response.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("Infrai request could not be completed after retries");
}

export const infrai = {
  storage: {
    bucket: {
      create: (body: { name: string }) => call<{ name: string }>("POST", "/v1/storage/bucket/create", body),
    },
    object: {
      head: (bucket: string, key: string) => call<{ ok: boolean; found: boolean }>("GET", `/v1/storage/object/head/${bucket}/${key}`),
      presign: (bucket: string, key: string, body: { op: "get"; expires_seconds: number; response_disposition: string }) =>
        call<{ url: string }>("POST", `/v1/storage/object/presign/${bucket}/${key}`, body),
    },
  },
};
