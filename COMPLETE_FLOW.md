# 📧 Complete Email Campaign Flow - Step by Step

## 🎯 Overview

This document explains the **complete flow** from creating a campaign to sending emails, including the new **review and approval** step.

---

## 📋 Step-by-Step Flow

### **STEP 1: Create Campaign** 🆕

**User Action:**

- Go to `/campaigns/new`
- Fill out form:
  - Campaign name: "Welcome Series"
  - AI Agent: Select an agent
  - Schedule Type: Daily or Weekly
  - Emails per day: 2
  - Duration: 30 days
  - Start Date: November 21, 2025, 9:00 AM
  - Timezone: Africa/Casablanca (Morocco)

**What Happens:**

1. Form validates data
2. API creates campaign in database
3. Status: `DRAFT`
4. Campaign saved but **not active yet**

**Database State:**

```
Campaign {
  id: "abc-123",
  name: "Welcome Series",
  status: "DRAFT",
  scheduleType: "DAILY",
  emailsPerDay: 2,
  durationDays: 30,
  startDate: "2025-11-21T08:00:00Z" (UTC),
  timezone: "Africa/Casablanca",
  aiAgentId: "agent-xyz"
}
```

---

### **STEP 2: Add Leads** 👥

**User Action:**

- Go to campaign detail page
- Click "Manage Leads"
- Import CSV or add manually:
  - Ahmed (ahmed@example.com)
  - Fatima (fatima@example.com)
  - Youssef (youssef@example.com)

**What Happens:**

1. Leads are created and linked to campaign
2. No emails scheduled yet (campaign still DRAFT)

**Database State:**

```
Lead { id: "lead-1", email: "ahmed@example.com", campaignId: "abc-123" }
Lead { id: "lead-2", email: "fatima@example.com", campaignId: "abc-123" }
Lead { id: "lead-3", email: "youssef@example.com", campaignId: "abc-123" }
```

---

### **STEP 3: Start Campaign** ▶️

**User Action:**

- Click "Start Campaign" button
- Campaign status changes to `ACTIVE`

**What Happens:**

1. API updates campaign status: `DRAFT` → `ACTIVE`
2. Campaign is now ready for scheduling
3. **No emails created yet** - scheduler will create them

**Database State:**

```
Campaign {
  status: "ACTIVE"  ← Changed from DRAFT
}
```

---

### **STEP 4: Scheduler Runs** ⏰

**Trigger:**

- Manual: Click "Trigger Email Processing Now"
- Automatic: Cron job runs (e.g., every hour)
- Test: Quick test (15 minutes)

**What Happens:**

#### 4.1: Find Active Campaigns

```
Scheduler queries: WHERE status = 'ACTIVE'
Finds: Campaign "Welcome Series"
```

#### 4.2: Check Campaign Conditions

```
✓ Has it started? (startDate <= now) → YES
✓ Still within duration? (daysSinceStart < 30) → YES
✓ For weekly: Is today a selected day? → N/A (daily campaign)
```

#### 4.3: Calculate Schedule Day

```
Days since start: 0 (first day)
Schedule Day: 1 (for daily campaigns)
```

#### 4.4: Schedule Emails for Each Lead

```
For each lead (Ahmed, Fatima, Youssef):
  For each email (1, 2 - because emailsPerDay = 2):

    Email 1:
      - scheduleDay = 10000 (Day 1 * 10000 + 0)
      - Send time: 9:00 AM Morocco time
      - Convert to UTC: 8:00 AM UTC
      - Create ScheduledEmail record
      - Status: PENDING
      - Queue for generation

    Email 2:
      - scheduleDay = 10001 (Day 1 * 10000 + 1)
      - Send time: 2:00 PM Morocco time
      - Convert to UTC: 1:00 PM UTC
      - Create ScheduledEmail record
      - Status: PENDING
      - Queue for generation
```

**Database State:**

```
ScheduledEmail {
  id: "email-1",
  campaignId: "abc-123",
  leadId: "lead-1",
  scheduleDay: 10000,
  scheduledFor: "2025-11-21T08:00:00Z",  // 9:00 AM Morocco time
  status: "PENDING",
  generatedSubject: null,
  generatedBody: null
}
... (5 more emails for other leads)
```

