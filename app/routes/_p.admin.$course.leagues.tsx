import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { getCourseBySlug } from "~/models/course.server";
import { createLeague, getLeaguesByCourse } from "~/models/league.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const { course: courseSlug } = params;
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const startDate = formData.get("startDate") as string;
  const course = await getCourseBySlug(courseSlug as string);
  invariant(Boolean(name), "course name is required");
  invariant(Boolean(course), "course slug is required");
  invariant(Boolean(startDate), "startDate is required");
  // to-do
  // add validation in if name or slug already exist

  return createLeague(name, slug, startDate, course!.id);
}

export async function loader({ params }: LoaderFunctionArgs) {
  const course = await getCourseBySlug(params.course as string);
  invariant(course, "course is invalid");
  const leagues = await getLeaguesByCourse(course!.id);

  return json({
    leagues,
  });
}

export default function AdminLeagues() {
  const { leagues } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);

  return (
    <div>
      <Heading>Leagues</Heading>

      <Form method="post" ref={formRef}>
        <section>
          {leagues.map((league) => (
            <Flex gap="3" direction="column" key={league.id} mb="4">
              <Text>{league.name}</Text>
              <Flex gap="2">
                <Link to={`/admin/${league.slug}/divisions`}>
                  <Button variant="surface">divisions</Button>
                </Link>
                <Link to={`/admin/${league.slug}/teams`}>
                  <Button variant="surface">teams</Button>
                </Link>
                <Link to={`/admin/${league.slug}/schedules`}>
                  <Button variant="surface">schedules</Button>
                </Link>
              </Flex>
            </Flex>
          ))}
        </section>

        <Card mt="10">
          <Heading size="2">Add new league</Heading>
          <Flex gap="3" py="3" direction="column">
            <TextField.Root name="name" placeholder="league name" />
            <TextField.Root name="slug" placeholder="league slug" />
            <TextField.Root
              name="startDate"
              placeholder="start date"
              type="date"
            />
            <Button type="submit" variant="solid">
              save
            </Button>
          </Flex>
        </Card>
      </Form>
    </div>
  );
}
