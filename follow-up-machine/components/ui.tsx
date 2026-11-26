import {
  Bell,
  CalendarCheck,
  Mail,
  MessageSquare,
  NotebookPen,
  Phone,
  PhoneMissed,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { agentName } from "@/lib/agents";
import { timeAgo } from "@/lib/metrics";
import { JOURNEY, stageLabel, type Activity, type ActivityStatus, type StageId } from "@/lib/types";

export function PageHeader({ title, lead, children }: { title: string; lead?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {lead && <p className="mt-1.5 text-muted">{lead}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

const STAGE_STYLE: Record<StageId, string> = {
  new: "bg-bell-soft text-bell-deep",
  contacted: "bg-spruce-50 text-spruce-700",
  engaged: "bg-spruce-100 text-spruce-900",
  booked: "bg-spruce-700 text-white",
  won: "bg-spruce-950 text-white",
  nurture: "bg-fog text-muted ring-1 ring-inset ring-line",
  lost: "bg-fog text-muted",
};

export function StagePill({ stage }: { stage: StageId }) {
  return <span className={`pill ${STAGE_STYLE[stage]}`}>{stageLabel(stage)}</span>;
}

const STATUS: Partial<Record<ActivityStatus, { label: string; style: string }>> = {
  simulated: { label: "Test mode", style: "bg-fog text-muted" },
  pending_approval: { label: "Needs your OK", style: "bg-bell-soft text-bell-deep" },
  failed: { label: "Failed", style: "bg-alert-soft text-alert" },
  skipped: { label: "Not sent", style: "bg-fog text-muted" },
};

export function StatusPill({ status }: { status: ActivityStatus }) {
  const s = STATUS[status];
  return s ? <span className={`pill ${s.style}`}>{s.label}</span> : null;
}

export function ActivityIcon({ type, agent }: { type: Activity["type"]; agent?: string }) {
  const cls = "h-4 w-4";
  if (agent === "compliance") return <ShieldCheck className={cls} />;
  switch (type) {
    case "sms_in":
    case "sms_out":
      return <MessageSquare className={cls} />;
    case "email_in":
    case "email_out":
      return <Mail className={cls} />;
    case "call_in":
    case "call_out":
      return <Phone className={cls} />;
    case "missed_call":
      return <PhoneMissed className={cls} />;
    case "appointment":
      return <CalendarCheck className={cls} />;
    case "review":
      return <Star className={cls} />;
    case "stage_change":
      return <Waypoints className={cls} />;
    case "lead_created":
      return <UserPlus className={cls} />;
    case "note":
      return <NotebookPen className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

/** One line of history. Inbound items sit on a tinted ground so replies stand out. */
export function ActivityRow({ a, who, href }: { a: Activity; who?: string; href?: string }) {
  const inbound = a.type.endsWith("_in") || a.type === "missed_call" || a.type === "review";
  return (
    <li className="flex gap-3 px-5 py-3">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${inbound ? "bg-bell-soft text-bell-deep" : "bg-spruce-50 text-spruce-700"}`}>
        <ActivityIcon type={a.type} agent={a.agent} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {who && (href ? <Link href={href} className="font-medium hover:underline">{who}</Link> : <span className="font-medium">{who}</span>)}
          <span className={who ? "text-muted" : "font-medium"}>{a.summary}</span>
          <StatusPill status={a.status} />
        </div>
        {a.body && <p className="mt-0.5 line-clamp-3 whitespace-pre-line text-sm text-muted">{a.subject ? `${a.subject} — ` : ""}{a.body}</p>}
        <p className="mt-0.5 text-xs text-muted">
          {agentName(a.agent)}, {timeAgo(a.createdAt)}
        </p>
      </div>
    </li>
  );
}

/**
 * The line: the journey every contact travels, drawn as a route with five
 * stations. With `counts` it shows how many people reached each station; with
 * `current` it shows where one person is.
 */
export function JourneyLine({ counts, current }: { counts?: number[]; current?: StageId }) {
  const at = current ? (current === "nurture" || current === "lost" ? -1 : JOURNEY.indexOf(current)) : -1;
  return (
    <ol className="relative grid grid-cols-5">
      <span aria-hidden className="absolute left-[10%] right-[10%] top-[calc(100%-2.1rem)] sm:top-[calc(100%-2.35rem)] h-0.5 bg-spruce-200" />
      {JOURNEY.map((stage, i) => {
        const reachedByContact = current !== undefined && at >= i;
        const prev = counts && i > 0 ? counts[i - 1] : 0;
        const rate = counts && i > 0 && prev > 0 ? Math.round((counts[i] / prev) * 100) : null;
        return (
          <li key={stage} className="relative flex flex-col items-center text-center">
            {counts && (
              <>
                <span className="display text-3xl font-semibold tabular-nums sm:text-4xl">{counts[i]}</span>
                <span className="h-5 text-xs text-muted">{rate !== null ? <>{rate}%<span className="hidden sm:inline"> of previous</span></> : ""}</span>
              </>
            )}
            <span
              className={`relative z-10 mt-2 h-4 w-4 rounded-full border-2 ${
                counts || reachedByContact ? "border-spruce-900 bg-spruce-900" : "border-spruce-200 bg-paper"
              } ${current !== undefined && at === i ? "ring-4 ring-bell" : ""}`}
            />
            <span className={`mt-2 text-xs sm:text-sm ${current !== undefined && at === i ? "font-semibold" : "text-muted"}`}>{stageLabel(stage)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function NeedsYou({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="pill bg-bell text-spruce-950">
      <Bell className="h-3 w-3" />
      {count}
    </span>
  );
}

export function Locked({ feature, plan }: { feature: string; plan: string }) {
  return (
    <div className="panel px-6 py-10 text-center">
      <h2 className="text-xl font-semibold">{feature} is part of {plan}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">This business is on a plan that doesn&rsquo;t include it yet. Change the plan from the Agency page to turn it on.</p>
      <Link href="/agency" className="btn-primary mt-5">
        Open the Agency page
      </Link>
    </div>
  );
}
