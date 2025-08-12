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
    const isAdmin = user && process.env.ADMIN_EMAILS?.includes(user.email);
    const isSteve = user && user.email === "sfinneral@gmail.com";
    return json({
      user,
      leagueSlug: params.league || (await getLeagueSlugByUserId(userId)),
      isAdmin,
      isSteve,
    });
  } else {
    return redirect("/login");
  }
}

export default function ProtectedWrapper() {
  const { leagueSlug, user } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navItems: { text: string; href: string; className?: string }[] = [
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
    {
      text: "Playoffs",
      href: `/${leagueSlug}/playoffs`,
      className: "hidden sm:block"
    },
  ];
  return (
    <Flex justify="center">
      <div className="h-full max-w-7xl">
        {user?.profile?.firstName ? (
          <TopBanner firstName={user.profile?.firstName} />
        ) : null}

        <TabNav.Root m="3">
          {navItems.map((navItem) => (
            <div key={navItem.text} className={navItem.className}>
              <TabNav.Link
                href={navItem.href}
                active={location.pathname === navItem.href}
              >
                {navItem.text}
              </TabNav.Link>
            </div>
          ))}
        </TabNav.Root>
        <main className="p-2 pb-20">
          <Outlet />
        </main>
      </div>
    </Flex>
  );
}
