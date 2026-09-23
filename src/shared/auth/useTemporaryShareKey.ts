import { useEffect } from "react";

const TEMPORARY_SHARE_KEY_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 100;

/** Persists a validated server-issued temporary share key without retaining it in the URL. */
export function useTemporaryShareKey() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tempKey = params.get("temp_key");
    if (!tempKey) return;

    document.cookie = `temp_key=${tempKey}; path=/; max-age=${TEMPORARY_SHARE_KEY_MAX_AGE_SECONDS}`;
    params.delete("temp_key");
    window.history.replaceState(
      {},
      document.title,
      `${window.location.pathname}${params.toString() ? `?${params}` : ""}`,
    );
  }, []);
}
