import { isProd } from "@/utils/dev";
import { Button } from "@chakra-ui/react";

type Props = {
  variant: "solid" | "outline" | "ghost";
};
export default function ManagePaymentButton({ variant }: Props) {
  return (
    <Button
      variant={variant}
      colorScheme="gray"
      size="sm"
      onClick={() => {
        window.open(
          isProd()
            ? "https://billing.stripe.com/p/login/00gcPYcm11aQ9kA8ww"
            : "https://billing.stripe.com/p/login/test_3csfZGdjE0z81ws6oo",
          "_blank"
        );
      }}
    >
      Manage payment settings
    </Button>
  );
}
