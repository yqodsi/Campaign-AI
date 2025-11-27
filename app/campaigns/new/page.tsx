"use client";

import * as React from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { timezones } from "@/lib/constants/timezones";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCalendar,
  IconUser,
  IconCircleCheck,
  IconUsers,
  IconPlus,
  IconMailBolt,
  IconClock,
  IconRobot,
  IconSettings,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";

interface AIAgent {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
}

const STEPS = [
  {
    id: 1,
    name: "Campaign Details",
    icon: IconMailBolt,
    description: "Basic information",
  },
  {
    id: 2,
    name: "Schedule & Settings",
    icon: IconClock,
    description: "Timing and frequency",
  },
  {
    id: 3,
    name: "Add Leads",
    icon: IconUsers,
    description: "Select recipients",
  },
  {
    id: 4,
    name: "Review",
    icon: IconCircleCheck,
    description: "Confirm and create",
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
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
  const formData = watch();

  useEffect(() => {
    fetchAgents();
    fetchLeads();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.data || []);
    } catch (error) {
      console.error("Failed to load agents");
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads?limit=100"); // Load the first 100 leads for now
      const data = await res.json();
      setAvailableLeads(data.data || []);
    } catch (error) {
      console.error("Failed to load leads");
    }
  };

  const toggleDay = (day: number) => {
    const current = selectedDays || [];
    if (current.includes(day)) {
      setValue(
        "selectedDays",
        current.filter((d: number) => d !== day)
      );
    } else {
      setValue("selectedDays", [...current, day]);
    }
  };

  const toggleLead = (leadId: string, checked: boolean) => {
    setSelectedLeads((prev) => {
      if (checked) {
        return [...prev, leadId];
      } else {
        return prev.filter((id) => id !== leadId);
      }
    });
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateCampaignInput)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["name", "aiAgentId"];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        "scheduleType",
        "emailsPerDay",
        "durationDays",
        "startDate",
        "timezone",
        "selectedDays",
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (currentStep < STEPS.length) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateCampaignInput) => {
    // Only submit once the review step is reached
    if (currentStep !== STEPS.length) {
      console.log("Prevented submission - not on final step");
      return;
    }

    setLoading(true);
    try {
      // Step 1: create the campaign
      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!campaignRes.ok) {
        const error = await campaignRes.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      const campaign = await campaignRes.json();

      // Step 2: assign selected leads (if any)
      if (selectedLeads.length > 0) {
        // TODO: replace this temporary loop with a proper bulk endpoint
        await Promise.all(
          selectedLeads.map((leadId) =>
            fetch(`/api/campaigns/${campaign.id}/leads/import`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ leadIds: [leadId] }), // Temporary single-lead call
            })
          )
        );
      }

      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      router.push(`/campaigns/${campaign.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex-1 space-y-6 p-6 pt-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Link
          href="/campaigns"
          className="flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-accent transition-colors"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Create New Campaign
          </h2>
          <p className="text-muted-foreground mt-1">
            Set up your automated email sequence in 4 easy steps
          </p>
        </div>
      </div>

      {/* Wizard stepper */}
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-1 bg-muted rounded-full -z-10" />
        <div
          className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-300 -z-10"
          style={{
            width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
          }}
        />
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-2 bg-background px-2 relative",
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground scale-105"
                      : isCurrent
                      ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg"
                      : "border-muted bg-background"
                  )}
                >
                  {isCompleted ? (
                    <IconCheck className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <div className="text-center">
                  <span
                    className={cn(
                      "text-xs font-semibold block",
                      isCurrent && "text-primary"
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border-2 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentStep === STEPS.length) {
              handleSubmit(onSubmit)(e);
            }
          }}
          onKeyDown={(e) => {
            // Ignore Enter until the user lands on the final step
            if (e.key === "Enter" && currentStep !== STEPS.length) {
              e.preventDefault();
            }
          }}
        >
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {React.createElement(STEPS[currentStep - 1].icon, {
                  className: "h-5 w-5 text-primary",
                })}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {STEPS[currentStep - 1].name}
                </CardTitle>
                <CardDescription>
                  Step {currentStep} of {STEPS.length} •{" "}
                  {STEPS[currentStep - 1].description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-[300px] p-6">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g. Q4 Marketing Outreach"
                    className="h-11"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aiAgentId">Select AI Agent</Label>
                  <Select
                    onValueChange={(value: string) =>
                      setValue("aiAgentId", value)
                    }
                    defaultValue={watch("aiAgentId")}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose an AI persona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent: AIAgent) => (
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
                  <p className="text-sm text-muted-foreground">
                    Don't see the agent you want?{" "}
                    <Link
                      href="/agents"
                      className="text-primary underline hover:text-primary/80"
                    >
                      Create a new one
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid md:grid-cols-2 gap-6">
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
                        <SelectItem value="DAILY">Daily (Every day)</SelectItem>
                        <SelectItem value="WEEKLY">
                          Weekly (Specific days)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      onValueChange={(value: string) =>
                        setValue("timezone", value)
                      }
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
                </div>

                {scheduleType === "WEEKLY" && (
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                    <Label>Active Days</Label>
                    <div className="flex flex-wrap gap-3">
                      {dayLabels.map((label, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`day-${index}`}
                            checked={selectedDays.includes(index)}
                            onCheckedChange={() => toggleDay(index)}
                          />
                          <Label
                            htmlFor={`day-${index}`}
                            className="cursor-pointer font-normal"
                          >
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedDays.length === 0 && (
                      <p className="text-sm text-destructive">
                        Please select at least one day
                      </p>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailsPerDay">Emails Per Day (Max)</Label>
                    <Input
                      id="emailsPerDay"
                      type="number"
                      {...register("emailsPerDay", { valueAsNumber: true })}
                      min={1}
                      max={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      How many emails this campaign sends daily.
                    </p>
                    {errors.emailsPerDay && (
                      <p className="text-sm text-destructive">
                        {errors.emailsPerDay.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="durationDays">
                      Campaign Duration (Days)
                    </Label>
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
                </div>

                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <DateTimePicker
                    value={watch("startDate")}
                    onChange={(value) => setValue("startDate", value)}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-destructive">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Select Leads</h3>
                    <AddLeadDialog onSuccess={fetchLeads} />
                  </div>
                  <div className="border rounded-md max-h-[400px] overflow-y-auto">
                    {availableLeads.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No leads available. Add leads first.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {availableLeads.map((lead: Lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`lead-${lead.id}`}
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={(checked) =>
                                toggleLead(lead.id, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`lead-${lead.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="font-medium text-sm">
                                {lead.firstName} {lead.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {lead.email}
                              </p>
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selected {selectedLeads.length} leads
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-lg border p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agent:</span>
                      <p className="font-medium">
                        {agents.find(
                          (a: AIAgent) => a.id === formData.aiAgentId
                        )?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <p className="font-medium">{formData.scheduleType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Emails/Day:</span>
                      <p className="font-medium">{formData.emailsPerDay}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start Date:</span>
                      <p className="font-medium">
                        {formData.startDate
                          ? new Date(formData.startDate).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">
                        {formData.durationDays} days
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Leads:</span>
                      <p className="font-medium">
                        {selectedLeads.length} selected
                      </p>
                    </div>
                  </div>

                  {/* List of chosen leads */}
                  {selectedLeads.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">
                        Selected Leads:
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {availableLeads
                          .filter((lead: Lead) =>
                            selectedLeads.includes(lead.id)
                          )
                          .map((lead: Lead) => (
                            <div
                              key={lead.id}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                {lead.firstName[0]}
                                {lead.lastName?.[0] || ""}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {lead.firstName} {lead.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {lead.email}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg text-sm">
                  <p className="font-semibold mb-1">Ready to launch?</p>
                  <p>
                    Once created, the AI will start generating emails for the{" "}
                    {selectedLeads.length} selected leads based on your
                    schedule.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => router.back() : prevStep}
              disabled={loading}
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

            {/* Show the right action button for the current step */}
            {currentStep < STEPS.length && (
              <Button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="min-w-[100px] gap-2"
              >
                Next <IconArrowRight className="h-4 w-4" />
              </Button>
            )}

            {currentStep === STEPS.length && (
              <Button
                type="button"
                onClick={() => handleSubmit(onSubmit)()}
                disabled={loading}
                className="min-w-[120px] gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
