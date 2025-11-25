"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCampaignSchema,
  type CreateCampaignInput,
} from "@/lib/validations/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { timezones } from "@/lib/constants/timezones";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AIAgent {
  id: string;
  name: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateCampaignInput>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      scheduleType: "DAILY",
      emailsPerDay: 2,
      selectedDays: [1, 2, 3, 4, 5],
      durationDays: 30,
      timezone: "UTC",
    },
  });

  const scheduleType = watch("scheduleType");
  const selectedDays = watch("selectedDays") || [];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load AI agents",
        variant: "destructive",
      });
    }
  };

  const toggleDay = (day: number) => {
    const current = selectedDays || [];
    if (current.includes(day)) {
      setValue(
        "selectedDays",
        current.filter((d) => d !== day)
      );
    } else {
      setValue("selectedDays", [...current, day]);
    }
  };

  const onSubmit = async (data: CreateCampaignInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const campaign = await res.json();
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
        router.push(`/campaigns/${campaign.id}`);
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/campaigns"
        className="inline-flex items-center text-sm text-muted-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
          <CardDescription>
            Set up your email campaign schedule and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Welcome Series"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiAgentId">AI Agent</Label>
              <Select
                onValueChange={(value) => setValue("aiAgentId", value)}
                defaultValue={watch("aiAgentId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an AI agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.aiAgentId && (
                <p className="text-sm text-destructive">
                  {errors.aiAgentId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleType">Schedule Type</Label>
              <Select
                onValueChange={(value: "DAILY" | "WEEKLY") =>
                  setValue("scheduleType", value)
                }
                defaultValue={scheduleType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === "WEEKLY" && (
              <div className="space-y-2">
                <Label>Select Days</Label>
                <div className="flex gap-2">
                  {dayLabels.map((label, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${index}`}
                        checked={selectedDays.includes(index)}
                        onCheckedChange={() => toggleDay(index)}
                      />
                      <Label
                        htmlFor={`day-${index}`}
                        className="cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="emailsPerDay">Emails Per Day</Label>
              <Input
                id="emailsPerDay"
                type="number"
                {...register("emailsPerDay", { valueAsNumber: true })}
                min={1}
                max={10}
              />
              {errors.emailsPerDay && (
                <p className="text-sm text-destructive">
                  {errors.emailsPerDay.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (Days)</Label>
              <Input
                id="durationDays"
                type="number"
                {...register("durationDays", { valueAsNumber: true })}
                min={1}
                max={365}
              />
              {errors.durationDays && (
                <p className="text-sm text-destructive">
                  {errors.durationDays.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                onValueChange={(value) => setValue("timezone", value)}
                defaultValue={watch("timezone")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating..." : "Create Campaign"}
              </Button>
              <Link href="/campaigns">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
