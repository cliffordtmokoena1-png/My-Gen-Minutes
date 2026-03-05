import { ReactNode } from "react";
import ClerkDirectNavBar from "./ClerkDirectNavBar";
import ClerkDirectFooter from "./ClerkDirectFooter";
import ClerkDirectAnnouncementBar from "./ClerkDirectAnnouncementBar";

type Props = {
  children: ReactNode;
};

export default function ClerkDirectPageLayout({ children }: Props) {
  return (
    <div className="relative min-h-screen">
      <ClerkDirectAnnouncementBar />
      <ClerkDirectNavBar />
      <div className="flex flex-col">{children}</div>
      <ClerkDirectFooter />
    </div>
  );
}
