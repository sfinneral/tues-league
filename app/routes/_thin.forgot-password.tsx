import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Button, Callout, Heading, TextField } from "@radix-ui/themes";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import InlineError from "~/components/InlineError";
import TurnstileWidget from "~/components/TurnstileWidget";
import { getUserByEmail } from "~/models/user.server";
import { sendPasswordResetEmail } from "~/services/mail.server";
import { getClientIp, isRateLimited } from "~/services/rate-limit.server";
import { verifyTurnstileToken } from "~/services/turnstile.server";
import { getUserId } from "~/session.server";
import { validateEmail } from "~/utils";

const EMAIL_RATE_LIMIT = { max: 3, windowMs: 15 * 60 * 1000 };
const IP_RATE_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({ turnstileSiteKey: process.env.TURNSTILE_SITE_KEY ?? "" });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const ip = getClientIp(request);

  const turnstileToken = formData.get("cf-turnstile-response");
  if (!(await verifyTurnstileToken(turnstileToken, ip))) {
    return json(
      {
        errors: {
          email: null,
          password: null,
          turnstile: "Verification failed. Please try again.",
        },
        success: false,
      },
      { status: 400 },
    );
  }

  if (!validateEmail(email)) {
    return json(
      {
        errors: { email: "Email is invalid", password: null, turnstile: null },
        success: false,
      },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase();

  if (
    isRateLimited(
      `forgot-password:email:${normalizedEmail}`,
      EMAIL_RATE_LIMIT,
    ) ||
    isRateLimited(`forgot-password:ip:${ip}`, IP_RATE_LIMIT)
  ) {
    return json(
      {
        errors: {
          email: "Too many requests. Please try again later.",
          password: null,
          turnstile: null,
        },
        success: false,
      },
      { status: 429 },
    );
  }

  const user = await getUserByEmail(normalizedEmail);
  if (user) {
    await sendPasswordResetEmail(request, normalizedEmail);
  }

  return json({ success: true, errors: null });
};

export default function ForgotPassword() {
  const { turnstileSiteKey } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    }
  }, [actionData]);

  if (actionData?.success) {
    return (
      <Callout.Root color="green" my="6">
        <Callout.Icon>
          <CheckCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          If that email is registered, a password reset link has been sent.
        </Callout.Text>
      </Callout.Root>
    );
  }

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

        <TurnstileWidget siteKey={turnstileSiteKey} />
        {actionData?.errors?.turnstile ? (
          <InlineError>{actionData.errors.turnstile}</InlineError>
        ) : null}

        <Button type="submit" my="4">
          Continue
        </Button>
      </Form>
    </>
  );
}
