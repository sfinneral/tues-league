import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { getLeagueSlugByUserId } from "~/models/user.server";
import { requireUserId } from "~/session.server";
export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);

  if (userId) {
    const leagueSlug = await getLeagueSlugByUserId(userId);
    if (leagueSlug) {
      return redirect(`/${leagueSlug}`);
    } else {
      return redirect("/new-member");
    }
  } else {
    return redirect("/login");
  }
}
