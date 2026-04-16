import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  TextField,
} from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import {
  createDivision,
  deleteDivisionById,
  getDivisionsByLeague,
} from "~/models/division.server";
import { getLeagueBySlug } from "~/models/league.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { league: leagueSlug } = params;
  const formData = await request.formData();
  const action = formData.get("_action");
  if (action === "create") {
    const name = formData.get("name") as string;

    const league = await getLeagueBySlug(leagueSlug as string);
    invariant(Boolean(name), "division name is required");
    invariant(Boolean(league), "league slug in url is invalid");

    return createDivision(name, league!.id);
  }
  if (action === "delete") {
    const divisionId = formData.get("divisionId") as string;
    invariant(Boolean(divisionId), "division id is required");
    return deleteDivisionById(divisionId);
  }
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
  const submit = useSubmit();
  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);
  return (
    <div>
      <Heading>Divisions</Heading>

      <section>
        {divisions.map((division) => (
          <Flex gap="4" my="4" key={division.id}>
            <div>{division.name}</div>
            <ConfirmDialog
              title="Delete Division"
              description={`Are you sure you want to delete "${division.name}"? This action cannot be undone.`}
              confirmLabel="Delete"
              trigger={
                <IconButton color="red" variant="solid">
                  <Cross2Icon />
                </IconButton>
              }
              onConfirm={() => {
                const formData = new FormData();
                formData.set("_action", "delete");
                formData.set("divisionId", division.id);
                submit(formData, { method: "post" });
              }}
            />
          </Flex>
        ))}
      </section>

      <Form method="post" ref={formRef}>
        <Card mt="4">
          <Heading size="2">Add new Division</Heading>
          <Flex gap="3" py="3">
            <TextField.Root name="name" placeholder="division name" />
            <Button name="_action" value="create" type="submit" variant="solid">
              save
            </Button>
          </Flex>
        </Card>
      </Form>
    </div>
  );
}
