import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./context/user.context";
import KeepAlive from "./components/KeepAlive";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <KeepAlive />
        <AppRoutes />
      </UserProvider>
    </ErrorBoundary>
  );
}
