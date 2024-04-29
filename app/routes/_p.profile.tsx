import { Button, Flex, Heading, Separator, Text, TextField } from "@radix-ui/themes";

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, json, redirect, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import invariant from "tiny-invariant";
import { getLeagueSlugByUserId, getUserById, updateUser } from "~/models/user.server";
import { getUserId } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  invariant(
    id && firstName && lastName && email && phoneNumber,
    "All fields are required",
  );

  await updateUser(id, email, firstName, lastName, phoneNumber);
  return redirect("/profile");
};

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) {
    const user = await getUserById(userId);
    const isAdmin = user && process.env.ADMIN_EMAILS?.includes(user.email)
    const leagueSlug = await getLeagueSlugByUserId(userId)
    return json({ user, isAdmin, leagueSlug });
  }
}

export default function Profile() {
  const { user, isAdmin, leagueSlug } = useLoaderData<typeof loader>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState(
    user?.profile?.firstName || undefined,
  );
  const [lastName, setLastName] = useState(
    user?.profile?.lastName || undefined,
  );
  const [email, setEmail] = useState(user?.email || undefined);
  const [phoneNumber, setPhoneNumber] = useState(
    user?.profile?.phoneNumber || undefined,
  );

  return (
    <div>
      {isUpdating ? (
        <Form method="post" onSubmit={() => setIsUpdating(false)}>
          <TextField.Root
            className="mt-4"
            name="firstName"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField.Root
            className="mt-4"
            name="lastName"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField.Root
            className="mt-4"
            name="email"
            placeholder="First Name"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField.Root
            className="mt-4"
            name="phoneNumber"
            placeholder="Phone Number"
            value={phoneNumber || undefined}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <input type="hidden" name="id" value={user?.id} />
          <Flex mt="4" justify="end" gap="3" align="end">
            <Button
              variant="soft"
              color="gray"
              onClick={() => setIsUpdating(false)}
            >
              Cancel
            </Button>

            <Button type="submit">Save</Button>
          </Flex>
        </Form>
      ) : (
        <Flex direction="column">
          <Heading size="3">
            {firstName} {lastName}
          </Heading>
          <Text color="gray">
            {email}
            <br />
            {phoneNumber}
          </Text>
          <Flex mt="4" justify="between" align="end">
            <Form action="/logout" method="post">
              <Button type="submit" variant="ghost">
                Log out
              </Button>
            </Form>
            <Flex gap="3">
              <Button onClick={() => setIsUpdating(true)}>Update</Button>
            </Flex>
          </Flex>
        </Flex>
      )}
      {isAdmin ? <div>
          <Separator my="6" size="4" />
          <Flex direction='column'>
            <Heading size='2' mb='4'>Admin Links</Heading>
            <Link to={`/admin/${leagueSlug}/matches`}><Button>Enter Scores</Button></Link>
          </Flex>
        </div> : null
      }
    </div>
  );
}
