import { Button, Flex, Heading } from "@radix-ui/themes";
import { Form } from "@remix-run/react";

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
