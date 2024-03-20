import { Button, Flex } from "@radix-ui/themes";
import { Form } from "@remix-run/react";

export default function TopBanner() {
  return (
    <nav>
      <Flex justify="end" p="3">
        <Form action="/logout" method="post">
          <Button type="submit">Logout</Button>
        </Form>
      </Flex>
    </nav>
  );
}