**Total:** 6 emails created (3 leads × 2 emails/day)

---

### **STEP 5: Email Generation Worker** 🤖

**Trigger:**

- BullMQ worker picks up jobs from `email-generation` queue

**What Happens:**

#### 5.1: Worker Picks Up Job

```
Job: { scheduledEmailId: "email-1" }
Status: PENDING → GENERATING
```

#### 5.2: Generate Content with AI

```
Calls OpenAI API with:
  - AI Agent's system prompt
  - Lead info: Ahmed, ahmed@example.com
  - Campaign context: "Welcome Series", Day 1
  - Email number: 1 of 60 (30 days × 2 emails)

OpenAI returns:
  Subject: "Welcome to Our Platform, Ahmed!"
  Body: "Hi Ahmed, Welcome to our platform..."
```

#### 5.3: Save Generated Content

```
Update ScheduledEmail:
  status: GENERATING → READY
  generatedSubject: "Welcome to Our Platform, Ahmed!"
  generatedBody: "Hi Ahmed, Welcome to our platform..."
```

**Database State:**

```
ScheduledEmail {
  id: "email-1",
  status: "READY",  ← Changed from GENERATING
  generatedSubject: "Welcome to Our Platform, Ahmed!",
  generatedBody: "Hi Ahmed, Welcome to our platform...",
  scheduledFor: "2025-11-21T08:00:00Z"
}
```

**Important:** Email is **NOT queued for sending** yet! It's waiting for approval.

---

### **STEP 6: Email Review** 👀

**User Action:**

- Go to campaign detail page
- Click "Emails" tab
- See yellow banner: "⏳ Pending Review (6)"

**What User Sees:**

```
┌─────────────────────────────────────────┐
│ ⏳ Pending Review (6)                   │
│ These emails are ready for review...    │
│ [Approve All]                           │
└─────────────────────────────────────────┘

Table:
┌──────────┬──────────┬──────────────────────────┬──────────┬──────────────┐
│ Schedule │ Lead     │ Subject                   │ Status   │ Actions      │
├──────────┼──────────┼──────────────────────────┼──────────┼──────────────┤
│ Day 1    │ Ahmed    │ Welcome to Our Platform...│ READY    │ [👁️] [✓]    │
│ Day 1    │ Ahmed    │ Day 1 Follow-up...        │ READY    │ [👁️] [✓]    │
│ Day 1    │ Fatima   │ Welcome to Our Platform...│ READY    │ [👁️] [✓]    │
│ ...      │ ...      │ ...                       │ READY    │ [👁️] [✓]    │
└──────────┴──────────┴──────────────────────────┴──────────┴──────────────┘
```

**User Options:**

1. **Click 👁️ (Eye icon)** → Preview email content
2. **Click ✓ (Approve)** → Approve individual email
3. **Click "Approve All"** → Approve all ready emails at once

---

### **STEP 7: Approve Email** ✅

**User Action:**

- Click "Approve" button on an email
- OR click "Approve All"

**What Happens:**

#### 7.1: API Endpoint Called

```
POST /api/emails/email-1/approve
```

#### 7.2: Validation

```
✓ Email exists? → YES
✓ Status is READY? → YES
```

#### 7.3: Mark as Approved

```
Update ScheduledEmail:
  status: READY → APPROVED
```

#### 7.4: Calculate Send Delay

```
scheduledFor: "2025-11-21T08:00:00Z" (9:00 AM Morocco time)
Current time: "2025-11-21T07:30:00Z"
Delay: 30 minutes (30 * 60 * 1000 ms)
```

#### 7.5: Queue for Sending

```
Add to email-sending queue with delay:
  delay: 30 minutes
  job: { scheduledEmailId: "email-1" }
```

**Database State:**

```
ScheduledEmail {
  id: "email-1",
  status: "APPROVED",  ← Changed from READY
  generatedSubject: "Welcome to Our Platform, Ahmed!",
  generatedBody: "Hi Ahmed, Welcome to our platform...",
  scheduledFor: "2025-11-21T08:00:00Z"
}
```

**Queue State:**

