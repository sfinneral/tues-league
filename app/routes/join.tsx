import { TextField } from "@radix-ui/themes";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef } from "react";

import { createUser, getUserByEmail } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
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

  if (password.length < 8) {
    return json(
      {
        errors: {
          email: null,
          password: "Password is too short",
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
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <Form method="post" className="space-y-6">
          <TextField.Root>
            <TextField.Input name="firstName" placeholder="First Name" ref={firstNameRef} />
          </TextField.Root>
          <TextField.Root>
            <TextField.Input name="lastName" placeholder="Last Name" ref={lastNameRef} />
          </TextField.Root>
          <TextField.Root>
            <TextField.Input name="email" type="email" placeholder="Email address" ref={emailRef} />
          </TextField.Root>
          <TextField.Root>
            <TextField.Input name="password" type="password" placeholder="Password" ref={passwordRef} />
          </TextField.Root>
          <TextField.Root>
            <TextField.Input name="phoneNumber" type="tel" placeholder="Phone number" ref={phoneNumberRef} />
          </TextField.Root>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Create Account
          </button>
          <div className="flex items-center justify-center">
            <div className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                className="text-blue-500 underline"
                to={{
                  pathname: "/login",
                  search: searchParams.toString(),
                }}
              >
                Log in
              </Link>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
