import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import AuthProvider from "./context/auth/AuthProvider";
import DataProvider from "./context/data/DataProvider";
import Dashboard from "./pages/Dashboard";
import RequireNotGuest from "./components/gateways/RequireNotGuest";
import { navMeta } from "./utils/constants";
import Loading from "./pages/Loading";

const Login = lazy(() => import("./pages/Login"));
const Explorer = lazy(() => import("./pages/Explorer"));
const Settings = lazy(() => import("./pages/Settings"));
const Experiments = lazy(() => import("./pages/Experiments"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<Dashboard navMeta={navMeta.midden} />}>
                <Route index element={<Explorer />} />
                <Route path="/experiments" element={<Experiments />} />
                <Route element={<RequireNotGuest />}>
                  <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
