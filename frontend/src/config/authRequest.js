import axios from "./axios";
import { pingApi } from "./health";

function isWakeError(err) {
  return !err.response || err.code === "ECONNABORTED" || err.code === "ERR_NETWORK";
}

export async function waitForApi(onStatus) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    onStatus?.(attempt === 0 ? "Waking the API…" : "Still waking the API…");
    const status = await pingApi(20000);
    if (status.ok && status.mongo) return status;
    if (status.ok && attempt >= 2) return status;
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  return pingApi(20000);
}

export async function authRequest(method, url, body, onStatus) {
  await waitForApi(onStatus);
  onStatus?.("Creating your session…");

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await axios.request({
        method,
        url,
        data: body,
        timeout: 90000,
      });
    } catch (err) {
      lastError = err;
      if (err.response?.status === 409 || err.response?.status === 401) {
        throw err;
      }
      if (err.response?.status === 400) {
        throw err;
      }
      if (!isWakeError(err) && err.response?.status < 500) {
        throw err;
      }
      onStatus?.("Server is waking up. Retrying…");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  throw lastError;
}
