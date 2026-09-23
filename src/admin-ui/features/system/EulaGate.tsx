import { Button, Dialog } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { updateSettingsWithToast, useSettings } from "@/admin-ui/api/settings";
import { getEula } from "@/admin-ui/utils/eula";
import { normalizeLanguage, readStoredLanguage } from "@/shared/utils/language";

/**
 * Prompts Chinese-locale admins to accept the EULA before the first use.
 * Mounted once alongside AdminLayout, not nested under it — it isn't part
 * of the app shell, just a one-time gate that happens to render on top.
 */
const EulaGate = () => {
  const { t, i18n } = useTranslation();
  const { settings, loading, error, setSettings } = useSettings();
  const lang = readStoredLanguage() || "en";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || error || !settings || settings.eula_accepted !== false) {
      setOpen(false);
      return;
    }
    if (normalizeLanguage(lang).startsWith("zh")) {
      setOpen(true);
    }
  }, [loading, error, settings, lang]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content className="km-admin-eula-dialog">
        <Dialog.Title>{t("eula.title")}</Dialog.Title>
        <div className="km-admin-eula-content flex flex-col gap-2">
          <div className="max-h-[70vh] overflow-y-auto space-y-4">
            <pre className="text-wrap">{getEula(i18n.language)}</pre>
          </div>
          <div className="flex flex-row gap-2 justify-end items-center">
            <Button
              variant="soft"
              color="red"
              onClick={() => {
                // window.close() only works on a window/tab opened via
                // script; for the normal case (the admin navigated here
                // directly) it silently no-ops, so fall back to sending
                // them away from the admin panel instead of doing nothing.
                window.close();
                window.location.href = "/";
              }}
            >
              {t("eula.reject")}
            </Button>
            <Button
              variant="solid"
              onClick={async () => {
                try {
                  await updateSettingsWithToast({ eula_accepted: true }, t);
                  setSettings((prev) => ({
                    ...prev,
                    eula_accepted: true,
                  }));
                  setOpen(false);
                } catch {
                  setOpen(true);
                }
              }}
            >
              {t("eula.accept")}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default EulaGate;
