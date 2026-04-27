import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Button,
  Card,
  Flex,
  Heading,
  IconButton,
  Text,
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
  getPayoutByDivisionId,
  upsertDivisionPayout,
  DEFAULT_PAYOUT,
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
  if (action === "savePayout") {
    const divisionId = formData.get("divisionId") as string;
    const firstPlace = Number(formData.get("firstPlace"));
    const secondPlace = Number(formData.get("secondPlace"));
    const thirdPlaceRaw = formData.get("thirdPlace") as string;
    const thirdPlace = thirdPlaceRaw ? Number(thirdPlaceRaw) : null;

    invariant(Boolean(divisionId), "division id is required");
    invariant(!isNaN(firstPlace) && firstPlace > 0, "1st place amount is required");
    invariant(!isNaN(secondPlace) && secondPlace > 0, "2nd place amount is required");

    return upsertDivisionPayout(divisionId, firstPlace, secondPlace, thirdPlace);
  }
}

export async function loader({ params }: LoaderFunctionArgs) {
  const league = await getLeagueBySlug(params.league as string);
  invariant(league, "league is invalid");
  const divisions = await getDivisionsByLeague(league);

  const divisionsWithPayouts = await Promise.all(
    divisions.map(async (division) => {
      const payout = await getPayoutByDivisionId(division.id);
      return {
        ...division,
        payout: payout
          ? { firstPlace: payout.firstPlace, secondPlace: payout.secondPlace, thirdPlace: payout.thirdPlace }
          : { firstPlace: DEFAULT_PAYOUT.firstPlace, secondPlace: DEFAULT_PAYOUT.secondPlace, thirdPlace: DEFAULT_PAYOUT.thirdPlace },
      };
    }),
  );

  return json({ divisions: divisionsWithPayouts });
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
          <Card key={division.id} my="4">
            <Flex justify="between" align="center" mb="3">
              <Heading size="3">{division.name}</Heading>
              <ConfirmDialog
                title="Delete Division"
                description={`Are you sure you want to delete "${division.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                trigger={
                  <IconButton color="red" variant="solid" size="1">
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
            <Form method="post">
              <input type="hidden" name="_action" value="savePayout" />
              <input type="hidden" name="divisionId" value={division.id} />
              <Flex gap="3" align="end" wrap="wrap">
                <label>
                  <Text size="1" weight="bold" mb="1" as="p">1st Place ($)</Text>
                  <TextField.Root
                    name="firstPlace"
                    type="number"
                    defaultValue={division.payout.firstPlace}
                    min={0}
                    style={{ width: 80 }}
                  />
                </label>
                <label>
                  <Text size="1" weight="bold" mb="1" as="p">2nd Place ($)</Text>
                  <TextField.Root
                    name="secondPlace"
                    type="number"
                    defaultValue={division.payout.secondPlace}
                    min={0}
                    style={{ width: 80 }}
                  />
                </label>
                <label>
                  <Text size="1" weight="bold" mb="1" as="p">3rd Place ($)</Text>
                  <TextField.Root
                    name="thirdPlace"
                    type="number"
                    defaultValue={division.payout.thirdPlace ?? ""}
                    min={0}
                    placeholder="—"
                    style={{ width: 80 }}
                  />
                </label>
                <Button type="submit" variant="soft">
                  Save Payouts
                </Button>
              </Flex>
            </Form>
          </Card>
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
