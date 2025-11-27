"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconMailBolt,
  IconUsers,
  IconMail,
  IconActivity,
  IconPlus,
  IconBolt,
  IconPlayerPlay,
  IconArrowRight,
  IconRobot,
  IconTrendingUp,
  IconClock,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  emailsSent: number;
  totalAgents: number;
  recentCampaigns: any[];
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [quickTesting, setQuickTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const handleTestProcessing = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/cron/process", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Processing Triggered!",
          description: "Emails are being generated in the background.",
        });
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to trigger processing",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger processing",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickTest = async (minutes: number) => {
    setQuickTesting(true);
    try {
      const res = await fetch("/api/test/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutesAhead: minutes }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: "Quick Test Started!",
          description: `Emails scheduled for next ${minutes} minutes. Check worker logs.`,
        });
        fetchStats();
      } else {
        toast({
          title: "Error",
          description:
            data.message || data.error || "Failed to start quick test",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start quick test",
        variant: "destructive",
      });
    } finally {
      setQuickTesting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your campaigns today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleTestProcessing}
            disabled={processing}
            className="gap-2"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconPlayerPlay className="h-4 w-4" />
            )}
            Process Queue
          </Button>
          <Button
            onClick={() => handleQuickTest(5)}
            disabled={quickTesting}
            variant="secondary"
            className="gap-2"
          >
            {quickTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconBolt className="h-4 w-4" />
            )}
            Quick Test
          </Button>
          <Link href="/campaigns/new">
            <Button className="gap-2">
              <IconPlus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
            <IconMailBolt className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.totalCampaigns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? "..." : `${stats?.activeCampaigns} active`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
            <IconUsers className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.totalLeads}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emails Sent
            </CardTitle>
            <IconMail className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.emailsSent}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Agents
            </CardTitle>
            <IconRobot className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.totalAgents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active AI personas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Campaigns */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconClock className="h-5 w-5" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>
              Your latest email marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stats?.recentCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <IconMailBolt className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    No campaigns created yet
                  </p>
                  <Link href="/campaigns/new">
                    <Button size="sm">
                      <IconPlus className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  </Link>
                </div>
              ) : (
                stats?.recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconMailBolt className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign._count.leads} leads •{" "}
                        {campaign._count.scheduledEmails} emails
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={
                          campaign.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {campaign.status}
                      </Badge>
                      <Link href={`/campaigns/${campaign.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <IconArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/campaigns/new" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all cursor-pointer group">
                <div className="h-11 w-11 rounded-lg bg-blue-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <IconPlus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Create Campaign</h4>
                  <p className="text-xs text-muted-foreground">
                    Start a new email sequence
                  </p>
                </div>
                <IconArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/leads" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-md transition-all cursor-pointer group">
                <div className="h-11 w-11 rounded-lg bg-green-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <IconUsers className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Manage Leads</h4>
                  <p className="text-xs text-muted-foreground">
                    View and import contacts
                  </p>
                </div>
                <IconArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/agents" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-md transition-all cursor-pointer group">
                <div className="h-11 w-11 rounded-lg bg-purple-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <IconRobot className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">AI Agents</h4>
                  <p className="text-xs text-muted-foreground">
                    Configure AI personas
                  </p>
                </div>
                <IconArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