```
email-sending queue:
  Job 1: { scheduledEmailId: "email-1", delay: 30 minutes }
  Job 2: { scheduledEmailId: "email-2", delay: 30 minutes }
  ...
```

---

### **STEP 8: Email Sending Worker** 📤

**Trigger:**

- BullMQ worker picks up job from `email-sending` queue
- Job executes when delay expires (at scheduled time)

**What Happens:**

#### 8.1: Worker Picks Up Job (at scheduled time)

```
Job: { scheduledEmailId: "email-1" }
Current time: "2025-11-21T08:00:00Z" (9:00 AM Morocco time)
```

#### 8.2: Validation Checks

```
✓ Email exists? → YES
✓ Status is SENT? → NO
✓ Campaign is ACTIVE? → YES
✓ Status is APPROVED? → YES  ← Must be APPROVED!
```

#### 8.3: Send Email via SMTP

```
Call sendEmail():
  to: "ahmed@example.com"
  subject: "Welcome to Our Platform, Ahmed!"
  body: "Hi Ahmed, Welcome to our platform..."

SMTP sends email via Gmail/Nodemailer
```

#### 8.4: Mark as Sent

```
Update ScheduledEmail:
  status: APPROVED → SENT
  sentAt: "2025-11-21T08:00:01Z"
```

**Database State:**

```
ScheduledEmail {
  id: "email-1",
  status: "SENT",  ← Changed from APPROVED
  sentAt: "2025-11-21T08:00:01Z",
  generatedSubject: "Welcome to Our Platform, Ahmed!",
  generatedBody: "Hi Ahmed, Welcome to our platform..."
}
```

**Email Delivered:** ✅ Ahmed receives email at 9:00 AM Morocco time

---

## 🔄 Complete Status Flow

```
1. PENDING
   ↓ (Scheduler creates email)

2. GENERATING
   ↓ (Worker generates content)

3. READY
   ↓ (User reviews and approves)

4. APPROVED
   ↓ (Worker sends at scheduled time)

5. SENT
   ✅ Complete!
```

---

## 📊 Example Timeline

**November 21, 2025 - Campaign Start**

**8:00 AM UTC (9:00 AM Morocco):**

- ✅ Scheduler runs
- ✅ Creates 6 emails (status: PENDING)
- ✅ Queues for generation

**8:01 AM UTC:**

- ✅ Generation worker picks up jobs
- ✅ Generates content via OpenAI
- ✅ Updates status: READY
- ✅ Emails appear in "Pending Review"

**8:05 AM UTC:**

- 👀 User reviews emails
- ✅ User clicks "Approve All"
- ✅ Status changes: APPROVED
- ✅ Queued for sending with delay

**8:30 AM UTC:**

- ⏰ First email scheduled for 8:00 AM UTC (already past)
- ✅ Sending worker sends immediately
- ✅ Status: SENT
- 📧 Email delivered to Ahmed

**1:00 PM UTC (2:00 PM Morocco):**

- ⏰ Second email scheduled for 1:00 PM UTC
- ✅ Sending worker sends
- ✅ Status: SENT
- 📧 Email delivered to Ahmed

---

## 🎯 Key Points

1. **Campaign Creation** → Status: DRAFT
2. **Add Leads** → No emails yet
3. **Start Campaign** → Status: ACTIVE
4. **Scheduler Runs** → Creates emails (PENDING)
5. **Generation Worker** → Generates content (READY)
6. **User Reviews** → Sees generated emails
7. **User Approves** → Status: APPROVED
8. **Sending Worker** → Sends at scheduled time (SENT)

---

## 🔒 Safety Features

1. **No Auto-Sending**: Emails never send automatically
2. **Review Required**: All emails must be approved
3. **Bulk Approval**: Can approve all at once
4. **Individual Control**: Can approve one by one
5. **Preview Before Send**: Can see content before approving
6. **Scheduled Timing**: Sends at correct time even if approved early

---

## 💡 What If User Doesn't Approve?

- Emails stay in **READY** status
- They **never send** automatically
- User can approve later (will send immediately if time has passed)
- User can regenerate if content needs changes

---

This is the complete flow! Every email goes through review before sending. 🎉
