export function apiError(err, fallback) {
  const data = err.response?.data;

  if (typeof data === "string" && data.trim()) {
    const text = data.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (
      text.includes("buffering timed out") ||
      text.includes("ECONNREFUSED") ||
      text.includes("Mongo")
    ) {
      return "Database is waking up. Please wait a few seconds and try again.";
    }
    return text;
  }

  if (typeof data?.errors === "string") return data.errors;
  if (Array.isArray(data?.errors) && data.errors[0]?.msg) return data.errors[0].msg;
  if (typeof data?.error === "string") return data.error;

  if (!err.response) {
    return "Cannot reach the API. If the server was sleeping, wait a few seconds and try again.";
  }

  return fallback;
}
