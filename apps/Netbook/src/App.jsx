import { lazy, Suspense } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { FaroRoutes } from "@grafana/faro-react";
import { navMeta } from "@shared/core/utils/constants";

import RequireNotGuest from "@shared/core/gateways/RequireNotGuest";

import Dashboard from "@shared/core/pages/Dashboard";
import Login from "@shared/core/pages/Login";
import NotFound from "@shared/core/pages/NotFound";

import Loading from "@shared/ui/components/Loading";

const Notes = lazy(() => import("./pages/Notes"));
const NoteDetail = lazy(() => import("./pages/NoteDetail"));
const NewNote = lazy(() => import("./pages/NewNote"));
const EditNote = lazy(() => import("./pages/EditNote"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <FaroRoutes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Dashboard navMeta={navMeta.netbook} />}>
            <Route element={<RequireNotGuest />}>
              <Route index element={<Notes />} />
              <Route path="notes/new" element={<NewNote />} />
              <Route path="notes/:id" element={<NoteDetail />} />
              <Route path="notes/:id/edit" element={<EditNote />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </FaroRoutes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
