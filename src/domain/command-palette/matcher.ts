import type { Command, CommandResult } from "./types";

function normalize(value: string) { return value.trim().toLocaleLowerCase(); }

export function matchCommands(commands: readonly Command[], query: string, recentIds: readonly string[] = []): CommandResult[] {
  const needle = normalize(query);
  return commands.flatMap((command, stableIndex) => {
    const fields = [command.title, ...(command.keywords ?? [])];
    const titleStart = command.title.toLocaleLowerCase().indexOf(needle);
    const kind = !needle ? 1
      : fields.some((field) => normalize(field) === needle) ? 400
      : fields.some((field) => normalize(field).startsWith(needle)) ? 300
      : fields.some((field) => normalize(field).includes(needle)) ? 200
      : 0;
    if (kind === 0) return [];
    const recentIndex = recentIds.indexOf(command.id);
    const recentBoost = recentIndex < 0 ? 0 : Math.max(1, 20 - recentIndex);
    return [{ ...command, score: kind + recentBoost, matchStart: titleStart < 0 ? 0 : titleStart, matchLength: titleStart < 0 ? 0 : needle.length, stableIndex }];
  }).sort((a, b) => b.score - a.score || a.stableIndex - b.stableIndex).map((item) => ({ id: item.id, category: item.category, title: item.title, subtitle: item.subtitle, keywords: item.keywords, href: item.href, eventName: item.eventName, available: item.available, unavailableReason: item.unavailableReason, score: item.score, matchStart: item.matchStart, matchLength: item.matchLength }));
}
