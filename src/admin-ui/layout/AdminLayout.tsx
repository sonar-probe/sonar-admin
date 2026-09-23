import { Outlet } from "react-router-dom";

import AdminPanelBar from "@/admin-ui/components/AdminPanelBar";
import { AdminNavigationProvider } from "@/admin-ui/contexts/AdminNavigationContext";
import { AccountProvider } from "@/shared/auth/AccountContext";
import EulaGate from "@/admin-ui/features/system/EulaGate";

const AdminLayout = () => {
  return (
    <>
      <EulaGate />
      <AccountProvider>
        <AdminNavigationProvider>
          <AdminPanelBar content={<Outlet />} />
        </AdminNavigationProvider>
      </AccountProvider>
    </>
  );
};

export default AdminLayout;
