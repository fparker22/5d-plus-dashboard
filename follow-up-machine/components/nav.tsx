"use client";

import {
  Bot,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Settings,
  Star,
  Users,
  Waypoints,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GROUPS = [
  {
    name: "Front desk",
    items: [
      { href: "/app", label: "Today", icon: LayoutDashboard },
      { href: "/app/inbox", label: "Inbox", icon: Inbox, badge: "inbox" },
      { href: "/app/contacts", label: "Contacts", icon: Users },
      { href: "/app/pipeline", label: "Pipeline", icon: Waypoints },
      { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    name: "The team",
    items: [
      { href: "/app/agents", label: "Agents", icon: Bot },
      { href: "/app/automations", label: "Automations", icon: Workflow },
      { href: "/app/templates", label: "Messages", icon: MessagesSquare },
    ],
  },
  {
    name: "Growth",
    items: [
      { href: "/app/marketing", label: "Marketing", icon: Megaphone },
      { href: "/app/reviews", label: "Reviews", icon: Star },
    ],
  },
  { name: "Setup", items: [{ href: "/app/settings", label: "Settings", icon: Settings }] },
];

export function Nav({ inboxCount }: { inboxCount: number }) {
  const path = usePathname();
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-5 lg:overflow-visible lg:px-3 lg:pb-0">
      {GROUPS.map((group) => (
        <div key={group.name} className="flex gap-1 lg:block">
          <p className="mb-1 hidden px-3 text-xs text-spruce-200/70 lg:block">{group.name}</p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const on = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                  on ? "bg-white/12 font-semibold text-white" : "text-spruce-100 hover:bg-white/6"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge === "inbox" && inboxCount > 0 && (
                  <span className="ml-auto rounded-full bg-bell px-1.5 text-xs font-semibold text-spruce-950">{inboxCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
