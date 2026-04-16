import { AlertDialog, Button, Flex } from "@radix-ui/themes";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: "red" | "blue" | "green" | "orange";
  trigger: React.ReactNode;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  color = "red",
  trigger,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description>{description}</AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              {cancelLabel}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" color={color} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
