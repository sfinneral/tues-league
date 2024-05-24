import { json } from "@remix-run/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const loader = async () => {
  const { data, error } = await resend.emails.send({
    from: "Afternoon Golfer <news@mail.afternoongolfer.com>",
    to: ["sfinneral@gmail.com"],
    subject: "New email from afternoon golfer",
    html: "<strong>It works!</strong>",
  });

  if (error) {
    return json({ error }, 400);
  }

  return json(data, 200);
};
