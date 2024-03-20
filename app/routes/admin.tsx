import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import TopBanner from "~/components/TopBanner";
import { getUserById } from "~/models/user.server";
import { requireUserId } from "~/session.server";
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const user = await getUserById(userId);
  if (user && process.env.ADMIN_EMAILS?.includes(user.email)) {
    return null;
  } else {
    return redirect("/");
  }
}

export default function AdminWrapper() {
  return (
    <main>
      <TopBanner />
      <div className="mx-8">
        <Outlet />
      </div>
    </main>
  );
}
