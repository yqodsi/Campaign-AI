# 📧 Email Scheduling - Simple Explanation

## 🎯 The Big Picture

Think of it like a **mail delivery system**:
1. You have a **campaign** (like a "Welcome Series")
2. You have **leads** (people who signed up)
3. The **scheduler** decides WHEN to send emails
4. The **worker** actually sends them

---

## 📅 Example: Daily Campaign

### Setup:
- **Campaign Name**: "Welcome Series"
- **Type**: Daily
- **Emails per day**: 2
- **Start Date**: November 21, 2025
- **Duration**: 30 days
- **Timezone**: Morocco (GMT+1)
- **Leads**: 3 people (Ahmed, Fatima, Youssef)

### What Happens Day by Day:

#### **Day 1 (November 21, 2025)**

**Morning (9:00 AM Morocco time):**
- ✅ Schedule Email #1 for Ahmed
- ✅ Schedule Email #1 for Fatima  
- ✅ Schedule Email #1 for Youssef

**Afternoon (2:00 PM Morocco time):**
- ✅ Schedule Email #2 for Ahmed
- ✅ Schedule Email #2 for Fatima
- ✅ Schedule Email #2 for Youssef

**Result**: 6 emails scheduled for Day 1
- Ahmed gets 2 emails
- Fatima gets 2 emails
- Youssef gets 2 emails

#### **Day 2 (November 22, 2025)**

Same thing happens again:
- 9:00 AM: Email #1 for all 3 leads
- 2:00 PM: Email #2 for all 3 leads

**Result**: 6 more emails scheduled for Day 2

#### **Day 3, 4, 5...**

This continues every day until Day 30.

---

## 📆 Example: Weekly Campaign

### Setup:
- **Campaign Name**: "Weekly Newsletter"
- **Type**: Weekly
- **Selected Days**: Monday, Wednesday, Friday
- **Emails per day**: 3
- **Start Date**: November 24, 2025 (Monday)
- **Leads**: 2 people (Sara, Omar)

### What Happens:

#### **Week 1 - Monday (Nov 24)**
- ✅ Schedule 3 emails for Sara (9am, 2pm, 6pm)
- ✅ Schedule 3 emails for Omar (9am, 2pm, 6pm)
- **Total**: 6 emails (this is "Day 1" of the campaign)

#### **Week 1 - Tuesday (Nov 25)**
- ❌ **SKIPPED** - Tuesday is not selected
- No emails scheduled

#### **Week 1 - Wednesday (Nov 26)**
- ✅ Schedule 3 emails for Sara
- ✅ Schedule 3 emails for Omar
- **Total**: 6 emails (this is "Day 2" of the campaign)

#### **Week 1 - Thursday (Nov 27)**
- ❌ **SKIPPED** - Thursday is not selected

#### **Week 1 - Friday (Nov 28)**
- ✅ Schedule 3 emails for Sara
- ✅ Schedule 3 emails for Omar
- **Total**: 6 emails (this is "Day 3" of the campaign)

#### **Week 2 - Monday (Dec 1)**
- ✅ Schedule 3 emails for Sara
- ✅ Schedule 3 emails for Omar
- **Total**: 6 emails (this is "Day 4" of the campaign)

**Key Point**: Only Monday, Wednesday, Friday count as "campaign days"

---

## 🔢 What is "scheduleDay"?

`scheduleDay` is like a **unique ID** for each email in the sequence.

### For Daily Campaigns:
- Day 1, Email 1 → `scheduleDay = 10000`
- Day 1, Email 2 → `scheduleDay = 10001`
- Day 2, Email 1 → `scheduleDay = 20000`
- Day 2, Email 2 → `scheduleDay = 20001`

**Formula**: `scheduleDay = (dayNumber × 10000) + emailIndex`

### Why This Numbering?

It ensures **uniqueness**:
- Each email has a unique ID
- System can check: "Did we already send this email?"
- Prevents duplicates if scheduler runs twice

---

## ⏰ Time Distribution

If you set **3 emails per day**, they're spread out:

```
Email 1: 9:00 AM  ──────────┐
                             │
Email 2: 2:00 PM  ──────────┤  Spaced throughout the day
                             │
Email 3: 6:00 PM  ──────────┘
```

