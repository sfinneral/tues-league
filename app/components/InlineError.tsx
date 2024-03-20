import { Text } from "@radix-ui/themes";
import { ReactElement } from "react";

interface InlineErrorProps {
  children: ReactElement | string;
};

export default function InlineError({ children }: InlineErrorProps) {
  return (
    <div className="mt-1">
      <Text color="red" size="1">
        {children}
      </Text>
    </div>
  );
}
