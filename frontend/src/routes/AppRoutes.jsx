import { lazy, Suspense } from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Login from "../screens/Login";
import Register from "../screens/Register";
import Home from "../screens/Home";
import Landing from "../screens/Landing";
import NotFound from "../screens/NotFound";
import UserAuth from "../auth/UserAuth";

const Project = lazy(() => import("../screens/Project"));

function RouteFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink-950 text-zinc-400">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        <p className="text-sm">Loading workspace…</p>
      </div>
    </div>
  );
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={
            <UserAuth>
              <Home />
            </UserAuth>
          }
        />
        <Route
          path="/project"
          element={
            <UserAuth>
              <Suspense fallback={<RouteFallback />}>
                <Project />
              </Suspense>
            </UserAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
