import { Button, Card, Flex, Heading, TextField } from "@radix-ui/themes";
import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { createCourse, getAllCourses } from "~/models/course.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  invariant(Boolean(name), "course name is required");
  invariant(Boolean(slug), "course slug is required");
  // to-do
  // add validation in if name or slug already exist

  return createCourse(name, slug);
}

export async function loader() {
  const courses = await getAllCourses();

  return json({
    courses,
  });
}

export default function AdminCourses() {
  const { courses } = useLoaderData<typeof loader>();
  const formRef = useRef<HTMLFormElement>(null);
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    formRef.current?.reset();
  }, [actionData]);
  return (
    <div>
      <Heading>Courses</Heading>

      <Form method="post" ref={formRef}>
        <div>
          {courses.map((course) => (
            <Flex my="3" key={course.id}>
              <div className="w-60">{course.name}</div>
              <Link to={`/admin/${course.slug}/leagues`}>
                <Button variant="surface">leagues</Button>
              </Link>
            </Flex>
          ))}
        </div>
        <Flex py="3">
          <Card>
            <Heading>Add new course</Heading>
            <Flex gap="3" py="3">
              <TextField.Root name="name" placeholder="course name" />
              <TextField.Root name="slug" placeholder="course slug" />
              <Button type="submit" variant="solid">
                save
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Form>
    </div>
  );
}
