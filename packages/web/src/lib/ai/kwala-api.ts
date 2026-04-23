const BASE_URL =
  process.env.KWALA_API_URL ?? "https://kwala-test.kalp.network";

export async function kwalaGet<T = unknown>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString());

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Kwala API ${res.status}: ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function kwalaPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  const url = new URL(path, BASE_URL);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Kwala API ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}