**Why?** So people don't get bombarded with 3 emails at once!

---

## 🌍 Timezone Example

**Campaign Timezone**: Morocco (GMT+1, Africa/Casablanca)

**You schedule**: Email at 9:00 AM Morocco time

**What happens**:
1. System calculates: "9:00 AM in Morocco = 8:00 AM UTC"
2. Stores in database: `8:00 AM UTC`
3. When sending: Converts back to Morocco time
4. Lead receives: Email at 9:00 AM their local time (Morocco)

**Why UTC?** Databases store everything in UTC, then convert to local time when needed.

---

## 🔄 The Complete Flow

### Step 1: Scheduler Runs
```
You click "Trigger Processing" 
  OR
Cron job runs automatically
```

### Step 2: Find Active Campaigns
```
System looks for campaigns with status = "ACTIVE"
```

### Step 3: Check Each Campaign
```
For each campaign:
  ✓ Has it started? (startDate passed?)
  ✓ Still within duration? (not past 30 days?)
  ✓ For weekly: Is today a selected day?
```

### Step 4: Calculate Schedule Day
```
Daily: Day 1, 2, 3, 4...
Weekly: Day 1 (first Monday), Day 2 (first Wednesday)...
```

### Step 5: Schedule Emails
```
For each lead:
  For each email (1, 2, 3...):
    ✓ Check if already scheduled (idempotency)
    ✓ Calculate send time (9am, 2pm, 6pm...)
    ✓ Create ScheduledEmail record
    ✓ Queue for generation
```

### Step 6: Worker Generates Content
```
Worker picks up email from queue
  → Calls OpenAI API
  → Generates subject & body
  → Updates status to "READY"
```

### Step 7: Worker Sends Email
```
When scheduledFor time arrives:
  → Worker picks up "READY" email
  → Sends via SMTP
  → Updates status to "SENT"
```

---

## 🧪 Quick Test (15 Minutes)

When you run the quick test:

1. **Bypasses normal checks** (doesn't wait for actual day)
2. **Schedules emails for 15 minutes from now**
3. **Uses special scheduleDay** (-1000, -1001) to avoid conflicts
4. **Goes through full flow**: Generate → Send

**Result**: You see emails being created and sent in 15 minutes instead of waiting days!

---

## ❓ Common Questions

### Q: What if scheduler runs twice?
**A**: Idempotency check prevents duplicates. If email already exists, it's skipped.

### Q: What if email time is in the past?
**A**: System adjusts to send now (with small delay between emails).

### Q: What if campaign is paused?
**A**: Scheduler only processes ACTIVE campaigns. Paused ones are skipped.

### Q: What if no leads?
**A**: Scheduler logs warning and skips that campaign.

### Q: What if duration exceeded?
**A**: Campaign status changes to "COMPLETED" and no more emails are scheduled.

---

## 📊 Visual Timeline

```
Campaign Start: Nov 21
Duration: 30 days
Emails/day: 2
Leads: 3

Day 1 (Nov 21):
  9:00 AM → Email 1 for Lead 1, 2, 3
  2:00 PM → Email 2 for Lead 1, 2, 3

Day 2 (Nov 22):
  9:00 AM → Email 1 for Lead 1, 2, 3
  2:00 PM → Email 2 for Lead 1, 2, 3

...continues for 30 days...

Day 30 (Dec 20):
  9:00 AM → Email 1 for Lead 1, 2, 3
  2:00 PM → Email 2 for Lead 1, 2, 3

Campaign Complete! ✅
```

---

## 🎯 Key Takeaways

1. **ScheduleDay** = Unique ID for each email (prevents duplicates)
2. **Daily** = Every day, same pattern
3. **Weekly** = Only on selected days (Mon/Wed/Fri)
4. **Emails per day** = How many emails each lead gets that day
5. **Timezone** = All times calculated in campaign's timezone
6. **Idempotency** = Won't create duplicate emails
7. **Distribution** = Emails spread throughout the day (9am, 2pm, 6pm)

Does this help? If you're still confused, tell me which part and I'll explain it differently! 😊

