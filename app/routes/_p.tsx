import { Flex, TabNav } from "@radix-ui/themes";
import { LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { Outlet, useLoaderData, useLocation } from "@remix-run/react";
import TopBanner from "~/components/TopBanner";
import { getLeagueSlugByUserId, getUserById } from "~/models/user.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  // to-do
  // check if the user is a member of this league
  if (userId) {
    const user = await getUserById(userId);
    return json({
      user,
      leagueSlug: params.league || (await getLeagueSlugByUserId(userId)),
    });
  } else {
    return redirect("/login");
  }
}

export default function ProtectedWrapper() {
  const { leagueSlug, user } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navItems = [
    {
      text: "Schedule & Scores",
      href: `/${leagueSlug}`,
    },
    {
      text: "Standings",
      href: `/${leagueSlug}/standings`,
    },
    {
      text: "Members",
      href: `/${leagueSlug}/members`,
    },
  ];
  return (
    <Flex justify="center">
      <div className="h-full max-w-5xl">
        {user?.profile?.firstName ? <TopBanner firstName={user.profile?.firstName} /> : null}

        <TabNav.Root m="3">
          {navItems.map((navItem) => (
            <TabNav.Link
              key={navItem.text}
              href={navItem.href}
              active={location.pathname === navItem.href}
            >
              {navItem.text}
            </TabNav.Link>
          ))}
        </TabNav.Root>
        <main className="p-4 pb-20">
          <Outlet />
        </main>
      </div>
    </Flex>
  );
}
