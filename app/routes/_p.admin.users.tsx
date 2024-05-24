import { Cross2Icon } from "@radix-ui/react-icons";
import { Heading, IconButton, Table } from "@radix-ui/themes";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
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
  return (
    <>
      <Heading size="4" align="center">
        {users.length} Users
      </Heading>
      <Form method="post">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>user</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>phone</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user.id}>
                <Table.RowHeaderCell>
                  {user.profile?.firstName} {user.profile?.lastName}
                </Table.RowHeaderCell>
                <Table.Cell>{user.email}</Table.Cell>
                <Table.Cell>
                  {formatPhoneNumber(user.profile?.phoneNumber)}
                </Table.Cell>
                <Table.Cell>
                  <IconButton
                    type="submit"
                    color="red"
                    name="delete"
                    value={user.email}
                  >
                    <Cross2Icon />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Form>
    </>
  );
}
