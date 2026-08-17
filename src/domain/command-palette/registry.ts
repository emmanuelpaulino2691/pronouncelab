import { activityTemplateRegistry } from "../templates";
import type { Command, CommandRegistry } from "./types";

export type CommandRegistryContext = { pathname: string; search: string; canEditDrafts: boolean; canPublish: boolean; canViewMediaLibrary: boolean };

const unavailable = "This command is not available until its backend workflow is connected.";

export function buildCommandRegistry(context: CommandRegistryContext): CommandRegistry {
  const commands: Command[] = [
    { id: "nav-dashboard", category: "Navigation", title: "Open Dashboard", keywords: ["overview", "home"], href: "/admin", available: true },
    { id: "nav-courses", category: "Navigation", title: "Open My Courses", keywords: ["courses", "curriculum"], href: "/admin/courses", available: true },
    { id: "nav-classes", category: "Navigation", title: "Open My Classes", keywords: ["classes"], href: "/admin/classes", available: true },
    { id: "nav-media", category: "Navigation", title: "Open Media Library", keywords: ["images", "audio", "files"], href: "/admin/media", available: context.canViewMediaLibrary, unavailableReason: "Your role does not have Media Library access." },
    { id: "future-publish", category: "Future command", title: "Publish Course", available: false, unavailableReason: unavailable },
    { id: "future-new-course", category: "Future command", title: "New Course", available: false, unavailableReason: unavailable },
    { id: "future-new-unit", category: "Future command", title: "New Unit", available: false, unavailableReason: unavailable },
    { id: "future-new-lesson", category: "Future command", title: "New Lesson", available: false, unavailableReason: unavailable },
    { id: "future-create-class", category: "Future command", title: "Create Class", available: false, unavailableReason: "Class creation is not connected to a backend yet." },
    ...activityTemplateRegistry.map<Command>((template) => ({ id: `template-${template.id}`, category: "Template", title: template.name, subtitle: `${template.learnerLevel} · ${template.duration}`, keywords: [template.activityType, template.category, ...template.tags], available: false, unavailableReason: "Open Lesson Studio to preview this template in Smart Content Builder." })),
  ];

  const course = context.pathname.match(/^\/admin\/courses\/(\d+)/)?.[1];
  const unit = context.pathname.match(/\/units\/(\d+)/)?.[1];
  const lesson = context.pathname.match(/\/lessons\/(\d+)/)?.[1];
  const activity = new URLSearchParams(context.search).get("activity");
  if (course) commands.push({ id: `course-${course}`, category: "Course", title: "Open current Course Workspace", subtitle: `Course ${course}`, href: `/admin/courses/${course}`, available: true });
  if (course && unit) commands.push({ id: `unit-${unit}`, category: "Unit", title: "Open current Unit lessons", subtitle: `Unit ${unit}`, href: `/admin/courses/${course}/units/${unit}`, available: true });
  if (course && unit && lesson) {
    const studioHref = `/admin/courses/${course}/units/${unit}/lessons/${lesson}/studio`;
    commands.push({ id: `lesson-${lesson}`, category: "Lesson", title: "Open current Lesson Studio", subtitle: `Lesson ${lesson}`, href: studioHref, available: true });
    commands.push({ id: `builder-${lesson}`, category: "Navigation", title: "Open Template Builder", keywords: ["smart content builder", "add activity"], href: `${studioHref}?builder=open${activity ? `&activity=${activity}` : ""}`, eventName: "pronouncelab:open-template-builder", available: context.canEditDrafts });
  }
  if (activity) commands.push({ id: `activity-${activity}`, category: "Activity", title: "Open current Activity", subtitle: `Activity ${activity}`, href: `${context.pathname}?activity=${activity}`, available: true });
  return commands;
}
