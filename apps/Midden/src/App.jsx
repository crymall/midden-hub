import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { navMeta } from "@shared/core/utils/constants";

import RequireNotGuest from "@shared/core/gateways/RequireNotGuest";

import Dashboard from "@shared/core/pages/Dashboard";

import Loading from "@shared/ui/components/Loading";

const Login = lazy(() => import("@shared/core/pages/Login"));
const Explorer = lazy(() => import("./pages/Explorer"));
const Settings = lazy(() => import("./pages/Settings"));
const Experiments = lazy(() => import("./pages/Experiments"));
const NotFound = lazy(() => import("@shared/core/pages/NotFound"));
const About = lazy(() => import("./pages/About"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Dashboard navMeta={navMeta.midden} />}>
            <Route index element={<Explorer />} />
            <Route path="/about" element={<About />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route element={<RequireNotGuest />}>
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
