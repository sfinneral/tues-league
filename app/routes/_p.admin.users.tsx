import { Cross2Icon } from "@radix-ui/react-icons";
import { Badge, Flex, Heading, IconButton, Table } from "@radix-ui/themes";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { deleteUserByEmail, getAllUsers } from "~/models/user.server";
import { formatPhoneNumber } from "~/utils";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("delete") as string;
  if (email) {
    return await deleteUserByEmail(email);
  }
}

export async function loader() {
  const users = await getAllUsers();
  users.sort((a, b) => {
    const aName = a.profile?.lastName || "z";
    const bName = b.profile?.lastName || "z";
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });
  return json({ users });
}

export default function AdminUsers() {
  const { users } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  return (
    <>
      <Heading size="4" align="center">
        {users.length} Users
      </Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>user</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden md:table-cell">
              email
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden md:table-cell">
              phone
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="hidden md:table-cell">
              leagues
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.RowHeaderCell>
                <div className="hidden md:block">
                  {user.profile?.firstName} {user.profile?.lastName}
                </div>
                <div className="md:hidden">
                  {user.profile?.firstName} {user.profile?.lastName}
                  <br />
                  {user.email}
                  <br />
                  {formatPhoneNumber(user.profile?.phoneNumber)}
                  <Flex gap="1" direction="column" mt="1" align="start">
                    {[
                      ...new Map(
                        user.teams.map((t) => [t.league.name, "teal"] as const),
                      ),
                    ].map(([name, color]) => (
                      <Badge key={name} color={color} size="1">
                        {name}
                      </Badge>
                    ))}
                    {user.subs.map((s) => (
                      <Badge
                        key={`sub-${s.league.name}`}
                        color="orange"
                        size="1"
                      >
                        {s.league.name} (sub)
                      </Badge>
                    ))}
                  </Flex>
                </div>
              </Table.RowHeaderCell>
              <Table.Cell className="hidden md:table-cell">
                {user.email}
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell">
                {formatPhoneNumber(user.profile?.phoneNumber)}
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell">
                <Flex gap="1" direction="column" align="start">
                  {[
                    ...new Map(
                      user.teams.map((t) => [t.league.name, "teal"] as const),
                    ),
                  ].map(([name, color]) => (
                    <Badge key={name} color={color}>
                      {name}
                    </Badge>
                  ))}
                  {user.subs.map((s) => (
                    <Badge key={`sub-${s.league.name}`} color="orange">
                      {s.league.name} (sub)
                    </Badge>
                  ))}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <ConfirmDialog
                  title="Delete User"
                  description={`Are you sure you want to delete ${user.profile?.firstName} ${user.profile?.lastName}? This action cannot be undone.`}
                  confirmLabel="Delete"
                  trigger={
                    <IconButton color="red" variant="surface">
                      <Cross2Icon />
                    </IconButton>
                  }
                  onConfirm={() => {
                    const formData = new FormData();
                    formData.set("delete", user.email);
                    submit(formData, { method: "post" });
                  }}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
}
