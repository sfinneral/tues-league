import { Heading, Table } from "@radix-ui/themes";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAllUsers } from "~/models/user.server";
export async function loader() {
    const users = await getAllUsers();
    users.sort((a, b) => {
        const aName = a.profile?.lastName || 'z'
        const bName = b.profile?.lastName || 'z'
        if (aName < bName) {
            return -1;
        }
        if (aName > bName) {
            return 1;
        }
        return 0;
    })
    return json({ users })
}

export default function AdminCourses() {
    const { users } = useLoaderData<typeof loader>();
    return (
        <>
            <Heading size="4" align="center">
                {users.length} Users
            </Heading>
            <Table.Root>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeaderCell>user</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>email</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>phone</Table.ColumnHeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {users.map((user) => (
                        <Table.Row key={user.id}>
                            <Table.RowHeaderCell>
                                {user.profile?.firstName} {user.profile?.lastName}
                            </Table.RowHeaderCell>
                            <Table.Cell>
                                {user.email}
                            </Table.Cell>
                            <Table.Cell>
                                {user.profile?.phoneNumber}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </>
    )
}