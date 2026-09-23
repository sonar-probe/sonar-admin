import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { updateSettingsWithToast, useSettings } from "@/admin-ui/api/settings";
import {
  SettingCardButton,
  SettingCardLabel,
  SettingCardLongTextInput,
  SettingCardSelect,
  SettingCardSwitch,
} from "@/admin-ui/components/SettingCard";
import { toast } from "sonner";
import Loading from "@/shared/components/loading";
import { renderProviderInputs } from "@/admin-ui/utils/renderProviders";
import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useProviderRegistry } from "@/admin-ui/hooks/useProviderRegistry";

const NotificationSettings = () => {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const {
    providerDefs: messageDefs,
    providerList: messageList,
    currentProvider: currentMessageSender,
    setCurrentProvider: setCurrentMessageSender,
    providerValues: messageValues,
    setProviderValues: setMessageValues,
    providerLoading: messageLoading,
    providerError: messageError,
    save: handleMessageSave,
  } = useProviderRegistry({
    listUrl: "/api/admin/settings/message-sender",
    valuesUrl: (provider) => `/api/admin/settings/message-sender?provider=${provider}`,
    saveUrl: "/api/admin/settings/message-sender",
    activeProvider: settings.notification_method,
    settingsLoading: loading,
    fetchListErrorMessage: t("settings.notification.provider_fetch_failed"),
    fetchValuesErrorMessage: t("settings.notification.provider_settings_fetch_failed"),
    saveErrorMessage: t("common.error"),
    saveSuccessMessage: t("common.success"),
  });

  if (loading || (!messageLoading && messageList.length === 0 && !messageError)) {
    return <Loading />;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }
  if (messageError) {
    return <Text color="red">{messageError}</Text>;
  }

  return (
    <>
      <SettingCardLabel>{t("settings.notification.title")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.notification.enable")}
        description={t("settings.notification.enable_description")}
        defaultChecked={settings.notification_enabled}
        onChange={async (checked) => {
          await updateSettingsWithToast({ notification_enabled: checked }, t);
        }}
        className="km-page-admin-settings-notification km-setting-card"
      />
      <SettingCardLongTextInput
        title={t("settings.notification.template")}
        description={t("settings.notification.template_description")}
        defaultValue={settings.notification_template}
        OnSave={
          async (value) => {
            await updateSettingsWithToast({ notification_template: value }, t);
          }}
      />
      <SettingCardSelect
        title={t("settings.notification.method")}
        description={t("settings.notification.method_description")}
        options={messageList.map((sender) => ({ value: sender, label: sender }))}
        value={currentMessageSender}
        OnSave={async (val: string) => {
          if (val === currentMessageSender) return;
          await updateSettingsWithToast({ notification_method: val }, t);
          setCurrentMessageSender(val);
        }}
      />
      {messageLoading ? <Loading /> : renderProviderInputs({
        currentProvider: currentMessageSender,
        providerDefs: messageDefs,
        providerValues: messageValues,
        translationPrefix: `settings.notification.${currentMessageSender}`,
        title: t("settings.notification.provider_fields"),
        description: t("settings.notification.provider_fields_description"),
        setProviderValues: setMessageValues,
        handleSave: handleMessageSave,
        t,
      })}
      <SettingCardButton
        title={t("settings.notification.test_title")}
        description={t("settings.notification.test_description")}
        onClick={async () => {
          try {
            const res = await fetch("/api/admin/test/sendMessage", {
              method: "POST",
            });
            let data;
            try {
              data = await res.json();
            } catch {
              toast.error(t("common.error"));
              return;
            }
            if (data && data.message && data.code !== 200) {
              toast.error(data.message);
              return;
            }
            toast.success(t("common.success"));
          } catch (error) {
            toast.error(
              t("common.error") +
              ": " +
              (error instanceof Error ? error.message : String(error))
            );
          }
        }}
        className="km-setting-card"
      >
        GO
      </SettingCardButton>
      <label className="text-muted-foreground text-sm flex flex-row items-center gap-1">
        {t("settings.notification.moved")}
        <Link
          to="/admin/notification/general"
        >
          <SquareArrowOutUpRight size={16} />
        </Link>
      </label>
    </>
  );
};

export default NotificationSettings;
