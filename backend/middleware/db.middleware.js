import { waitForMongo } from "../db/db.js";

export async function requireDb(req, res, next) {
  const ok = await waitForMongo(20000);
  if (!ok) {
    return res.status(503).json({
      error: "Database is waking up. Please wait a few seconds and try again.",
    });
  }
  next();
}
