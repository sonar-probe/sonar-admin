import { Suspense, useEffect, useMemo } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import {
  ThemeContext,
  THEME_DEFAULTS,
  type Appearance,
  type Colors,
} from "@/shared/contexts/ThemeContext";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";
import { useSystemTheme } from "@/shared/hooks/useSystemTheme";
import Loading from "@/shared/components/loading";
import { PublicInfoProvider } from "@/shared/contexts/PublicInfoContext";
import { Toaster } from "@/shared/ui/sonner";
import { RPC2Provider } from "@/shared/contexts/RPC2Context";
import { NodeListProvider } from "@/shared/contexts/NodeListContext";
import { useTemporaryShareKey } from "@/shared/auth/useTemporaryShareKey";
import { routes } from "./routes";

const restrictedRoutes = new Set(["/admin/database-migration", "/install", "/database-recovery"]);

function AdminContent() {
  const [appearance, setAppearance] = useLocalStorage<Appearance>("appearance", THEME_DEFAULTS.appearance);
  const [color, setColor] = useLocalStorage<Colors>("color", THEME_DEFAULTS.color);
  const resolvedAppearance = useSystemTheme(appearance);
  const routing = useRoutes(routes);
  const isRestrictedRoute = restrictedRoutes.has(window.location.pathname.replace(/\/$/, ""));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedAppearance === "dark");
  }, [resolvedAppearance]);

  useTemporaryShareKey();

  const themeContextValue = useMemo(
    () => ({ appearance, setAppearance, color, setColor }),
    [appearance, setAppearance, color, setColor],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <Theme appearance={resolvedAppearance} accentColor={color} scaling="110%" className="theme-root" style={{ backgroundColor: "transparent", minHeight: "100vh" }}>
        {isRestrictedRoute ? <><Toaster />{routing}</> : (
          <RPC2Provider><PublicInfoProvider><NodeListProvider><Toaster />{routing}</NodeListProvider></PublicInfoProvider></RPC2Provider>
        )}
      </Theme>
    </ThemeContext.Provider>
  );
}

export function AdminApp() {
  return <BrowserRouter><Suspense fallback={<Loading />}><AdminContent /></Suspense></BrowserRouter>;
}
