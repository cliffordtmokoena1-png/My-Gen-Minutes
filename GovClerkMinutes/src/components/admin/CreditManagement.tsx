import { Divider, Heading } from "@chakra-ui/react";
import { Environment } from "@/utils/environment";
import CreditManagementForm from "@/components/admin/token/CreditManagementForm";

type Props = {};

export default function CreditManagement({}: Props) {
  return (
    <>
      <Heading size="md" mb={5} color="purple.600">
        Manage User Tokens
      </Heading>
      <Divider mb={5} />
      <CreditManagementForm />
    </>
  );
}
