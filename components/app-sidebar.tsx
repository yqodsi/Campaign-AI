"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconLayoutDashboard,
  IconMailBolt,
  IconUsers,
  IconRobot,
  IconSparkles,
} from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconLayoutDashboard,
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: IconMailBolt,
    },
    {
      title: "Leads",
      url: "/leads",
      icon: IconUsers,
    },
    {
      title: "AI Agents",
      url: "/agents",
      icon: IconRobot,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border h-16 p-4 flex items-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
        <Link
          href="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shrink-0">
            <IconSparkles className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-base">Campaign AI</span>
            <span className="text-xs text-muted-foreground">
              Email Automation
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4 group-data-[collapsible=icon]:px-0">
        <NavMain items={data.navMain} />
      </SidebarContent>
      {/* <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
      
      </SidebarFooter> */}
    </Sidebar>
  );
}
