"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconPlus,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconX,
  IconFilter,
  IconMailBolt,
  IconUsers,
  IconClock,
  IconRobot,
  IconArrowRight,
  IconCalendar,
  IconCalendarX,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface Campaign {
  id: string;
  name: string;
  status: string;
  scheduleType: string;
  emailsPerDay: number;
  durationDays: number;
  startDate: string;
  timezone: string;
  aiAgent: { id: string; name: string };
  _count: { leads: number; scheduledEmails: number };
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, dateRange, allCampaigns]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setAllCampaigns(data.data || []);
      setCampaigns(data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allCampaigns];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Filter by selected date range
    if (dateRange?.from) {
      filtered = filtered.filter((c) => {
        const startDate = new Date(c.startDate);
        const from = new Date(dateRange.from!);
        from.setHours(0, 0, 0, 0);

        if (dateRange.to) {
          const to = new Date(dateRange.to);
          to.setHours(23, 59, 59, 999);
          return startDate >= from && startDate <= to;
        } else {
          // Only a start date was picked; include everything after it
          return startDate >= from;
        }
      });
    }

    setCampaigns(filtered);
  };

  const handleAction = async (campaignId: string, action: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: "POST",
      });
      if (res.ok) {
        toast({
          title: "Success",
          description: `Campaign ${action}d successfully`,
        });
        fetchCampaigns();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PAUSED":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "🟢";
      case "PAUSED":
        return "⏸️";
      case "DRAFT":
        return "📝";
      case "COMPLETED":
        return "✅";
      case "CANCELLED":
        return "❌";
      default:
        return "⚪";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage your automated email sequences
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="lg" className="gap-2">
            <IconPlus className="h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <IconFilter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Status picker */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">📝 Draft</SelectItem>
                  <SelectItem value="ACTIVE">🟢 Active</SelectItem>
                  <SelectItem value="PAUSED">⏸️ Paused</SelectItem>
                  <SelectItem value="COMPLETED">✅ Completed</SelectItem>
                  <SelectItem value="CANCELLED">❌ Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range picker */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Date:</span>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-auto"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {(statusFilter !== "all" || dateRange?.from) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setDateRange(undefined);
                  }}
                  className="h-8 gap-1"
                >
                  <IconCalendarX className="h-3 w-3" />
                  Clear Filters
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {campaigns.length}{" "}
                {campaigns.length === 1 ? "campaign" : "campaigns"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <IconMailBolt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {statusFilter !== "all" || dateRange?.from
                ? "No campaigns match your filters. Try adjusting your filter criteria."
                : "Get started by creating your first automated email campaign"}
            </p>
            <Link href="/campaigns/new">
              <Button size="lg" className="gap-2">
                <IconPlus className="h-4 w-4" />
                Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-lg transition-all hover:border-primary/50 group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate flex items-center gap-2">
                      <span className="text-xl">
                        {getStatusIcon(campaign.status)}
                      </span>
                      {campaign.name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant={getStatusColor(campaign.status)}
                    className="shrink-0"
                  >
                    {campaign.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5" />
                  {campaign.scheduleType === "DAILY"
                    ? "Daily"
                    : "Weekly"} • {campaign.emailsPerDay}{" "}
                  {campaign.emailsPerDay === 1 ? "email" : "emails"}/day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                      <IconUsers className="h-4 w-4" />
                      <span className="text-xs font-medium">Leads</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {campaign._count.leads}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                      <IconMailBolt className="h-4 w-4" />
                      <span className="text-xs font-medium">Emails</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {campaign._count.scheduledEmails}
                    </p>
                  </div>
                </div>

                {/* Campaign details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconRobot className="h-4 w-4" />
                    <span className="truncate">{campaign.aiAgent.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconCalendar className="h-4 w-4" />
                    <span>{campaign.durationDays} days duration</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full gap-2 group-hover:border-primary"
                    >
                      View Details
                      <IconArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <div className="flex gap-1">
                    {campaign.status === "DRAFT" && (
                      <Button
                        size="icon"
                        onClick={() => handleAction(campaign.id, "start")}
                        title="Start Campaign"
                        className="h-9 w-9"
                      >
                        <IconPlayerPlay className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === "ACTIVE" && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleAction(campaign.id, "pause")}
                        title="Pause Campaign"
                        className="h-9 w-9"
                      >
                        <IconPlayerPause className="h-4 w-4" />
                      </Button>
                    )}
                    {campaign.status === "PAUSED" && (
                      <Button
                        size="icon"
                        onClick={() => handleAction(campaign.id, "resume")}
                        title="Resume Campaign"
                        className="h-9 w-9"
                      >
                        <IconRefresh className="h-4 w-4" />
                      </Button>
                    )}
                    {(campaign.status === "ACTIVE" ||
                      campaign.status === "PAUSED") && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleAction(campaign.id, "cancel")}
                        title="Cancel Campaign"
                        className="h-9 w-9"
                      >
                        <IconX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
