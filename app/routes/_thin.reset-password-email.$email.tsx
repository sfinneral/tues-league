import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Callout } from "@radix-ui/themes";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  if (params.email) {
    const { protocol, host } = new URL(request.url);
    const hashedEmail = await bcrypt.hash(params.email, 10);
    const link = `${protocol}//${host}/reset-password/${hashedEmail}`;
    const { error } = await resend.emails.send({
      from: "Afternoon Golfer <news@mail.afternoongolfer.com>",
      to: [params.email],
      subject: "Reset password for Tuesday Twi League",
      html: `<p>Click on this link to reset your password</p><p><a href='${link}'>${link}</a></p>`,
    });

    if (error) {
      return json({ error, success: false }, 400);
    }

    return json({ success: true });
  } else {
    return json({ success: false });
  }
};

export default function ResetPasswordEmail() {
  const { success } = useLoaderData<typeof loader>();
  return (
    <>
      {success ? (
        <section>
          <Callout.Root color="green">
            <Callout.Icon>
              <CheckCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              An email has been sent to reset your password
            </Callout.Text>
          </Callout.Root>
        </section>
      ) : (
        <p>
          Invalid Email <Link to="/forgot-password">please try again</Link>
        </p>
      )}
    </>
  );
}
