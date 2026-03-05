import { Box, Flex, IconButton, Tooltip } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import PlusIcon from "./PlusIcon";
import Icon from "./Icon";
import { UserButton, useSession } from "@clerk/nextjs";
import { FiSettings, FiMic, FiCalendar, FiMenu, FiX, FiFileText } from "react-icons/fi";
import { BOTTOM_BAR_HEIGHT_PX } from "./BottomBar";
import { useAnnouncementBarHeight } from "./AnnouncementBar";

type MinibarProps = {
  toggleSidebar: () => void;
  isCollapsed: boolean;
  layoutKind: string;
};

const Minibar = ({ toggleSidebar, isCollapsed, layoutKind }: MinibarProps) => {
  const router = useRouter();
  const { session, isLoaded } = useSession();
  const announcementBarHeight = useAnnouncementBarHeight();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAdmin = isLoaded && session?.user?.publicMetadata?.role === "admin";
  const isPastMeetings = layoutKind === "past-meetings";
  const minibarHeight = isPastMeetings
    ? `calc(100vh - ${BOTTOM_BAR_HEIGHT_PX}px - ${announcementBarHeight}px)`
    : `calc(100vh - ${announcementBarHeight}px)`;
  // To prevent SSR/client hydration mismatches, avoid using client-only localStorage-driven
  // isCollapsed during the initial paint. Assume false on SSR and first client render.
  const stableIsCollapsed = mounted ? isCollapsed : false;

  return (
    <Flex
      position="fixed"
      left={0}
      top={`${announcementBarHeight}px`}
      h={minibarHeight}
      w="60px"
      bg="white"
      borderRight="1px solid"
      borderRightColor="gray.200"
      color="white"
      flexDirection="column"
      alignItems="center"
      justifyContent="space-between"
      py={4}
      px={2}
      zIndex={1}
      display={isPastMeetings ? "none" : "flex"}
    >
      <Flex direction="column" gap={2} alignItems="center" w={25}>
        <Link href="/dashboard">
          <Box mb={4}>
            <Icon />
          </Box>
        </Link>

        <Tooltip label="Minutes" placement="right">
          <IconButton
            aria-label="Minutes"
            icon={stableIsCollapsed ? <FiMenu /> : <FiX />}
            onClick={toggleSidebar}
            variant="ghost"
            size="md"
            color={stableIsCollapsed ? "gray.500" : "blue.400"}
            bg={stableIsCollapsed ? "transparent" : "blue.100"}
            _hover={{ color: "blue.400", bg: "blue.50" }}
            suppressHydrationWarning
          />
        </Tooltip>

        <Tooltip label="Recordings" placement="right">
          <IconButton
            aria-label="Recordings"
            icon={<FiMic />}
            onClick={() => router.push("/recordings")}
            variant="ghost"
            size="md"
            color={router.pathname === "/recordings" ? "green.400" : "gray.500"}
            bg={router.pathname === "/recordings" ? "green.100" : "transparent"}
            _hover={{ color: "green.400", bg: "green.50" }}
          />
        </Tooltip>

        <Tooltip label="Templates" placement="right">
          <IconButton
            aria-label="Templates"
            icon={<FiFileText />}
            onClick={() => router.push("/templates")}
            variant="ghost"
            size="md"
            color={router.pathname === "/templates" ? "orange.400" : "gray.500"}
            bg={router.pathname === "/templates" ? "orange.100" : "transparent"}
            _hover={{ color: "orange.400", bg: "orange.50" }}
          />
        </Tooltip>

        <Tooltip label="Agendas" placement="right">
          <IconButton
            aria-label="Agendas"
            icon={<FiCalendar />}
            onClick={() => router.push("/agendas")}
            variant="ghost"
            size="md"
            color={router.pathname === "/agendas" ? "purple.400" : "gray.500"}
            bg={router.pathname === "/agendas" ? "purple.100" : "transparent"}
            _hover={{ color: "purple.400", bg: "purple.50" }}
          />
        </Tooltip>

        {isAdmin && (
          <Tooltip label="Admin Panel" placement="right">
            <IconButton
              aria-label="Admin Panel"
              icon={<FiSettings />}
              onClick={() => router.push("/admin")}
              variant="ghost"
              size="md"
              color={router.pathname.startsWith("/admin") ? "purple.400" : "gray.500"}
              bg={router.pathname.startsWith("/admin") ? "purple.100" : "transparent"}
              _hover={{ color: "purple.400", bg: "purple.50" }}
            />
          </Tooltip>
        )}

        {mounted && isCollapsed && router.pathname !== "/dashboard" && (
          <Tooltip label="New Upload" placement="right">
            <IconButton
              aria-label="New Upload"
              icon={<PlusIcon />}
              onClick={() => router.push("/dashboard")}
              variant="ghost"
              size="md"
              color="blue.400"
              bg="blue.100"
              _hover={{ color: "blue.500", bg: "blue.200" }}
            />
          </Tooltip>
        )}
      </Flex>
      <Box>
        <UserButton userProfileUrl="/profile" userProfileMode="navigation" />
      </Box>
    </Flex>
  );
};

export default Minibar;
