import { Text } from "@radix-ui/themes";
import { ReactNode } from "react";

interface InlineErrorProps {
  children: ReactNode;
}

export default function InlineError({ children }: InlineErrorProps) {
  return (
    <div className="mt-1">
      <Text color="red" size="1">
        {children}
      </Text>
    </div>
  );
}
