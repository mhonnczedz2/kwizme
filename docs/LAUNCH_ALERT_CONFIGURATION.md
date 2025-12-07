# Launch Day Alert Threshold Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring monitoring alert thresholds across all monitoring platforms for QuizMe's launch day.

---

## 1. UptimeRobot Alert Configuration

### **Access Your UptimeRobot Dashboard**
1. Log into [UptimeRobot.com](https://uptimerobot.com/dashboard)
2. Navigate to "My Settings" → "Alert Contacts"

### **Configure Email Alert Settings**

#### **Main Site Monitor**
1. Click on your "QuizMe - Main Site" monitor
2. **Alert Settings:**
   - **Alert When:** Down for 2 minutes (120 seconds)
   - **Alert Methods:** Email ✅
   - **Alert Message:**
     ```
     🚨 QuizMe Main Site DOWN
     Monitor: QuizMe - Main Site
     URL: https://your-domain.com
     Status: [monitorFriendlyName] is [alertType]
     Time: [monitorDateTime]
     ```

#### **System Health Monitor**
1. Click on your "QuizMe - System Health" monitor
2. **Alert Settings:**
   - **Alert When:** Down for 2 minutes (120 seconds)
   - **Alert Methods:** Email ✅
   - **Alert Message:**
     ```
     ⚠️ QuizMe System Health Issue
     Monitor: QuizMe - System Health
     URL: https://your-domain.com/api/health
     Status: [monitorFriendlyName] is [alertType]
     Time: [monitorDateTime]
     ```

#### **Database Health Monitor**
1. Click on your "QuizMe - Database Health" monitor
2. **Alert Settings:**
   - **Alert When:** Down for 1 minute (60 seconds) ⚠️ *More urgent*
   - **Alert Methods:** Email ✅
   - **Alert Message:**
     ```
     🔥 QuizMe Database Issue - URGENT
     Monitor: QuizMe - Database Health
     URL: https://your-domain.com/api/health/db
     Status: [monitorFriendlyName] is [alertType]
     Time: [monitorDateTime]
     ```

#### **API Endpoint Monitor**
1. Click on your "QuizMe - API Status" monitor
2. **Alert Settings:**
   - **Alert When:** Down for 3 minutes (180 seconds)
   - **Alert Methods:** Email ✅
   - **Note:** This monitor may occasionally show errors (400/405) which is normal

### **Advanced UptimeRobot Settings**

#### **Response Time Alerts** (If on paid plan)
1. Enable "Response Time Alerts"
2. **Thresholds:**
   - **Warning:** > 3000ms (3 seconds)
   - **Critical:** > 5000ms (5 seconds)

#### **SSL Certificate Monitoring**
1. Enable SSL certificate monitoring
2. **Alert:** 7 days before expiration

---

## 2. Sentry Alert Configuration

### **Access Sentry Project**
1. Log into [Sentry.io](https://sentry.io)
2. Navigate to your QuizMe project

### **Create Error Rate Alerts**

#### **Critical Error Rate Alert**
1. Go to **Alerts** → **Create Alert Rule**
2. **Alert Rule Configuration:**
   ```
   Name: QuizMe Critical Error Rate
   Team: Default
   Environment: production

   When: errors count
   In: 5 minutes
   Is: greater than 10

   Actions:
   - Send email to: your-email@domain.com
   - Subject: 🚨 QuizMe Critical Error Spike
   ```

#### **Error Spike Alert**
1. Create second alert rule:
   ```
   Name: QuizMe Error Spike
   Team: Default
   Environment: production

   When: errors count
   In: 1 minute
   Is: greater than 5

   Actions:
   - Send email to: your-email@domain.com
   - Subject: ⚠️ QuizMe Error Spike Detected
   ```

#### **Performance Degradation Alert**
1. Create performance alert:
   ```
   Name: QuizMe Performance Degradation
   Team: Default
   Environment: production

   When: average response time
   In: 10 minutes
   Is: greater than 5000ms (5 seconds)

   Actions:
   - Send email to: your-email@domain.com
   - Subject: 🐌 QuizMe Performance Issue
   ```

### **Error Notification Settings**
1. Go to **User Settings** → **Notifications**
2. **Project Alerts:** Enable email notifications
3. **Issue Alerts:**
   - **Immediate:** First seen error
   - **Hourly:** Error frequency changes

---

## 3. Google Analytics Alert Configuration

### **Custom Alerts in GA4**
1. Log into [Google Analytics](https://analytics.google.com)
2. Navigate to your QuizMe property
3. Go to **Configure** → **Custom Definitions** → **Custom metrics**

#### **Traffic Drop Alert**
1. **Admin** → **Custom Alerts** → **Create Alert**
   ```
   Alert Name: QuizMe Traffic Drop
   View: All Web Site Data

   Condition:
   - Apply to: Sessions
   - Alert when: Day to Day % change is
   - Condition: Decreases by more than 50%
   - Period: Day

   Send notification: Email ✅
   ```

#### **Error Rate Alert**
1. Create custom alert for 4xx/5xx errors:
   ```
   Alert Name: QuizMe Error Rate Spike
   View: All Web Site Data

   Condition:
   - Apply to: Exceptions
   - Alert when: Day to Day % change is
   - Condition: Increases by more than 100%
   - Period: Day

   Send notification: Email ✅
   ```

---

## 4. Vercel Monitoring Configuration

### **Access Vercel Dashboard**
1. Log into [Vercel.com](https://vercel.com/dashboard)
2. Navigate to your QuizMe project

### **Function Performance Monitoring**
1. Go to **Functions** tab
2. **Alerts** → **Configure**
3. **Thresholds:**
   - **Function Duration:** > 10 seconds
   - **Function Errors:** > 5 in 1 hour
   - **Cold Boot Time:** > 5 seconds

### **Build Failure Alerts**
1. **Settings** → **Git** → **Deploy Hooks**
2. Enable notifications for:
   - **Failed deployments**
   - **Build errors**
   - **Runtime errors**

---

## 5. Custom Launch Day Thresholds

### **High-Traffic Event Adjustments**

During launch day, temporarily adjust thresholds to account for increased traffic:

#### **UptimeRobot - Relaxed Thresholds**
- **Main Site:** 3 minutes (instead of 2)
- **API Health:** 3 minutes (instead of 2)
- **Database:** 2 minutes (instead of 1)

#### **Sentry - Higher Tolerances**
- **Error Rate:** > 20 errors in 5 minutes
- **Error Spike:** > 10 errors in 1 minute
- **Performance:** > 8000ms response time

#### **Reason:** Launch day typically sees:
- Higher error rates as new users explore
- Increased load causing slower responses
- More edge cases and unexpected usage patterns

### **Post-Launch Threshold Reset**

After 48 hours, revert to normal thresholds:
- **UptimeRobot:** Back to 2 minutes / 1 minute
- **Sentry:** Back to 10 errors / 5 errors
- **Performance:** Back to 5000ms limit

---

## 6. Alert Testing

### **Before Launch - Test All Alerts**

#### **UptimeRobot Testing**
1. Pause each monitor for 5 minutes
2. Verify email alerts received
3. Check alert timing and message content
4. Re-enable all monitors

#### **Sentry Testing**
1. Add intentional error to test endpoint
2. Trigger multiple errors quickly
3. Verify alert emails received
4. Remove test error code

#### **Test Commands:**
```bash
# Trigger test error (remove after testing)
curl https://your-domain.com/api/test-error

# Check health endpoints work
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/db
```

---

## 7. Mobile Alert Setup (Optional)

### **SMS Alerts via Phone**
If you have mobile carrier email-to-SMS:
- **AT&T:** your-number@txt.att.net
- **Verizon:** your-number@vtext.com
- **T-Mobile:** your-number@tmomail.net
- **Sprint:** your-number@messaging.sprintpcs.com

Add these as additional alert contacts in UptimeRobot and Sentry.

### **Push Notifications**
1. Install **UptimeRobot mobile app**
2. Install **Sentry mobile app**
3. Enable push notifications for critical alerts

---

## 8. Alert Escalation Schedule

### **Launch Day On-Call Schedule**

**Hour 0-6 (Critical Period):**
- **Response Time:** 2 minutes
- **Monitoring:** Continuous dashboard watching
- **Escalation:** Immediate action on any alert

**Hour 6-24 (Monitoring Period):**
- **Response Time:** 15 minutes
- **Monitoring:** Hourly dashboard checks
- **Escalation:** Document and track patterns

**Day 1-7 (Stabilization Period):**
- **Response Time:** 1 hour
- **Monitoring:** 3x daily checks
- **Escalation:** Weekly trend analysis

---

## Quick Reference: Alert Priority Matrix

| Alert Type | Response Time | Action Required |
|------------|---------------|----------------|
| Database Down | Immediate | Stop all traffic, investigate |
| Site Down | 2 minutes | Check infrastructure |
| Error Spike | 5 minutes | Review error details |
| Performance Slow | 15 minutes | Monitor trends |
| Traffic Drop | 1 hour | Investigate cause |

---

**⚠️ Important:** Test all alert configurations 1 hour before launch to ensure they're working correctly!