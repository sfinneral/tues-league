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
              <Table.ColumnHeaderCell className="hidden md:table-cell">email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell className="hidden md:table-cell">phone</Table.ColumnHeaderCell>
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
                    {user.profile?.firstName} {user.profile?.lastName}<br />
                    {user.email}<br />
                    {formatPhoneNumber(user.profile?.phoneNumber)}
                  </div>
                </Table.RowHeaderCell>
                <Table.Cell className="hidden md:table-cell">
                  {user.email}
                </Table.Cell>
                <Table.Cell className="hidden md:table-cell">
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
