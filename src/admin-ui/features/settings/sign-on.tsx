import {
  SettingCardLabel,
  SettingCardSelect,
  SettingCardShortTextInput,
  SettingCardSwitch,
} from "@/admin-ui/components/SettingCard";
import { updateSettingsWithToast, useSettings } from "@/admin-ui/api/settings";
import { Button, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import Loading from "@/shared/components/loading";
import React from "react";
import { renderProviderInputs } from "@/admin-ui/utils/renderProviders";
import { toast } from "sonner";
import { useProviderRegistry } from "@/admin-ui/hooks/useProviderRegistry";
import { generateRandomKey } from "@/admin-ui/utils/randomKey";

export default function SignOnSettings() {
  const { t } = useTranslation();
  const { settings, loading, error } = useSettings();
  const {
    providerDefs,
    providerList,
    currentProvider,
    setCurrentProvider,
    providerValues,
    setProviderValues,
    providerLoading,
    providerError,
    save: handleOidcSave,
  } = useProviderRegistry({
    listUrl: "/api/admin/settings/oidc",
    valuesUrl: (provider) => `/api/admin/settings/oidc?provider=${provider}`,
    saveUrl: "/api/admin/settings/oidc",
    activeProvider: settings.o_auth_provider,
    settingsLoading: loading,
    fetchListErrorMessage: t("settings.sso.provider_fetch_failed"),
    fetchValuesErrorMessage: t("settings.sso.provider_settings_fetch_failed"),
    saveErrorMessage: t("settings.sso.provider_save_failed"),
    saveSuccessMessage: t("common.success"),
  });

  // 渲染 provider 的输入项已抽象到 utils/renderProviders.tsx 中

  if (loading || (!providerLoading && providerList.length === 0 && !providerError)) {
    return <Loading />;
  }
  if (error) {
    return <Text color="red">{error}</Text>;
  }
  if (providerError) {
    return <Text color="red">{providerError}</Text>;
  }

  return (
    <>
      <SettingCardLabel>{t("settings.sign_on.title")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.sign_on.disable_password")}
        defaultChecked={settings.disable_password_login}
        onChange={async (checked) => {
          await updateSettingsWithToast({ disable_password_login: checked }, t);
        }}
        className="km-page-admin-settings-sign-on km-setting-card"
      />
      <SettingCardLabel>{t("settings.sso.title")}</SettingCardLabel>
      <SettingCardSwitch
        title={t("settings.sso.enable")}
        defaultChecked={settings.o_auth_enabled}
        description={t("settings.sso.enable_description")}
        onChange={async (checked) => {
          await updateSettingsWithToast({ o_auth_enabled: checked }, t);
        }}
        className="km-setting-card"
      />
      <SettingCardSelect
        title={String(t("settings.sso.provider"))}
        description={String(t("settings.sso.provider_description"))}
        options={providerList.map((p) => ({ value: p, label: p }))}
        value={currentProvider}
        OnSave={async (val: string) => {
          if (val === currentProvider) return;
          await updateSettingsWithToast({ o_auth_provider: val }, t);
          setCurrentProvider(val);
        }}
      />
      {providerLoading ? <Loading /> : renderProviderInputs({
        currentProvider,
        providerDefs,
        providerValues,
        translationPrefix: "settings.sso." + currentProvider,
        title: t("settings.sso.provider_fields"),
        description: t("settings.sso.provider_fields_description"),
        footer: t("settings.sso.callback_url_tips", { url: `${window.location.origin}/api/oauth_callback` }),
        setProviderValues,
        handleSave: handleOidcSave,
        t,
      })}
      <SettingCardLabel>API</SettingCardLabel>
      <ApiCard />
    </>
  );
}

const ApiCard = () => {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [apiValues, setApiValues] = React.useState<string>(settings?.api_key || "" );

  // 处理生成按钮点击
  const handleGenerateApiKey = () => {
    setApiValues(generateRandomKey(32, "komari-"));
  };

  // 初始化API值
  React.useEffect(() => {
    if (settings?.api_key) {
      setApiValues(settings.api_key);
    }
  }, [settings?.api_key]);

  return (
    <SettingCardShortTextInput
        title={t("settings.api.title")}
        description={t("settings.api.description")}
        value={apiValues}
        onChange={(e) => setApiValues(e.target.value)}
        OnSave={async (values) => {
          if (!values) {
            await updateSettingsWithToast({ api_key: "" }, t);
            return;
          }
          if (values.length < 12) {
            toast.error(t("settings.api.key_length_error"));
            return;
          }
          await updateSettingsWithToast({ api_key: values }, t);
        }}
      >
        <div className="flex flex-row gap-2 justify-start items-center">
          <Button variant="soft" color="green" onClick={handleGenerateApiKey}>{t('common.generate')}</Button>
        </div>
      </SettingCardShortTextInput>
  )
}