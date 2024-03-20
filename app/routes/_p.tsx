import { redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import TopBanner from "~/components/TopBanner";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { requireUserId } from "~/session.server";
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  // to-do
  // check if the user is a member of this league
  if (userId) {
    return null;
  } else {
    return redirect("/login");
  }
}

export default function ProtectedWrapper() {
  return (
    <div>
      <TopBanner />
      <div className="mx-8">
        <Outlet />
      </div>
    </div>
  );
}
