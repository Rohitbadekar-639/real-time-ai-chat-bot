import AppRoutes from "./routes/AppRoutes";
import { UserProvider } from "./context/user.context";
import KeepAlive from "./components/KeepAlive";

export default function App() {
  return (
    <UserProvider>
      <KeepAlive />
      <AppRoutes />
    </UserProvider>
  );
}
