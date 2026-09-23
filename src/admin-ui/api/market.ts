/**
 * Shared helpers for the plugin/theme "market" pages: registering source
 * repositories, comparing versions, and a thin fetch wrapper for the
 * market-source CRUD endpoints (which both pages call identically).
 */

export interface MarketSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface MarketSourceStatus {
  id: string;
  name: string;
  url: string;
  count: number;
  error?: string;
}

export interface MarketAPIResponse<T> {
  status: string;
  message?: string;
  data: T;
}

export const emptyMarketSource = (): Omit<MarketSource, "id"> => ({
  name: "",
  url: "",
  enabled: true,
});

/** True when `candidate`'s version is strictly newer than `installed`'s. */
export function isVersionNewer(candidate: string, installed: string) {
  const parse = (value: string) => {
    const match = value
      .trim()
      .replace(/^v/i, "")
      .match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
    return match
      ? [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)]
      : null;
  };
  const next = parse(candidate);
  const current = parse(installed);
  if (!next || !current) return candidate !== installed;
  for (let index = 0; index < next.length; index += 1) {
    if (next[index] !== current[index]) return next[index] > current[index];
  }
  return false;
}

export async function requestMarketAPI<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const payload = (await response
    .json()
    .catch(() => null)) as MarketAPIResponse<T> | null;
  if (!response.ok || !payload || payload.status === "error") {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload;
}
