import { lazy, Suspense } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { FaroRoutes } from "@grafana/faro-react";
import { navMeta } from "@shared/core/utils/constants";

import Dashboard from "@shared/core/pages/Dashboard";
import Login from "@shared/core/pages/Login";
import NotFound from "@shared/core/pages/NotFound";

import Loading from "@shared/ui/components/Loading";

const Notes = lazy(() => import("./pages/Notes"));
const NetbookSplash = lazy(() => import("./pages/NetbookSplash"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <FaroRoutes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Dashboard navMeta={navMeta.netbook} />}>
            <Route index element={<Notes />} />
            <Route path="splash-test" element={<NetbookSplash preview />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </FaroRoutes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
