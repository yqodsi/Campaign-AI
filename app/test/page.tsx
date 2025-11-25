"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Play, Calendar, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface TestResult {
  campaignId: string;
  campaignName: string;
  scheduleType: string;
  emailsPerDay: number;
  selectedDays: number[];
  timezone: string;
  startDate: string;
  durationDays: number;
  leadsCount: number;
  status: string;
  message?: string;
  scheduleDay?: number;
  daysSinceStart?: number;
  existingEmailsCount?: number;
  wouldScheduleCount?: number;
  wouldSchedule?: Array<{
    leadEmail: string;
    leadName: string;
    scheduleDay: number;
    displayDay: string;
    scheduledFor?: string;
    scheduledForLocal?: string;
    emailIndex?: number;
    totalEmailsToday?: number;
    status?: string;
  }>;
}

export default function TestPage() {
  const { toast } = useToast();
  const [simulateDays, setSimulateDays] = useState(0);
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickTestLoading, setQuickTestLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [quickTestResults, setQuickTestResults] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/test/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulateDays: parseInt(simulateDays.toString()) || 0,
          campaignId: campaignId || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults(data);
        toast({
          title: "Test Complete",
          description: `Processed ${data.campaignsProcessed} campaign(s)`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || data.error || "Test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    setQuickTestLoading(true);
    setQuickTestResults(null);
    try {
      const res = await fetch("/api/test/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId || undefined,
          minutesAhead: 15,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setQuickTestResults(data);
        toast({
          title: "Quick Test Complete!",
          description: `Scheduled ${data.results.reduce((sum: number, r: any) => sum + (r.scheduledCount || 0), 0)} test email(s) for the next 15 minutes. Check worker logs!`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || data.error || "Quick test failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run quick test",
        variant: "destructive",
      });
    } finally {
      setQuickTestLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "not_started":
        return <Badge variant="outline">Not Started</Badge>;
      case "not_scheduled_day":
        return <Badge variant="secondary">Not Scheduled Day</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDayNames = (selectedDays: number[]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return selectedDays.map((d) => days[d]).join(", ");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Scheduler Test Tool</h1>
        <p className="text-muted-foreground">
          Test the email scheduling logic without waiting. Simulate time progression and see what emails would be scheduled.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              Quick Test (15 Minutes)
            </CardTitle>
            <CardDescription>
              Schedule test emails for the next 15 minutes to verify everything works
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will actually create and queue emails that will be sent in the next 15 minutes. Perfect for immediate testing!
            </p>
            <div className="space-y-2">
              <Label htmlFor="quickCampaignId">Campaign ID (Optional)</Label>
              <Input
                id="quickCampaignId"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                placeholder="Leave empty to test all active campaigns"
              />
            </div>
            <Button 
              onClick={handleQuickTest} 
              disabled={quickTestLoading} 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {quickTestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling Test Emails...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Quick Test (15 min)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              ⚡ Emails will be scheduled 15 minutes from now (spaced 2 minutes apart)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simulation Test</CardTitle>
            <CardDescription>
              Preview what emails would be scheduled without creating them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="simulateDays">Simulate Days Forward</Label>
                <Input
                  id="simulateDays"
                  type="number"
                  value={simulateDays}
                  onChange={(e) => setSimulateDays(parseInt(e.target.value) || 0)}
                  min={0}
                  max={365}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  How many days to simulate forward from now (0 = current time)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign ID (Optional)</Label>
                <Input
                  id="campaignId"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="Leave empty to test all active campaigns"
                />
                <p className="text-xs text-muted-foreground">
                  Test a specific campaign, or leave empty to test all active campaigns
                </p>
              </div>
            </div>
            <Button onClick={handleTest} disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Run Simulation Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {quickTestResults && (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">Quick Test Results</CardTitle>
            <CardDescription>
              Test emails scheduled for the next 15 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickTestResults.results.map((result: any) => (
                <div key={result.campaignId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{result.campaignName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {result.scheduledCount || 0} email(s) scheduled
                      </p>
                    </div>
                    <Badge className="bg-green-600">
                      {result.scheduledCount || 0} Scheduled
                    </Badge>
                  </div>
                  {result.scheduledEmails && result.scheduledEmails.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {result.scheduledEmails.map((email: any, idx: number) => (
                        <div key={idx} className="p-2 bg-green-50 rounded text-sm">
                          <div className="font-medium">{email.leadName}</div>
                          <div className="text-xs text-muted-foreground">{email.leadEmail}</div>
                          {email.scheduledFor && (
                            <div className="text-xs mt-1">
                              <span className="font-medium">Scheduled for:</span> {format(new Date(email.scheduledFor), "PPpp")}
                              {email.scheduledForLocal && (
                                <span className="text-muted-foreground ml-2">
                                  ({email.scheduledForLocal.replace('T', ' ')} {result.timezone})
                                </span>
                              )}
                            </div>
                          )}
                          <Badge variant="outline" className="mt-1 text-xs">
                            {email.status === "queued" ? "✅ Queued for generation" : email.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-sm">
                      <div className="font-medium text-red-700">Errors:</div>
                      {result.errors.map((err: any, idx: number) => (
                        <div key={idx} className="text-xs text-red-600">
                          {err.leadEmail}: {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-900">
                ✅ <strong>Check your Docker logs</strong> to see emails being generated and sent:
              </p>
              <code className="text-xs bg-white px-2 py-1 rounded mt-2 block">
                docker-compose logs -f app
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Simulated time: {format(new Date(results.simulatedTime), "PPpp")}
                {results.simulatedDaysForward > 0 && (
                  <span className="ml-2">
                    ({results.simulatedDaysForward} day{results.simulatedDaysForward !== 1 ? "s" : ""} forward)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {results.results.map((result: TestResult) => (
                  <Card key={result.campaignId} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{result.campaignName}</CardTitle>
                          <CardDescription className="mt-1">
                            {result.scheduleType === "DAILY" ? "Daily" : "Weekly"} • {result.emailsPerDay} email{result.emailsPerDay !== 1 ? "s" : ""}/day
                            {result.scheduleType === "WEEKLY" && (
                              <span className="ml-2">• Days: {getDayNames(result.selectedDays)}</span>
                            )}
                          </CardDescription>
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.message && (
                        <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                          <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <p className="text-sm">{result.message}</p>
                        </div>
                      )}

                      {result.status === "active" && (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Schedule Day</span>
                              <span className="font-medium">Day {result.scheduleDay}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Days Since Start</span>
                              <span className="font-medium">{result.daysSinceStart}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Existing Emails</span>
                              <span className="font-medium">{result.existingEmailsCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs mb-1">Would Schedule</span>
                              <span className="font-medium text-green-600">{result.wouldScheduleCount || 0}</span>
                            </div>
                          </div>

                          {result.wouldSchedule && result.wouldSchedule.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold mb-3 text-sm">Emails That Would Be Scheduled:</h4>
                              <div className="space-y-2 max-h-96 overflow-y-auto">
                                {result.wouldSchedule.map((email, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-md border text-sm ${
                                      email.status === "already_scheduled"
                                        ? "bg-muted/50 border-muted"
                                        : "bg-green-50 border-green-200"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="font-medium">{email.leadName}</div>
                                        <div className="text-xs text-muted-foreground">{email.leadEmail}</div>
                                        <div className="mt-1 text-xs">
                                          <span className="font-medium">{email.displayDay}</span>
                                          {email.emailIndex && (
                                            <span className="text-muted-foreground">
                                              {" "}
                                              • Email {email.emailIndex}/{email.totalEmailsToday}
                                            </span>
                                          )}
                                        </div>
                                        {email.scheduledFor && (
                                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                            <div>
                                              <span className="font-medium">UTC:</span> {format(new Date(email.scheduledFor), "PPp")}
                                            </div>
                                            {email.scheduledForLocal && (
                                              <div>
                                                <span className="font-medium">Local ({result.timezone}):</span> {email.scheduledForLocal.replace('T', ' ')}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      {email.status === "already_scheduled" ? (
                                        <Badge variant="secondary" className="text-xs">
                                          Already Scheduled
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-green-500 text-xs">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          New
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {result.wouldScheduleCount === 0 && (
                            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                              All emails for this schedule day have already been scheduled.
                            </div>
                          )}
                        </>
                      )}

                      <div className="pt-2 border-t">
                        <Link href={`/campaigns/${result.campaignId}`}>
                          <Button variant="outline" size="sm">
                            View Campaign
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!results && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No test results yet</p>
            <p className="text-sm text-muted-foreground">
              Configure the test parameters above and click "Run Test" to see what emails would be scheduled
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

