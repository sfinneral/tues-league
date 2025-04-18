import { Button, Card, Checkbox, Flex, Heading, TextArea } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { getDivisionTeamsUsersProfileByLeagueSlug } from "~/models/division.server";
import { getSubsByLeagueSlug } from "~/models/sub.server";
import { sendBulkSMS } from "~/services/twilio.server";
import { cleanedPhoneNumber } from "~/utils";

export async function loader({ params }: LoaderFunctionArgs) {
    const leagueSlug = params.league as string;
    const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
    const leagueSubs = await getSubsByLeagueSlug(leagueSlug);

    return json({
        divisions,
        subs: leagueSubs?.subs,
    });
}

export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const message = formData.get("message") as string;
    const includeSubs = formData.get("includeSubs") === "on";
    const leagueSlug = params.league as string;

    if (!message) {
        return json({ error: "Message is required" }, { status: 400 });
    }

    const divisions = await getDivisionTeamsUsersProfileByLeagueSlug(leagueSlug);
    const leagueSubs = await getSubsByLeagueSlug(leagueSlug);

    const phoneNumbers = new Set<string>();

    // Add all team members' phone numbers
    divisions.forEach((division) => {
        division.teams.forEach((team) => {
            team.users.forEach((user) => {
                if (user.profile?.phoneNumber) {
                    phoneNumbers.add(cleanedPhoneNumber(user.profile.phoneNumber));
                }
            });
        });
    });

    // Add subs' phone numbers if includeSubs is true
    if (includeSubs) {
        leagueSubs?.subs.forEach((sub) => {
            if (sub.user.profile?.phoneNumber) {
                phoneNumbers.add(cleanedPhoneNumber(sub.user.profile.phoneNumber));
            }
        });
    }

    const phoneNumbersArray = Array.from(phoneNumbers);
    const result = await sendBulkSMS(phoneNumbersArray, message);

    return json({
        success: true,
        message,
        includeSubs,
        phoneNumbers: phoneNumbersArray,
        sendResult: result
    });
}

export default function LeagueMessages() {
    const { divisions, subs } = useLoaderData<typeof loader>();

    return (
        <div>
            <Heading mb="4">Send Message to League Members</Heading>
            <Card mb="8">
                <Form method="post">
                    <Flex direction="column" gap="4">
                        <TextArea
                            name="message"
                            placeholder="Enter your message here..."
                            size="3"
                            style={{ minHeight: "150px" }}
                        />
                        <Flex gap="2" align="center">
                            <Checkbox id="includeSubs" name="includeSubs" defaultChecked />
                            <label htmlFor="includeSubs">Include subs in message</label>
                        </Flex>
                        <Button type="submit">Send Message</Button>
                    </Flex>
                </Form>
            </Card>

            <Card>
                <Heading size="3" mb="4">Recipients</Heading>
                <Flex direction="column" gap="4">
                    {divisions.map((division) => (
                        <div key={division.id}>
                            <Heading size="4">{division.name}</Heading>
                            {division.teams.map((team) => (
                                <div key={team.id}>
                                    {team.users.map((user) => (
                                        <div key={user.id}>
                                            {user.profile?.firstName} {user.profile?.lastName} - {user.profile?.phoneNumber}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                    {subs && subs.length > 0 && (
                        <div>
                            <Heading size="4">Subs</Heading>
                            {subs.map((sub) => (
                                <div key={sub.id}>
                                    {sub.user.profile?.firstName} {sub.user.profile?.lastName} - {sub.user.profile?.phoneNumber}
                                </div>
                            ))}
                        </div>
                    )}
                </Flex>
            </Card>
        </div>
    );
} 