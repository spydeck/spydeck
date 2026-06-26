"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { SidebarCreditsBlock } from "@/components/sidebar-credits-block";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BookmarkIcon,
  Building2Icon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  NewspaperIcon,
  Settings2Icon,
  UsersRoundIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navGroups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> }],
  },
  {
    label: "Content",
    items: [
      { title: "Authors", url: "/authors", icon: <UsersRoundIcon /> },
      { title: "Posts", url: "/posts", icon: <NewspaperIcon /> },
      { title: "Swipe Files", url: "/swipe-files", icon: <BookmarkIcon /> },
    ],
  },
  {
    label: "Ads Library",
    items: [
      { title: "Search Ads", url: "/search-ads", icon: <MegaphoneIcon /> },
      { title: "Advertisers", url: "/advertisers", icon: <Building2Icon /> },
      { title: "Swipe Ads", url: "/swipe-ads", icon: <BookmarkIcon /> },
    ],
  },
];

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <img
                  src="/logo.png?v=1"
                  alt="Social Planner"
                  width={24}
                  height={24}
                  className="size-6 rounded"
                />
                <span className="text-base font-semibold">Spydeck</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              isActive={pathname === "/settings"}
            >
              <Link href="/settings">
                <Settings2Icon />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarCreditsBlock />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
