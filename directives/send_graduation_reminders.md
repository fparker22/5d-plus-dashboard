# Directive: Send Graduation SMS Reminders

## Goal
Send SMS reminder messages to all confirmed RSVPs for Grace Parker's Graduation Open House
(June 6th, 2026, 3–7 PM, City Center Building, Jackson, MI) using Twilio.

## Inputs
- Netlify Forms submissions for the `grace-rsvp` form on `graceparker.life`
- Twilio account credentials
- Timing preference: day-before or day-of reminder

## Tools / Scripts
- `execution/send_sms_reminders.py` — fetches RSVPs, filters confirmed attendees, sends SMS

## Prerequisites

### 1. .env file
Ensure these are set in `execution/.env` (copy from `.env.example`):
```
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
NETLIFY_TOKEN=xxx
NETLIFY_SITE_ID=graceparker.life
NETLIFY_FORM_NAME=grace-rsvp
```

**Get Netlify token:** https://app.netlify.com/user/applications → Personal access tokens → New access token
**Get Twilio credentials:** https://console.twilio.com → Account SID + Auth Token on dashboard

### 2. Dependencies
```bash
cd execution
pip install requests python-dotenv
```

## Sending Reminders

### Always dry-run first
```bash
cd execution
python send_sms_reminders.py --dry-run --message day-before
```
This shows you every recipient and the exact message without sending anything.

### Day-before reminder (run evening of June 5th)
```bash
python send_sms_reminders.py --message day-before
```
Message sent: *"Hi [Name]! 🎓 Just a reminder — Grace Parker's Graduation Open House is TOMORROW! June 6th, 3–7 PM · The City Center Building, 145 West Cortland St, Jackson, MI. We can't wait to celebrate with you! – The Parker Family"*

### Day-of reminder (run morning of June 6th)
```bash
python send_sms_reminders.py --message day-of
```

### Custom message
```bash
python send_sms_reminders.py --message custom --text "Hi {name}! Your custom message here. {event}"
```
Use `{name}` for first name and `{event}` for the event details.

## Who Gets a Message
- RSVP response = "yes" (attending)
- Phone number field was filled in
- Duplicate phone numbers are de-duped automatically
- Guests who said "can't make it" are excluded

## Limitations & Edge Cases
- Phone number is an optional field in the RSVP form — guests who didn't fill it in will not receive an SMS
- Twilio free trial only allows sending to verified numbers; upgrade to a paid account to message anyone
- Twilio charges ~$0.0079/message for US SMS (very cheap for a small guest list)
- The script paginates Netlify submissions 100 at a time — handles any number of RSVPs

## Learnings
- (Update this section as you discover API limits, errors, or edge cases)
