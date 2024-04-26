import { Button, Card, Flex, Heading, TextField } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { createDivision, getDivisionsByLeague } from "~/models/division.server";
import { getLeagueBySlug } from "~/models/league.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { league: leagueSlug } = params;
  const formData = await request.formData();
  const name = formData.get("name") as string;

  const league = await getLeagueBySlug(leagueSlug as string);
  invariant(Boolean(name), "division name is required");
  invariant(Boolean(league), "league slug in url is invalid");

  return createDivision(name, league!.id);
}

export async function loader({ params }: LoaderFunctionArgs) {
  const league = await getLeagueBySlug(params.league as string);
  invariant(league, "league is invalid");
  const divisions = await getDivisionsByLeague(league);

  return json({
    divisions,
  });
}

export default function AdminDivisions() {
  const { divisions } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);
  return (
    <div>
      <Heading>Divisions</Heading>

      <Form method="post" ref={formRef}>
        <section>
          {divisions.map((division) => (
            <div key={division.id}>
              <div>{division.name}</div>
            </div>
          ))}
        </section>

        <Card mt='4'>
          <Heading size='2'>Add new Division</Heading>
          <Flex gap="3" py="3">
            <TextField.Root name="name" placeholder="division name" />
            <Button type="submit" variant="solid">
              save
            </Button>
          </Flex>
        </Card>

      </Form>
    </div>
  );
}
