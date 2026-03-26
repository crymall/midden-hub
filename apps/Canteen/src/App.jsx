import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/auth/AuthProvider";
import DataProvider from "./context/data/DataProvider";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import RequireNotGuest from "./components/gateways/RequireNotGuest";
import { navMeta } from "./utils/constants";

const CanteenHome = lazy(() => import("./pages/Canteen/CanteenHome"));
const RecipeSearch = lazy(() => import("./pages/Canteen/RecipeSearch"));
const RecipeDetail = lazy(() => import("./pages/Canteen/RecipeDetail"));
const NewRecipe = lazy(() => import("./pages/Canteen/NewRecipe"));
const EditRecipe = lazy(() => import("./pages/Canteen/EditRecipe"));
const MyLists = lazy(() => import("./pages/Canteen/MyLists"));
const ListView = lazy(() => import("./pages/Canteen/ListView"));
const UserProfile = lazy(() => import("./pages/Canteen/UserProfile"));
const Messages = lazy(() => import("./pages/Canteen/Messages"));
const Conversation = lazy(() => import("./pages/Canteen/Conversation"));
const FollowerFollowingLists = lazy(
  () => import("./pages/Canteen/FollowerFollowingLists"),
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={<Dashboard navMeta={navMeta.canteen} />}
            >
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
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
