import { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";
import ReportPage from "./pages/ReportPage";
import DonePage from "./pages/DonePage";
import ManagePage from "./pages/ManagePage";

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("overview");

  if (loading) return null;
  if (!user) return <LoginPage />;

  const pages = {
    overview: <OverviewPage />,
    report: <ReportPage />,
    done: <DonePage />,
    manage: <ManagePage />,
  };

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {pages[page] || <OverviewPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
