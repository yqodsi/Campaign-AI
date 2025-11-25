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
import { Plus, Play, Pause, RotateCcw, X, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const url =
        statusFilter !== "all"
          ? `/api/campaigns?status=${statusFilter}`
          : "/api/campaigns";
      const res = await fetch(url);
      const data = await res.json();
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your email campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            <p className="text-muted-foreground mb-4 text-lg">
              No campaigns found
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {statusFilter !== "all"
                ? `No campaigns with status "${statusFilter}"`
                : "Get started by creating your first campaign"}
            </p>
            <Link href="/campaigns/new">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {campaign.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {campaign.scheduleType === "DAILY" ? "Daily" : "Weekly"} •{" "}
                      {campaign.emailsPerDay}{" "}
                      {campaign.emailsPerDay === 1 ? "email" : "emails"}/day
                    </CardDescription>
                  </div>
                  <Badge
                    variant={getStatusColor(campaign.status)}
                    className="shrink-0"
                  >
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">
                      AI Agent
                    </span>
                    <span className="font-medium truncate block">
                      {campaign.aiAgent.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">
                      Duration
                    </span>
                    <span className="font-medium">
                      {campaign.durationDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">
                      Leads
                    </span>
                    <span className="font-medium">{campaign._count.leads}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs mb-1">
                      Emails
                    </span>
                    <span className="font-medium">
                      {campaign._count.scheduledEmails}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  {campaign.status === "DRAFT" && (
                    <Button
                      size="icon"
                      onClick={() => handleAction(campaign.id, "start")}
                      title="Start Campaign"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  {campaign.status === "ACTIVE" && (
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleAction(campaign.id, "pause")}
                      title="Pause Campaign"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {campaign.status === "PAUSED" && (
                    <Button
                      size="icon"
                      onClick={() => handleAction(campaign.id, "resume")}
                      title="Resume Campaign"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {(campaign.status === "ACTIVE" ||
                    campaign.status === "PAUSED") && (
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleAction(campaign.id, "cancel")}
                      title="Cancel Campaign"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
