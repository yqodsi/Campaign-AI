// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.scheduledEmail.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.aIAgent.deleteMany();

  // Create AI Agents
  const salesAgent = await prisma.aIAgent.create({
    data: {
      name: "Friendly Sales Rep",
      systemPrompt: `You are a friendly sales representative. Write personalized, warm emails that:

- Address the recipient by first name
- Are concise (under 150 words)
- Have a clear call-to-action
- Sound human, not robotic
- Never use pushy sales tactics`,
    },
  });

  const followUpAgent = await prisma.aIAgent.create({
    data: {
      name: "Follow-up Specialist",
      systemPrompt: `You are a follow-up specialist. Write follow-up emails that:

- Reference previous communication
- Provide additional value or information
- Are brief and respectful of time
- Include a soft call-to-action
- Maintain professionalism while being personable`,
    },
  });

  // Create Demo Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: "Welcome Series",
      status: "ACTIVE",
      scheduleType: "DAILY",
      emailsPerDay: 2,
      durationDays: 30,
      startDate: new Date(),
      timezone: "America/New_York",
      aiAgentId: salesAgent.id,
    },
  });

  // Create Demo Leads
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        campaignId: campaign.id,
        metadata: { company: "Acme Inc", source: "website" },
      },
    }),
    prisma.lead.create({
      data: {
        email: "jane.smith@example.com",
        firstName: "Jane",
        lastName: "Smith",
        campaignId: campaign.id,
        metadata: { company: "Tech Corp", source: "referral" },
      },
    }),
    prisma.lead.create({
      data: {
        email: "bob.wilson@example.com",
        firstName: "Bob",
        lastName: "Wilson",
        campaignId: campaign.id,
        metadata: { company: "StartupXYZ", source: "linkedin" },
      },
    }),
  ]);

  // Create some scheduled emails (demo state)
  await prisma.scheduledEmail.create({
    data: {
      campaignId: campaign.id,
      leadId: leads[0].id,
      scheduledFor: new Date(),
      scheduleDay: 1,
      status: "SENT",
      generatedSubject: "Welcome to our community, John!",
      generatedBody:
        "Hi John,\n\nThank you for joining us! We are excited to have you...",
      sentAt: new Date(),
    },
  });

  await prisma.scheduledEmail.create({
    data: {
      campaignId: campaign.id,
      leadId: leads[0].id,
      scheduledFor: addDays(new Date(), 1),
      scheduleDay: 2,
      status: "READY",
      generatedSubject: "Quick question, John",
      generatedBody:
        "Hi John,\n\nI wanted to follow up and see if you had any questions...",
    },
  });

  console.log("✅ Seed data created successfully!");
  console.log(`   - 2 AI Agents`);
  console.log(`   - 1 Campaign`);
  console.log(`   - 3 Leads`);
  console.log(`   - 2 Scheduled Emails`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
