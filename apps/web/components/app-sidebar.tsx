"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BookmarkIcon, CommandIcon, LayoutDashboardIcon, NewspaperIcon, Settings2Icon, UsersRoundIcon } from "lucide-react"
import Link from "next/link"

const navItems = [
  { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
  { title: "Authors", url: "/authors", icon: <UsersRoundIcon /> },
  { title: "Posts", url: "/posts", icon: <NewspaperIcon /> },
  { title: "Swipe Files", url: "/swipe-files", icon: <BookmarkIcon /> },
  { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
]

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Social Planner</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
