#!/usr/bin/env python3
"""
Send SMS reminders to Grace's graduation open house RSVPs via Twilio.

Fetches submissions from Netlify Forms, filters for "yes" attendees
with phone numbers, and sends a customizable reminder message.

Usage:
  python send_sms_reminders.py --message "day-before"
  python send_sms_reminders.py --message "day-of"
  python send_sms_reminders.py --message "custom" --text "Your custom message here"
  python send_sms_reminders.py --dry-run        # Preview recipients, don't send
"""

import os
import sys
import json
import time
import argparse
import re
import requests
from dotenv import load_dotenv

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

TWILIO_ACCOUNT_SID  = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN   = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER  = os.getenv("TWILIO_FROM_NUMBER")   # E.164 format: +15551234567

NETLIFY_TOKEN       = os.getenv("NETLIFY_TOKEN")         # Personal access token
NETLIFY_SITE_ID     = os.getenv("NETLIFY_SITE_ID")       # Site ID or name (e.g. graceparker.life)
NETLIFY_FORM_NAME   = os.getenv("NETLIFY_FORM_NAME", "grace-rsvp")

EVENT_DETAILS = "June 6th, 3–7 PM · The City Center Building, 145 West Cortland St, Jackson, MI"

MESSAGES = {
    "day-before": (
        "Hi {name}! 🎓 Just a reminder — Grace Parker's Graduation Open House is TOMORROW! "
        "{event}. We can't wait to celebrate with you! – The Parker Family"
    ),
    "day-of": (
        "Hi {name}! 🎉 TODAY is the day! Grace's Graduation Open House starts at 3 PM. "
        "{event}. See you soon! – The Parker Family"
    ),
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def normalize_phone(raw: str) -> str | None:
    """Strip formatting and return E.164 US number, or None if unparseable."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    return None


def fetch_rsvps() -> list[dict]:
    """Pull all submissions from Netlify Forms for grace-rsvp."""
    if not NETLIFY_TOKEN or not NETLIFY_SITE_ID:
        sys.exit("ERROR: NETLIFY_TOKEN and NETLIFY_SITE_ID must be set in .env")

    # First find the form ID
    headers = {"Authorization": f"Bearer {NETLIFY_TOKEN}"}
    forms_url = f"https://api.netlify.com/api/v1/sites/{NETLIFY_SITE_ID}/forms"
    resp = requests.get(forms_url, headers=headers, timeout=15)
    resp.raise_for_status()

    form_id = None
    for form in resp.json():
        if form.get("name") == NETLIFY_FORM_NAME:
            form_id = form["id"]
            break

    if not form_id:
        sys.exit(f"ERROR: Form '{NETLIFY_FORM_NAME}' not found on site {NETLIFY_SITE_ID}")

    # Fetch all submissions (paginate if needed)
    submissions = []
    page = 1
    while True:
        url = f"https://api.netlify.com/api/v1/forms/{form_id}/submissions?page={page}&per_page=100"
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        submissions.extend(batch)
        if len(batch) < 100:
            break
        page += 1

    return submissions


def extract_recipients(submissions: list[dict]) -> list[dict]:
    """Return list of {name, phone} for confirmed attendees with valid phone numbers."""
    recipients = []
    seen_phones = set()

    for sub in submissions:
        data = sub.get("data", {})

        attending = str(data.get("attending", "")).lower()
        if attending != "yes":
            continue

        raw_phone = str(data.get("phone", "")).strip()
        if not raw_phone:
            continue

        phone = normalize_phone(raw_phone)
        if not phone or phone in seen_phones:
            continue

        first = str(data.get("first-name", "")).strip()
        last  = str(data.get("last-name", "")).strip()
        name  = (first or "Friend").split()[0]  # Use first name only in the text

        seen_phones.add(phone)
        recipients.append({"name": name, "phone": phone, "full_name": f"{first} {last}".strip()})

    return recipients


def send_sms(to: str, body: str) -> dict:
    """Send a single SMS via Twilio REST API."""
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER]):
        sys.exit("ERROR: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER must be set in .env")

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    resp = requests.post(
        url,
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
        data={"From": TWILIO_FROM_NUMBER, "To": to, "Body": body},
        timeout=15,
    )
    return resp.json()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Send graduation reminder SMS to RSVPs")
    parser.add_argument("--message", choices=["day-before", "day-of", "custom"], default="day-before")
    parser.add_argument("--text", help="Custom message body (use {name} and {event} as placeholders)")
    parser.add_argument("--dry-run", action="store_true", help="Preview recipients and message without sending")
    args = parser.parse_args()

    if args.message == "custom" and not args.text:
        sys.exit("ERROR: --text is required when --message is 'custom'")

    template = args.text if args.message == "custom" else MESSAGES[args.message]

    print("Fetching RSVPs from Netlify Forms…")
    submissions = fetch_rsvps()
    print(f"  Found {len(submissions)} total submissions")

    recipients = extract_recipients(submissions)
    print(f"  {len(recipients)} confirmed attendees with phone numbers\n")

    if not recipients:
        print("No recipients found. Make sure guests filled in the phone field and selected 'Yes'.")
        return

    # Preview message
    sample_msg = template.format(name="[Name]", event=EVENT_DETAILS)
    print(f"Message preview:\n  {sample_msg}\n")

    if args.dry_run:
        print("DRY RUN — recipients who would receive this message:")
        for r in recipients:
            print(f"  {r['full_name']:<30} {r['phone']}")
        print(f"\nTotal: {len(recipients)} messages")
        return

    # Send
    sent = 0
    failed = 0
    for r in recipients:
        body = template.format(name=r["name"], event=EVENT_DETAILS)
        result = send_sms(r["phone"], body)

        sid    = result.get("sid")
        status = result.get("status", "unknown")
        error  = result.get("message")

        if sid and status not in ("failed", "undelivered"):
            print(f"  ✓ {r['full_name']:<30} {r['phone']}  [{status}]")
            sent += 1
        else:
            print(f"  ✗ {r['full_name']:<30} {r['phone']}  ERROR: {error}")
            failed += 1

        time.sleep(0.1)  # Avoid rate limits

    print(f"\nDone. {sent} sent, {failed} failed.")


if __name__ == "__main__":
    main()
