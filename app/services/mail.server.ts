import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendPasswordResetEmail(request: Request, email: string) {
  const { protocol, host } = new URL(request.url);
  const hashedEmail = await bcrypt.hash(email, 10);
  const encodedHash = encodeURIComponent(hashedEmail);
  const link = `${protocol}//${host}/reset-password/${encodedHash}`;

  return resend.emails.send({
    from: "Tuesday Twi League <news@mail.afternoongolfer.com>",
    to: [email],
    subject: "Reset password for Tuesday Twi League",
    html: `<p>Click on this link to reset your password</p><p><a href='${link}'>${link}</a></p>`,
  });
}
