# Discord Feedback System Setup Guide

## Overview

KwizMe now uses Discord webhooks as the primary feedback system for better reliability and instant notifications! This guide will help you set up a Discord webhook to receive user feedback.

## Why Discord Webhooks?

✅ **Instant notifications** - See feedback immediately
✅ **100% reliable** - Discord has excellent uptime
✅ **Free** - No costs or service limits
✅ **Rich formatting** - Beautiful embeds with colors and emojis
✅ **Organized** - Easy to manage in dedicated channels

## Step 1: Create a Discord Server (if needed)

If you don't have a Discord server:
1. Open Discord (desktop app or web)
2. Click the "+" icon in the server list
3. Choose "Create My Own"
4. Name it "KwizMe Feedback" or similar

## Step 2: Create a Feedback Channel

1. Right-click in your server
2. Select "Create Channel"
3. Choose "Text Channel"
4. Name it `#feedback` or `#kwizme-feedback`

## Step 3: Create a Webhook

1. **Right-click** on your feedback channel
2. Select **"Edit Channel"**
3. Go to **"Integrations"** tab
4. Click **"Create Webhook"**
5. **Configure the webhook:**
   - **Name:** `KwizMe Feedback Bot`
   - **Avatar:** Upload a custom image (optional)
   - **Channel:** Make sure it's your feedback channel

## Step 4: Copy the Webhook URL

1. In the webhook settings, click **"Copy Webhook URL"**
2. The URL will look like:
   ```
   https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz
   ```

## Step 5: Configure Environment Variable

Add the webhook URL to your environment variables:

### Local Development (.env.local):
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### Production (Vercel):
1. Go to your Vercel dashboard
2. Select your KwizMe project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `DISCORD_WEBHOOK_URL`
   - **Value:** Your copied webhook URL
   - **Environment:** Production (and Preview if desired)

## Step 6: Test the System

1. Deploy your changes or restart your local server
2. Go to your KwizMe feedback form
3. Submit test feedback
4. Check your Discord channel for the message!

## What You'll See

When users submit feedback, you'll get beautiful Discord embeds with:

🎯 **Rich Information:**
- ⭐ Star rating with visual stars
- 📂 Feedback type (bug, suggestion, etc.)
- 👤 User email (if provided) or "Anonymous"
- 💬 Full feedback text
- 🕒 Timestamp

🎨 **Color Coding:**
- 🟢 Green: 5-star feedback
- 🟡 Yellow: 3-star feedback
- 🔴 Red: 1-2 star feedback

## Example Discord Message

```
🎯 New KwizMe Feedback
★★★★★ Rating: 5/5 stars
📂 Type: Suggestion
👤 Contact: user@example.com
💬 Feedback: Love the app! Could you add dark mode support?
Submitted 12/7/2024, 3:45:23 PM | KwizMe Feedback System
```

## Benefits Over Email

- **Instant notifications** (no email delays)
- **Always works** (no email delivery issues)
- **Better organization** (threads, reactions, searches)
- **Team collaboration** (multiple people can see feedback)
- **Mobile notifications** (Discord mobile app)

## Fallback System

If Discord webhook fails (extremely rare), the system will:
1. Log the feedback to server console
2. Still return success to user
3. You can implement database storage if needed

## Security Notes

- ✅ Webhook URLs are safe to use in environment variables
- ✅ Only your server can send messages to the webhook
- ✅ No Discord bot tokens or sensitive permissions needed
- ✅ Users can't directly access your Discord server

## Troubleshooting

### Webhook Not Working?
1. Double-check the webhook URL in environment variables
2. Make sure the Discord channel still exists
3. Verify the webhook hasn't been deleted
4. Check server logs for error messages

### Not Receiving Messages?
1. Check Discord notification settings
2. Ensure you're in the correct channel
3. Verify the webhook is pointing to the right channel

### Testing Locally?
```bash
# Test with curl
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message from KwizMe!"}'
```

---

**You're all set! Your feedback system is now more reliable and user-friendly.** 🚀

Need help? Check the server logs or test the webhook directly with curl commands above.