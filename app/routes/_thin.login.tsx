import {
  Button,
  Checkbox,
  Flex,
  Heading,
  Link as StyledLink,
  Text,
  TextField,
} from "@radix-ui/themes";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";
import InlineError from "~/components/InlineError";
import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");
  const remember = formData.get("remember");

  if (!validateEmail(email)) {
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

  if (password.length < 8) {
    return json(
      { errors: { email: null, password: "Password is too short" } },
      { status: 400 },
    );
  }

  const user = await verifyLogin(email, password);

  if (!user) {
    return json(
      { errors: { email: "Invalid email or password", password: null } },
      { status: 400 },
    );
  }

  return createUserSession({
    redirectTo,
    remember: remember === "on" ? true : false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Login" }];

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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
        Golf League Login
      </Heading>
      <Form method="post">
        <TextField.Root className="mt-4">
          <TextField.Input
            name="email"
            type="email"
            placeholder="Email address"
            ref={emailRef}
          />
        </TextField.Root>
        {actionData?.errors?.email ? (
          <InlineError>{actionData.errors.email}</InlineError>
        ) : null}
        <TextField.Root className="mt-4">
          <TextField.Input
            name="password"
            type="password"
            placeholder="Password"
            ref={passwordRef}
          />
        </TextField.Root>
        {actionData?.errors?.password ? (
          <InlineError>{actionData.errors.password}</InlineError>
        ) : null}

        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Button type="submit" className="w-full" my="4">
          Login
        </Button>
        <Flex justify="between">
          <Text as="label" size="2">
            <Flex gap="2">
              <Checkbox defaultChecked name="remember" id="remember" /> Remember
              me
            </Flex>
          </Text>

          <Text size="2" color="gray">
            Don&apos;t have an account?{" "}
            <Link
              to={{
                pathname: "/join",
                search: searchParams.toString(),
              }}
            >
              <StyledLink>Sign up</StyledLink>
            </Link>
          </Text>
        </Flex>
      </Form>
    </>
  );
}
