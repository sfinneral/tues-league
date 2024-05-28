import { Button, Heading, TextField } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import InlineError from "~/components/InlineError";
import { updateUsersPassword, verifyLogin } from "~/models/user.server";
import { createUserSession } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(Boolean(params.hash), "Invalid URL");
  if (params.hash) {
    return json({ hash: params.hash });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const hashedEmail = formData.get("hashedEmail") as string;
  const password = formData.get("password");
  const passwordConfirm = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const isValidHash = await bcrypt.compare(email, hashedEmail);

  if (!validateEmail(email) || !isValidHash) {
    return json(
      { errors: { email: "Email is invalid", password: null } },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      { errors: { email: null, password: "Password is required" } },
      { status: 400 },
    );
  }

  if (
    typeof passwordConfirm !== "string" ||
    passwordConfirm.length === 0 ||
    passwordConfirm !== password
  ) {
    return json(
      {
        errors: {
          email: null,
          password: null,
          passwordConfirm: "Passwords need to match",
        },
      },
      { status: 400 },
    );
  }

  await updateUsersPassword(email, password);

  const user = await verifyLogin(email, password);

  if (!user) {
    return json(
      { errors: { email: "Invalid email or password", password: null } },
      { status: 400 },
    );
  }

  return createUserSession({
    redirectTo,
    remember: true,
    request,
    userId: user.id,
  });
};

export default function ResetPassword() {
  const { hash } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);
  return (
    <>
      <Heading size="6" my="6">
        Reset Password
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
        <TextField.Root
          className="mt-4"
          name="password"
          type="password"
          placeholder="Password"
          ref={passwordRef}
        />
        {actionData?.errors?.password ? (
          <InlineError>{actionData.errors.password}</InlineError>
        ) : null}

        <TextField.Root
          className="mt-4"
          name="passwordConfirm"
          type="password"
          placeholder="Confirm password"
          ref={passwordConfirmRef}
        />
        {actionData?.errors?.password ? (
          <InlineError>{actionData.errors.password}</InlineError>
        ) : null}
        <input type="hidden" name="hashedEmail" value={hash} />

        <Button type="submit" className="w-full" my="4">
          Update password
        </Button>
      </Form>
    </>
  );
}
