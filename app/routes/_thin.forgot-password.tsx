import { Button, Heading, TextField } from "@radix-ui/themes";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect, redirectDocument } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import InlineError from "~/components/InlineError";
import { getUserId } from "~/session.server";
import { validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!validateEmail(email)) {
    return json(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  return redirectDocument(`/reset-password-email/${email}`);
};

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    }
  }, [actionData]);

  return (
    <>
      <Heading size="6" my="6">
        Enter email address
      </Heading>
      <Form method="post">
        <TextField.Root
          className="mt-4"
          name="email"
          type="email"
          placeholder="Email address"
          ref={emailRef}
        />
        {actionData?.errors?.email ? (
          <InlineError>{actionData.errors.email}</InlineError>
        ) : null}

        <Button type="submit" my="4">
          Continue
        </Button>
      </Form>
    </>
  );
}
