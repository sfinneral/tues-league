import { Box, Flex } from "@radix-ui/themes";
import { Outlet } from "@remix-run/react";

export default function ThinLayout() {
  return (
    <Flex justify="center">
      <Box p="4" className="max-w-lg w-full">
        <Outlet />
      </Box>
    </Flex>
  );
}
