// routes.js
import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import React from "react";
import { Navigate } from "react-router-dom";

const AdminLayout = lazy(() => import("./layout/AdminLayout"));
const Admin = lazy(() => import("./features/nodes/NodesPage"));
const Dashboard = lazy(() => import("./features/dashboard/DashboardPage"));
const NotFound = lazy(() => import("@/shared/ui/NotFoundPage"));

export const routes: RouteObject[] = [
  {
    path: "/admin/database-migration",
    element: React.createElement(
      lazy(() => import("./guides/database-migration")),
    ),
  },
  {
    path: "/install",
    element: React.createElement(lazy(() => import("./guides/install"))),
  },
  {
    path: "/database-recovery",
    element: React.createElement(
      lazy(() => import("./guides/database-recovery")),
    ),
  },
  {
    path: "/admin",
    element: React.createElement(AdminLayout),
    children: [
      { index: true, element: React.createElement(Navigate, { to: "/admin/dashboard", replace: true }) },
      {
        path: "dashboard",
        element: React.createElement(Dashboard),
      },
      {
        path: "servers",
        element: React.createElement(Admin),
      },
      {
        path: "theme_managed",
        element: React.createElement(
          lazy(() => import("./features/themes/theme_managed"))
        ),
      },
      {
        path: "theme_raw",
        element: React.createElement(
          lazy(() => import("./features/themes/theme_raw"))
        ),
      },
      {
        path: "themes",
        element: React.createElement(
          lazy(() => import("./features/settings/_layout"))
        ),
        children: [
          {
            index: true,
            element: React.createElement(
              lazy(() => import("./features/themes/themes"))
            ),
          },
        ],
      },
      {
        path: "theme",
        element: React.createElement(Navigate, {
          to: "/admin/themes",
          replace: true,
        }),
      },
      {
        path: "plugins",
        element: React.createElement(
          lazy(() => import("./features/plugins/plugins"))
        ),
      },
      {
        path: "plugins/config",
        element: React.createElement(
          lazy(() => import("./features/plugins/plugin_config"))
        ),
      },
      {
        path: "plugin-page",
        element: React.createElement(
          lazy(() => import("./features/plugins/plugin_page"))
        ),
      },
      {
        path: "market/themes",
        element: React.createElement(
          lazy(() => import("./features/themes/market/themes"))
        ),
      },
      {
        path: "market/plugins",
        element: React.createElement(
          lazy(() => import("./features/plugins/market/plugins"))
        ),
      },
      {
        path: "sessions",
        element: React.createElement(
          lazy(() => import("./features/system/sessions"))
        ),
      },
      {
        path: "account",
        element: React.createElement(
          lazy(() => import("./features/account/account"))
        ),
      },
      {
        path: "settings",
        element: React.createElement(
          lazy(() => import("./features/settings/_layout"))
        ),
        children: [
          {
            index: true,
            element: React.createElement(Navigate, {
              to: "/admin/settings/site",
              replace: true,
            }),
          },
          {
            path: "site",
            element: React.createElement(
              lazy(() => import("./features/settings/site"))
            ),
          },
          {
            path: "theme",
            element: React.createElement(Navigate, {
              to: "/admin/themes",
              replace: true,
            }),
          },
          {
            path: "custom",
            element: React.createElement(
              lazy(() => import("./features/settings/custom"))
            ),
          },
          {
            path: "sign-on",
            element: React.createElement(
              lazy(() => import("./features/settings/sign-on"))
            ),
          },
          {
            path: "notification",
            element: React.createElement(Navigate, {
              to: "/admin/notification/channels",
              replace: true,
            }),
          },
          {
            path: "general",
            element: React.createElement(
              lazy(() => import("./features/settings/general"))
            ),
          },
          {
            path: "metrics",
            element: React.createElement(
              lazy(() => import("./features/settings/metrics"))
            ),
          },
        ],
      },
      {
        path: "notification",
        children: [
          {
            index: true,
            element: React.createElement(Navigate, {
              to: "/admin/notification/channels",
              replace: true,
            }),
          },
          {
            path: "channels",
            element: React.createElement(
              lazy(() => import("./features/settings/_layout"))
            ),
            children: [
              {
                index: true,
                element: React.createElement(
                  lazy(() => import("./features/notifications/channels"))
                ),
              },
            ],
          },
          {
            path: "offline",
            element: React.createElement(
              lazy(() => import("./features/notifications/offline"))
            ),
          },
          {
            path: "load",
            element: React.createElement(
              lazy(() => import("./features/notifications/load"))
            ),
          },
          {
            path: "general",
            element: React.createElement(
              lazy(() => import("./features/notifications/general"))
            ),
          },
        ],
      },
      {
        path: "ping",
        element: React.createElement(
          lazy(() => import("./features/monitoring/ping/pingTask"))
        ),
      },
      {
        path: "about",
        element: React.createElement(lazy(() => import("./features/system/about"))),
      },
      {
        path: "logs",
        element: React.createElement(lazy(() => import("./features/system/log"))),
      },
      {
        path: "pprof",
        element: React.createElement(lazy(() => import("./features/system/pprof"))),
      }
    ],
  },
  {
    path: "/manage/*",
    element: React.createElement(lazy(() => import("./guides/manage"))),
  },
  // Catch-all 404 route
  { path: "*", element: React.createElement(NotFound) },
];
