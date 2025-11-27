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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconRobot,
  IconBrain,
  IconSparkles,
  IconMailBolt,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";

interface AIAgent {
  id: string;
  name: string;
  systemPrompt: string;
  _count: { campaigns: number };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [formData, setFormData] = useState({ name: "", systemPrompt: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "AI Agent created successfully",
        });
        setDialogOpen(false);
        setFormData({ name: "", systemPrompt: "" });
        fetchAgents();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setFormData({ name: agent.name, systemPrompt: agent.systemPrompt });
    setEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAgent) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "AI Agent updated successfully",
        });
        setEditDialogOpen(false);
        setEditingAgent(null);
        setFormData({ name: "", systemPrompt: "" });
        fetchAgents();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this agent? This action cannot be undone."
      )
    )
      return;

    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "AI Agent deleted successfully",
        });
        fetchAgents();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete agent",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Agents</h2>
          <p className="text-muted-foreground mt-1">
            Configure AI personas to write personalized emails
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <IconPlus className="h-4 w-4" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconBrain className="h-5 w-5" />
                Create AI Agent
              </DialogTitle>
              <DialogDescription>
                Define the personality and writing style for your email
                campaigns
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Friendly Sales Rep, Professional Consultant"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) =>
                    setFormData({ ...formData, systemPrompt: e.target.value })
                  }
                  placeholder="You are a friendly sales representative who writes warm, personalized emails..."
                  rows={10}
                  required
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines how the AI will write emails. Be specific
                  about tone, style, and approach.
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <IconSparkles className="h-4 w-4" />
                      Create Agent
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <IconRobot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No AI agents yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first AI agent to start generating personalized emails
              for your campaigns
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <IconPlus className="h-4 w-4" />
                  Create Your First Agent
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="hover:shadow-lg transition-all hover:border-primary/50 group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                      <IconRobot className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {agent.name}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(agent)}
                      className="h-8 w-8"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(agent.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-1.5">
                  <IconMailBolt className="h-3.5 w-3.5" />
                  Used in {agent._count.campaigns} campaign
                  {agent._count.campaigns !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    System Prompt:
                  </p>
                  <p className="text-sm text-foreground line-clamp-4 leading-relaxed">
                    {agent.systemPrompt}
                  </p>
                </div>
                {agent._count.campaigns > 0 && (
                  <Badge variant="secondary" className="w-full justify-center">
                    Active in {agent._count.campaigns} campaign
                    {agent._count.campaigns !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconEdit className="h-5 w-5" />
              Edit AI Agent
            </DialogTitle>
            <DialogDescription>
              Update the agent's name and system prompt
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Agent Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-systemPrompt">System Prompt</Label>
              <Textarea
                id="edit-systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) =>
                  setFormData({ ...formData, systemPrompt: e.target.value })
                }
                rows={10}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Define how the AI should write emails - tone, style, and
                approach.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <IconSparkles className="h-4 w-4" />
                    Update Agent
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
