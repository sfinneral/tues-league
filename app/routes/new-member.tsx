import { Button, Flex, Heading } from "@radix-ui/themes";
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { getLeagueSlugByUserId, getUserWithSubs } from "~/models/user.server";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  let leagueSlug = await getLeagueSlugByUserId(userId);
  const userSubs = await getUserWithSubs(userId);
  if (userSubs?.subs.length && !leagueSlug) {
    leagueSlug = userSubs.subs[0].league.slug;
  }
  if (leagueSlug) {
    return redirect(`/${leagueSlug}`);
  } else {
    return null;
  }
}

export default function NewMember() {
  return (
    <Flex
      justify="center"
      align="center"
      className="min-h-screen text-center"
      p="9"
    >
      <div>
        <Heading>All set!</Heading>
        <p>Check back in later once you have been added to a league</p>
        <Form action="/logout" method="post" className="mt-10">
          <Button type="submit" variant="ghost">
            Log out
          </Button>
        </Form>
      </div>
    </Flex>
  );
}
