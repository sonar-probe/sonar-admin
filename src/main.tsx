import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./global.css";
import "@radix-ui/themes/styles.css";
import "./shared/i18n/config";
import ErrorBoundary from "./shared/components/ErrorBoundary";
import { AdminApp } from "./admin-ui/App";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <StrictMode>
      <AdminApp />
    </StrictMode>
  </ErrorBoundary>,
);
