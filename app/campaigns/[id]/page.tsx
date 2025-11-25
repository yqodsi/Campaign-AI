'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Users, Mail, Play, Pause, RotateCcw, X, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

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
  leads: Array<{ id: string; email: string; firstName: string; lastName?: string }>;
  scheduledEmails: Array<{
    id: string;
    scheduledFor: string;
    scheduleDay: number;
    status: string;
    generatedSubject?: string;
    generatedBody?: string;
    sentAt?: string;
    lead: { email: string; firstName: string };
  }>;
  _count: { leads: number; scheduledEmails: number };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCampaign();
    }
  }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      } else {
        toast({
          title: 'Error',
          description: 'Campaign not found',
          variant: 'destructive',
        });
        router.push('/campaigns');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!campaign) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        toast({
          title: 'Success',
          description: `Campaign ${action}d successfully`,
        });
        fetchCampaign();
      } else {
        const data = await res.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update campaign',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'PAUSED':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'default';
      case 'APPROVED':
        return 'default';
      case 'READY':
        return 'secondary';
      case 'GENERATING':
        return 'outline';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatScheduleDay = (scheduleDay: number) => {
    // scheduleDay format: baseDay * 10000 + emailIndex
    const baseDay = Math.floor(scheduleDay / 10000);
    const emailIndex = scheduleDay % 10000;
    if (emailIndex === 0) {
      return `Day ${baseDay}`;
    }
    return `Day ${baseDay} - Email ${emailIndex + 1}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href="/campaigns" className="inline-flex items-center text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{campaign.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={getStatusColor(campaign.status)} className="text-xs">{campaign.status}</Badge>
            <span className="text-sm text-muted-foreground">
              {campaign.scheduleType === 'DAILY' ? 'Daily' : 'Weekly'} • {campaign.emailsPerDay} {campaign.emailsPerDay === 1 ? 'email' : 'emails'}/day
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {campaign.status === 'DRAFT' && (
            <Button onClick={() => handleAction('start')} size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
          )}
          {campaign.status === 'ACTIVE' && (
            <>
              <Button variant="secondary" onClick={() => handleAction('pause')} size="lg">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" onClick={() => handleAction('cancel')} size="lg">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          {campaign.status === 'PAUSED' && (
            <>
              <Button onClick={() => handleAction('resume')} size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button variant="destructive" onClick={() => handleAction('cancel')} size="lg">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads ({campaign.leads.length})</TabsTrigger>
          <TabsTrigger value="emails">Emails ({campaign.scheduledEmails.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Agent:</span>
                  <span>{campaign.aiAgent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{campaign.durationDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{format(new Date(campaign.startDate), 'PPp')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timezone:</span>
                  <span>{campaign.timezone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Leads:</span>
                  <span>{campaign._count.leads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled Emails:</span>
                  <span>{campaign._count.scheduledEmails}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Leads</CardTitle>
                  <CardDescription>Manage leads for this campaign</CardDescription>
                </div>
                <Link href={`/campaigns/${campaign.id}/leads`}>
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Leads
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaign.leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        No leads yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaign.leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>
                          {lead.firstName} {lead.lastName}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Emails</CardTitle>
              <CardDescription>View and approve scheduled emails for this campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.scheduledEmails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No emails scheduled yet</p>
                  <p className="text-sm text-muted-foreground">
                    Emails will be scheduled automatically when the campaign is active
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pending Review Section */}
                  {campaign.scheduledEmails.filter(e => e.status === 'READY').length > 0 && (
                    <div className="border-l-4 border-l-yellow-500 bg-yellow-50 p-4 rounded-r-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-yellow-900">
                          ⏳ Pending Review ({campaign.scheduledEmails.filter(e => e.status === 'READY').length})
                        </h3>
                        <Button
                          size="sm"
                          onClick={async () => {
                            const readyEmails = campaign.scheduledEmails.filter(e => e.status === 'READY');
                            for (const email of readyEmails) {
                              try {
                                await fetch(`/api/emails/${email.id}/approve`, { method: 'POST' });
                              } catch (error) {
                                console.error('Failed to approve email:', error);
                              }
                            }
                            toast({
                              title: 'Success',
                              description: `Approved ${readyEmails.length} email(s)`,
                            });
                            fetchCampaign();
                          }}
                        >
                          Approve All
                        </Button>
                      </div>
                      <p className="text-sm text-yellow-800">
                        These emails are ready for review. Approve them to send at the scheduled time.
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Lead</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled For</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaign.scheduledEmails
                          .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime())
                          .map((email) => (
                          <TableRow key={email.id}>
                            <TableCell className="font-medium">
                              {formatScheduleDay(email.scheduleDay)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{email.lead.firstName}</div>
                                <div className="text-xs text-muted-foreground">{email.lead.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={email.generatedSubject || 'Not generated yet'}>
                                {email.generatedSubject || (
                                  <span className="text-muted-foreground italic">Pending generation</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getEmailStatusColor(email.status)} className="text-xs">
                                {email.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(email.scheduledFor), 'MMM d, yyyy h:mm a')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {email.generatedSubject && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Email Preview</DialogTitle>
                                        <DialogDescription>
                                          Email for {email.lead.firstName} ({email.lead.email})
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 mt-4">
                                        <div>
                                          <div className="text-sm font-medium text-muted-foreground mb-1">Subject:</div>
                                          <div className="text-lg font-semibold">{email.generatedSubject}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-muted-foreground mb-2">Body:</div>
                                          <div className="prose prose-sm max-w-none whitespace-pre-wrap bg-muted p-4 rounded-md">
                                            {email.generatedBody || 'Email body not generated yet'}
                                          </div>
                                        </div>
                                        <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t">
                                          <div>Status: <Badge variant={getEmailStatusColor(email.status)} className="text-xs">{email.status}</Badge></div>
                                          {email.sentAt && (
                                            <div>Sent: {format(new Date(email.sentAt), 'PPp')}</div>
                                          )}
                                        </div>
                                        {email.status === 'READY' && (
                                          <div className="pt-4 border-t">
                                            <Button
                                              className="w-full"
                                              onClick={async () => {
                                                try {
                                                  const res = await fetch(`/api/emails/${email.id}/approve`, {
                                                    method: 'POST',
                                                  });
                                                  if (res.ok) {
                                                    toast({
                                                      title: 'Success',
                                                      description: 'Email approved and queued for sending',
                                                    });
                                                    fetchCampaign();
                                                  } else {
                                                    const data = await res.json();
                                                    toast({
                                                      title: 'Error',
                                                      description: data.error || 'Failed to approve email',
                                                      variant: 'destructive',
                                                    });
                                                  }
                                                } catch (error) {
                                                  toast({
                                                    title: 'Error',
                                                    description: 'Failed to approve email',
                                                    variant: 'destructive',
                                                  });
                                                }
                                              }}
                                            >
                                              ✓ Approve & Send
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                {email.status === 'READY' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/emails/${email.id}/approve`, {
                                          method: 'POST',
                                        });
                                        if (res.ok) {
                                          toast({
                                            title: 'Success',
                                            description: 'Email approved and queued for sending',
                                          });
                                          fetchCampaign();
                                        } else {
                                          const data = await res.json();
                                          toast({
                                            title: 'Error',
                                            description: data.error || 'Failed to approve email',
                                            variant: 'destructive',
                                          });
                                        }
                                      } catch (error) {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to approve email',
                                          variant: 'destructive',
                                        });
                                      }
                                    }}
                                  >
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

