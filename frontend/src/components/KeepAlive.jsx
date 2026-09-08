import { useEffect } from "react";
import { pingApi } from "../config/health";

export default function KeepAlive() {
  useEffect(() => {
    pingApi(20000);
    const id = setInterval(() => {
      pingApi(20000);
    }, 45 * 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}
