import { Suspense, useLayoutEffect } from "react";
import { Outlet } from "react-router-dom";

import Header from "../../ui/components/Header";
import Loading from "../../ui/components/Loading";
import { useAuth } from "../hooks/useAuth";

const Dashboard = ({ navMeta }) => {
  const { user, logout } = useAuth();
  const { title, titleLink, navLinks } = navMeta;

  useLayoutEffect(() => {
    document.body.dataset.theme = title.toLowerCase();
    return () => {
      delete document.body.dataset.theme;
    };
  }, [title]);

  return (
    <div>
      <Header
        user={user}
        logout={logout}
        title={title}
        titleLink={titleLink}
        navLinks={navLinks}
      />
      <main className="bg-dark flex min-h-[calc(100vh-80px)] items-start justify-center md:pt-5">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default Dashboard;
