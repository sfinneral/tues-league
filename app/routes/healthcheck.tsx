// learn more: https://fly.io/docs/reference/configuration/#services-http_checks
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader() {
  try {
    // Try to connect to the database
    await prisma.$queryRaw`SELECT 1`;
    return json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Health check failed:", error);
    return json({ status: "error", error: "Database connection failed" }, { status: 500 });
  }
}
