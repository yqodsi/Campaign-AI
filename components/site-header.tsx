"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconBrandGithub, IconBell } from "@tabler/icons-react";

const pageTitles: Record<string, { title: string; description?: string }> = {
  "/": {
    title: "Dashboard",
    description: "Overview of your campaigns and performance",
  },
  "/campaigns": {
    title: "Campaigns",
    description: "Manage your email campaigns",
  },
  "/campaigns/new": {
    title: "Create Campaign",
    description: "Set up a new email campaign",
  },
  "/leads": { title: "Leads", description: "Manage your contact database" },
  "/agents": {
    title: "AI Agents",
    description: "Configure your AI email writers",
  },
};

export function SiteHeader() {
  const pathname = usePathname();

  // Get page title based on current path
  const getPageInfo = () => {
    // Check for exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

    // Check for campaign detail pages
    if (pathname.startsWith("/campaigns/") && pathname !== "/campaigns/new") {
      return {
        title: "Campaign Details",
        description: "View and manage campaign",
      };
    }

    return { title: "Campaign AI", description: "Email automation platform" };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center gap-3 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold tracking-tight">
            {pageInfo.title}
          </h1>
          {pageInfo.description && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {pageInfo.description}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <IconBell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming Soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hidden sm:flex"
            asChild
          >
            <a
              href="https://github.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconBrandGithub className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
