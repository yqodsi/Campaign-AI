# 🌍 Multi-Timezone Support - How It Works

## ✅ Yes! The app handles different timezones correctly

Each campaign can have its own timezone, and emails are sent at the correct local time for that campaign.

---

## 📊 Example: 3 Campaigns in Different Timezones

### Campaign 1: Morocco Campaign
- **Timezone**: Africa/Casablanca (GMT+1)
- **Schedule**: 2 emails/day at 9:00 AM and 2:00 PM Morocco time
- **Leads**: Ahmed, Fatima

### Campaign 2: New York Campaign  
- **Timezone**: America/New_York (GMT-5, EST)
- **Schedule**: 2 emails/day at 9:00 AM and 2:00 PM New York time
- **Leads**: John, Sarah

### Campaign 3: Tokyo Campaign
- **Timezone**: Asia/Tokyo (GMT+9, JST)
- **Schedule**: 2 emails/day at 9:00 AM and 2:00 PM Tokyo time
- **Leads**: Hiroshi, Yuki

---

## ⏰ What Happens at Different Times

### Scenario: It's 9:00 AM in Morocco (8:00 AM UTC)

**Morocco Campaign:**
- ✅ Scheduler checks: "Is it 9:00 AM in Morocco timezone?" → YES
- ✅ Schedules Email #1 for Ahmed and Fatima
- ✅ Stores in database: `scheduledFor = 8:00 AM UTC` (converted from 9:00 AM Morocco time)

**New York Campaign:**
- ❌ Scheduler checks: "Is it 9:00 AM in New York timezone?" → NO (it's 3:00 AM in NY)
- ❌ Skips scheduling (not time yet)

**Tokyo Campaign:**
- ❌ Scheduler checks: "Is it 9:00 AM in Tokyo timezone?" → NO (it's 4:00 PM in Tokyo, already past)
- ❌ Skips scheduling (already sent today)

---

## 🔄 How It Works Step by Step

### Step 1: Scheduler Runs
```
Scheduler processes ALL active campaigns
```

### Step 2: For Each Campaign
```
1. Get current time in campaign's timezone:
   campaignTzNow = toZonedTime(now, campaign.timezone)
   
2. Check if it's time to send:
   - For daily: Check if it's the right hour (9am, 2pm, etc.)
   - For weekly: Check if today is a selected day
   
3. Calculate send time in campaign timezone:
   sendHour = 9 (9:00 AM in campaign's timezone)
   
4. Convert to UTC for storage:
   scheduledFor = fromZonedTime("2025-11-21T09:00:00", "Africa/Casablanca")
   → Stores as: "2025-11-21T08:00:00Z" (UTC)
```

### Step 3: Worker Sends Email
```
1. Worker checks: scheduledFor (stored in UTC)
2. Compares with current UTC time
3. When scheduledFor <= now (UTC), sends email
4. Email arrives at correct local time for that campaign
```

---

## 📅 Real-World Example

**Date**: November 21, 2025
**Current UTC Time**: 10:00 AM UTC

### Morocco Campaign (GMT+1)
- **Local Time**: 11:00 AM Morocco time
- **9:00 AM Email**: Already sent (at 8:00 AM UTC)
- **2:00 PM Email**: Will send at 1:00 PM UTC (2:00 PM Morocco time)

### New York Campaign (GMT-5, EST)
- **Local Time**: 5:00 AM New York time
- **9:00 AM Email**: Will send at 2:00 PM UTC (9:00 AM New York time)
- **2:00 PM Email**: Will send at 7:00 PM UTC (2:00 PM New York time)

### Tokyo Campaign (GMT+9, JST)
- **Local Time**: 7:00 PM Tokyo time
- **9:00 AM Email**: Already sent (at 12:00 AM UTC)
- **2:00 PM Email**: Already sent (at 5:00 AM UTC)

---

## 🎯 Key Points

1. **Each campaign has its own timezone**
   - Stored in `campaign.timezone` field
   - Can be different for each campaign

2. **Scheduling happens in campaign's timezone**
   - "9:00 AM" means 9:00 AM in THAT campaign's timezone
   - Not 9:00 AM UTC or server time

3. **Storage is in UTC**
   - All times converted to UTC before storing
   - Makes comparison and scheduling easier

4. **Worker uses UTC comparison**
   - Compares `scheduledFor` (UTC) with current time (UTC)
   - Works correctly regardless of server timezone

5. **Emails arrive at correct local time**
   - Morocco campaign → emails at 9:00 AM Morocco time
   - New York campaign → emails at 9:00 AM New York time
   - Tokyo campaign → emails at 9:00 AM Tokyo time

---

## ✅ Verification

The code does this correctly:

```javascript
// 1. Get current time in campaign's timezone
const campaignTzNow = toZonedTime(now, campaign.timezone);

// 2. Calculate send time in campaign timezone
const sendHour = 9; // 9:00 AM in campaign's timezone

// 3. Convert to UTC for storage
const scheduledFor = fromZonedTime(dateStringInTz, campaign.timezone);

// 4. Worker compares UTC times
delay: Math.max(0, scheduledFor.getTime() - Date.now())
```

---

## 🧪 Test It Yourself

1. **Create Campaign 1**: Morocco timezone, schedule for 9:00 AM
2. **Create Campaign 2**: New York timezone, schedule for 9:00 AM  
3. **Create Campaign 3**: Tokyo timezone, schedule for 9:00 AM

All three will send at 9:00 AM in their respective timezones! 🎉

---

## 💡 Why This Works

- **UTC is universal**: All times stored in UTC
- **Timezone conversion**: Happens at scheduling time
- **Worker is timezone-agnostic**: Just compares UTC timestamps
- **Each campaign independent**: One campaign's timezone doesn't affect others

---

## ⚠️ Important Notes

1. **Server timezone doesn't matter**: The server can be in any timezone
2. **Database stores UTC**: All `scheduledFor` times are in UTC
3. **Conversion happens once**: At scheduling time, not at send time
4. **Daylight Saving Time**: Handled automatically by timezone libraries

---

## 🎉 Conclusion

**YES!** The app correctly handles multiple timezones. Each campaign operates independently in its own timezone, and emails are sent at the correct local time for that campaign.

