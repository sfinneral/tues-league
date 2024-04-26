import { Profile } from "@prisma/client";
import { PersonIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";
import { Link } from "@remix-run/react";

interface TopBannerProps {
  firstName: Profile["firstName"];
}

export default function TopBanner({ firstName }: TopBannerProps) {
  return (
    <Flex justify="end" p="3">
      <Link to="/profile">
        <Button>
          <PersonIcon />
          {firstName}
        </Button>
      </Link>
    </Flex>
  );
}
