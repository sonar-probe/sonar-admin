import React from "react";
import { toast } from "sonner";

export interface UseProviderRegistryOptions {
  /** GET endpoint returning {status, data: Record<providerName, FieldDef[]>} */
  listUrl: string;
  /** GET endpoint (given a provider name) returning {status, data: {addition: string}} */
  valuesUrl: (provider: string) => string;
  /** POST endpoint accepting {name, addition} */
  saveUrl: string;
  /** Settings-derived provider that should be preselected once the list loads */
  activeProvider: string | undefined;
  /** Gate fetching until the surrounding settings have loaded */
  settingsLoading: boolean;
  fetchListErrorMessage: string;
  fetchValuesErrorMessage: string;
  saveErrorMessage: string;
  saveSuccessMessage: string;
}

/**
 * Shared fetch/save orchestration for the provider-registry settings pages
 * (notification message senders, OIDC sign-on providers): fetch the list of
 * providers and their field definitions, fetch the active provider's saved
 * values, and save edited values back. A save failure surfaces as a toast
 * rather than replacing the whole page with an error screen.
 */
export function useProviderRegistry({
  listUrl,
  valuesUrl,
  saveUrl,
  activeProvider,
  settingsLoading,
  fetchListErrorMessage,
  fetchValuesErrorMessage,
  saveErrorMessage,
  saveSuccessMessage,
}: UseProviderRegistryOptions) {
  const [providerDefs, setProviderDefs] = React.useState<any>({});
  const [providerList, setProviderList] = React.useState<string[]>([]);
  const [currentProvider, setCurrentProvider] = React.useState("");
  const [providerValues, setProviderValues] = React.useState<any>({});
  const [providerLoading, setProviderLoading] = React.useState(false);
  const [providerError, setProviderError] = React.useState("");

  // `valuesUrl` is typically passed as a fresh inline function on every
  // render; keep the latest one in a ref so it doesn't retrigger the fetch
  // effect below on every render (which would otherwise loop forever).
  const valuesUrlRef = React.useRef(valuesUrl);
  valuesUrlRef.current = valuesUrl;

  React.useEffect(() => {
    if (settingsLoading) return;
    setProviderLoading(true);
    fetch(listUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setProviderDefs(data.data);
          const providers = Object.keys(data.data);
          setProviderList(providers);
          const initialProvider =
            activeProvider && providers.includes(activeProvider) ? activeProvider : "";
          setCurrentProvider(initialProvider);
        } else {
          setProviderError(data.message || fetchListErrorMessage);
        }
      })
      .catch(() => setProviderError(fetchListErrorMessage))
      .finally(() => setProviderLoading(false));
  }, [settingsLoading, activeProvider, listUrl, fetchListErrorMessage]);

  React.useEffect(() => {
    if (!currentProvider) return;
    setProviderLoading(true);
    fetch(valuesUrlRef.current(currentProvider))
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          try {
            setProviderValues(JSON.parse(data.data.addition || "{}"));
          } catch {
            setProviderValues({});
          }
        } else {
          setProviderError(data.message || fetchValuesErrorMessage);
        }
      })
      .catch(() => setProviderError(fetchValuesErrorMessage))
      .finally(() => setProviderLoading(false));
  }, [currentProvider, fetchValuesErrorMessage]);

  const save = React.useCallback(
    async (values: any) => {
      setProviderLoading(true);
      try {
        const res = await fetch(saveUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: currentProvider, addition: JSON.stringify(values) }),
        });
        const data = await res.json();
        if (data.status !== "success") {
          throw new Error(data.message || saveErrorMessage);
        }
        setProviderValues(values);
        toast.success(saveSuccessMessage);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : saveErrorMessage);
      } finally {
        setProviderLoading(false);
      }
    },
    [currentProvider, saveUrl, saveErrorMessage, saveSuccessMessage]
  );

  return {
    providerDefs,
    providerList,
    currentProvider,
    setCurrentProvider,
    providerValues,
    setProviderValues,
    providerLoading,
    providerError,
    save,
  };
}
