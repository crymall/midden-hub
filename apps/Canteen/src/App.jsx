import { lazy, Suspense } from "react";
import { BrowserRouter, Route } from "react-router-dom";
import { FaroRoutes } from "@grafana/faro-react";
import { navMeta } from "@shared/core/utils/constants";

import RequireNotGuest from "@shared/core/gateways/RequireNotGuest";

import Dashboard from "@shared/core/pages/Dashboard";
import Login from "@shared/core/pages/Login";
import NotFound from "@shared/core/pages/NotFound";

import Loading from "@shared/ui/components/Loading";

const CanteenHome = lazy(() => import("./pages/CanteenHome"));
const RecipeSearch = lazy(() => import("./pages/RecipeSearch"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const NewRecipe = lazy(() => import("./pages/NewRecipe"));
const EditRecipe = lazy(() => import("./pages/EditRecipe"));
const MyLists = lazy(() => import("./pages/MyLists"));
const ListView = lazy(() => import("./pages/ListView"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const Conversation = lazy(() => import("./pages/Conversation"));
const FollowerFollowingLists = lazy(() => import("./pages/FollowerFollowingLists"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <FaroRoutes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Dashboard navMeta={navMeta.canteen} />}>
            <Route index element={<CanteenHome />} />
            <Route path="recipes" element={<RecipeSearch />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="user/:id" element={<UserProfile />} />

            <Route element={<RequireNotGuest />}>
              <Route path="recipes/new" element={<NewRecipe />} />
              <Route path="recipes/:id/edit" element={<EditRecipe />} />
              <Route path="my-lists" element={<MyLists />} />
              <Route path="my-lists/:id" element={<ListView />} />
              <Route path="messages" element={<Messages />} />
              <Route path="messages/:id" element={<Conversation />} />
              <Route path="user/:id/network" element={<FollowerFollowingLists />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </FaroRoutes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
