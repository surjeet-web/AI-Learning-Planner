export function pad(n: number) {
  return n < 10 ? "0" + n : "" + n
}

function toICALDate(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  )
}

export function createICS(opts: {
  calendarName: string
  events: { uid: string; title: string; description?: string; start: Date; end: Date }[]
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Learning Planner//EN",
    `X-WR-CALNAME:${opts.calendarName}`,
  ]
  for (const ev of opts.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${toICALDate(new Date())}`,
      `DTSTART:${toICALDate(ev.start)}`,
      `DTEND:${toICALDate(ev.end)}`,
      `SUMMARY:${escapeText(ev.title)}`,
      `DESCRIPTION:${escapeText(ev.description || "")}`,
      "END:VEVENT",
    )
  }
  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

function escapeText(t: string) {
  return t.replace(/\\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}
