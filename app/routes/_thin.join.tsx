import {
  Button,
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

import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) {
    return redirect("/");
  }
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const email = formData.get("email");
  const password = formData.get("password");
  const phoneNumber = formData.get("phoneNumber");
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  if (typeof firstName !== "string" || firstName.length === 0) {
    return json(
      {
        errors: {
          email: null,
          password: null,
          firstName: "First name is required",
          lastName: null,
          phoneNumber: null,
        },
      },
      { status: 400 },
    );
  }

  if (typeof lastName !== "string" || lastName.length === 0) {
    return json(
      {
        errors: {
          email: null,
          password: null,
          lastName: "Last name is required",
          firstName: null,
          phoneNumber: null,
        },
      },
      { status: 400 },
    );
  }

  if (!validateEmail(email)) {
    return json(
      {
        errors: {
          email: "Email is invalid",
          password: null,
          firstName: null,
          lastName: null,
          phoneNumber: null,
        },
      },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length === 0) {
    return json(
      {
        errors: {
          email: null,
          password: "Password is required",
          firstName: null,
          lastName: null,
          phoneNumber: null,
        },
      },
      { status: 400 },
    );
  }

  if (password.length < 5) {
    return json(
      {
        errors: {
          email: null,
          password: "Password is too short. Needs to be at least 5 characters",
          firstName: null,
          lastName: null,
          phoneNumber: null,
        },
      },
      { status: 400 },
    );
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return json(
      {
        errors: {
          email: "A user already exists with this email",
          password: null,
          firstName: null,
          lastName: null,
          phoneNumber: null,
        },
      },
      { status: 400 },
    );
  }

  if (typeof phoneNumber !== "string" || phoneNumber.length === 0) {
    return json(
      {
        errors: {
          email: null,
          password: null,
          lastName: null,
          firstName: null,
          phoneNumber: "Phone number is required",
        },
      },
      { status: 400 },
    );
  }

  const user = await createUser(
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
  );

  return createUserSession({
    redirectTo,
    remember: false,
    request,
    userId: user.id,
  });
};

export const meta: MetaFunction = () => [{ title: "Sign Up" }];

export default function Join() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    } else if (actionData?.errors?.firstName) {
      firstNameRef.current?.focus();
    } else if (actionData?.errors?.lastName) {
      lastNameRef.current?.focus();
    } else if (actionData?.errors?.phoneNumber) {
      phoneNumberRef.current?.focus();
    }
  }, [actionData]);

  return (
    <>
      <Heading size="6" my="6">
        Golf League Sign Up
      </Heading>
      <Form method="post">
        <TextField.Root
          className="mt-4"
          name="firstName"
          placeholder="First Name"
          ref={firstNameRef}
        />
        {actionData?.errors?.firstName ? (
          <InlineError>{actionData.errors.firstName}</InlineError>
        ) : null}
        <TextField.Root
          className="mt-4"
          name="lastName"
          placeholder="Last Name"
          ref={lastNameRef}
        />
        {actionData?.errors?.lastName ? (
          <InlineError>{actionData.errors.lastName}</InlineError>
        ) : null}
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
          name="phoneNumber"
          type="tel"
          placeholder="Phone number"
          ref={phoneNumberRef}
        />
        {actionData?.errors?.phoneNumber ? (
          <InlineError>{actionData.errors.phoneNumber}</InlineError>
        ) : null}
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Flex justify="between" align="center">
          <Button type="submit" className="block w-full" my="4">
            Create Account
          </Button>

          <Text size="2" as="p" color="gray" align="center">
            Already have an account?{" "}
            <Link
              to={{
                pathname: "/login",
                search: searchParams.toString(),
              }}
            >
              <StyledLink>Log in</StyledLink>
            </Link>
          </Text>
        </Flex>
      </Form>
    </>
  );
}
