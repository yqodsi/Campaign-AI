'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Users, Bot, Mail, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function HomePage() {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleTestProcessing = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/cron/process', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast({
          title: 'Processing Triggered!',
          description: 'Check campaign details and Docker logs to see emails being generated. Note: You need OPENAI_API_KEY set for email generation to work.',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to trigger processing',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trigger processing',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Email Campaign Automation</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            AI-powered email campaigns with automated scheduling and personalization
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Megaphone className="h-5 w-5 text-primary" />
                Campaigns
              </CardTitle>
              <CardDescription>Manage your email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/campaigns">
                <Button className="w-full" size="lg">View Campaigns</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                AI Agents
              </CardTitle>
              <CardDescription>Configure AI email writers</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/agents">
                <Button className="w-full" size="lg">View Agents</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Leads
              </CardTitle>
              <CardDescription>Manage your leads</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/campaigns">
                <Button className="w-full" variant="outline" size="lg">View Leads</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Emails
              </CardTitle>
              <CardDescription>Track email performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/campaigns">
                <Button className="w-full" variant="outline" size="lg">View Emails</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Get started with your first campaign in 4 simple steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Create an AI Agent</h3>
                    <p className="text-sm text-muted-foreground">
                      Define the personality and style of your email writer
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Create a Campaign</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up your campaign schedule, duration, and select an AI agent
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Add Leads</h3>
                    <p className="text-sm text-muted-foreground">
                      Import leads via CSV or add them manually
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Start Campaign</h3>
                    <p className="text-sm text-muted-foreground">
                      Activate your campaign and watch the AI generate personalized emails
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Link href="/campaigns/new">
                  <Button size="lg" className="w-full">
                    Create Your First Campaign
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Test Email Processing
              </CardTitle>
              <CardDescription>
                Manually trigger email scheduling and generation for active campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the button below to immediately process active campaigns and generate emails. 
                This is useful for testing without waiting for scheduled times.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestProcessing} 
                  disabled={processing}
                  className="flex-1"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Trigger Processing
                    </>
                  )}
                </Button>
                <Link href="/test">
                  <Button variant="outline" size="lg">
                    Quick Test (15min)
                  </Button>
                </Link>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground bg-muted p-3 rounded-md">
                <p>💡 <strong>Tip:</strong> Use "Test Scheduler" to preview what emails would be scheduled without actually creating them</p>
                <p>⚠️ <strong>Note:</strong> Set OPENAI_API_KEY in your .env file for email generation</p>
                <p>📊 <strong>Logs:</strong> <code className="bg-background px-1.5 py-0.5 rounded">docker-compose logs -f app</code></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

