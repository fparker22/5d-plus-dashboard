#!/usr/bin/env python3
"""
Create a client business in the Follow-Up Machine through its agency API.

The new business gets the full starter kit (messages and sequences) and starts
in onboarding with autopilot off, so nothing is sent until the owner approves.

Usage:
  python provision_followup_client.py --name "Acme Plumbing" --plan growth --owner "Sam Lee" --dry-run
  python provision_followup_client.py --name "Acme Plumbing" --plan growth --owner "Sam Lee" \
      --owner-email sam@acme.example --industry plumbing --booking-url https://cal.example/acme
  python provision_followup_client.py --config client.json      # same fields as JSON
  python provision_followup_client.py --list                    # show existing businesses

Environment (execution/.env):
  FOLLOWUP_APP_URL   Base address of the deployed app, e.g. https://app.youragency.com
  AGENCY_API_KEY     Must match AGENCY_API_KEY on the server
"""

import argparse
import json
import os
import sys

import requests
from dotenv import load_dotenv

load_dotenv()

APP_URL = os.getenv("FOLLOWUP_APP_URL", "http://localhost:3000").rstrip("/")
API_KEY = os.getenv("AGENCY_API_KEY", "")
PLANS = ("starter", "growth", "premium")


def headers() -> dict:
    """Bearer auth when a key is configured (a local dev server needs none)."""
    return {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}


def list_businesses() -> None:
    resp = requests.get(f"{APP_URL}/api/agency/tenants", headers=headers(), timeout=20)
    resp.raise_for_status()
    for t in resp.json()["tenants"]:
        print(f"{t['slug']:<28} {t['plan']:<8} {t['status']:<11} {t['name']}")


def build_payload(args: argparse.Namespace) -> dict:
    """Merge a JSON config file (if given) with command-line flags; flags win."""
    payload: dict = {}
    if args.config:
        with open(args.config, encoding="utf-8") as f:
            payload = json.load(f)
    flags = {
        "name": args.name,
        "plan": args.plan,
        "industry": args.industry,
        "ownerName": args.owner,
        "ownerEmail": args.owner_email,
        "phone": args.phone,
        "bookingUrl": args.booking_url,
        "reviewUrl": args.review_url,
    }
    payload.update({k: v for k, v in flags.items() if v})
    if args.services:
        payload["services"] = [s.strip() for s in args.services.split(",") if s.strip()]
    if args.facts_file:
        with open(args.facts_file, encoding="utf-8") as f:
            payload["knowledgeBase"] = f.read().strip()
    return payload


def main() -> None:
    p = argparse.ArgumentParser(description="Provision a Follow-Up Machine client.")
    p.add_argument("--name", help="Business name")
    p.add_argument("--plan", choices=PLANS, help="Plan (default: starter)")
    p.add_argument("--industry", help='Kind of business, e.g. "plumbing"')
    p.add_argument("--owner", help="Owner's name")
    p.add_argument("--owner-email", help="Owner's email")
    p.add_argument("--phone", help="Business line in E.164, e.g. +15175550142")
    p.add_argument("--booking-url", help="Scheduling link")
    p.add_argument("--review-url", help="Review link")
    p.add_argument("--services", help="Comma-separated list of services")
    p.add_argument("--facts-file", help="Text file with the fact sheet (hours, prices, policies)")
    p.add_argument("--config", help="JSON file with any of the fields above")
    p.add_argument("--dry-run", action="store_true", help="Show what would be created; change nothing")
    p.add_argument("--list", action="store_true", help="List existing businesses and exit")
    args = p.parse_args()

    if args.list:
        list_businesses()
        return

    payload = build_payload(args)
    if not payload.get("name"):
        sys.exit("ERROR: a business name is required (--name or in --config).")
    if payload.get("plan") and payload["plan"] not in PLANS:
        sys.exit(f"ERROR: plan must be one of {', '.join(PLANS)}.")

    if args.dry_run:
        print(f"DRY RUN — would create this business on {APP_URL}:")
        print(json.dumps(payload, indent=2))
        return

    resp = requests.post(f"{APP_URL}/api/agency/tenants", json=payload, headers=headers(), timeout=30)
    if resp.status_code == 401:
        sys.exit("ERROR: unauthorized. AGENCY_API_KEY here must match the one on the server.")
    if not resp.ok:
        sys.exit(f"ERROR: {resp.status_code} {resp.text[:300]}")

    tenant = resp.json()["tenant"]
    print(f"Created {payload['name']}")
    print(f"  slug:      {tenant['slug']}")
    print(f"  lead form: {APP_URL}{tenant['leadFormPath']}")
    print("  status:    onboarding, autopilot off")
    print("Next: write the fact sheet in Settings (see directives/onboard_followup_client.md).")


if __name__ == "__main__":
    main()
