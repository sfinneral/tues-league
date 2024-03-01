import { Container } from "@radix-ui/themes";
import { Outlet } from "@remix-run/react";

export default function AdminRoot() {
  return (
    <Container p="4">
      <Outlet />
    </Container>
  );
}
