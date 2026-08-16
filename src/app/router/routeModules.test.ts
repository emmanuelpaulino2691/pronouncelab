import { describe, expect, it } from "vitest";
import { routeModuleLoaders } from "./routeModules";

describe("route module boundaries", () => {
  it("keeps major admin areas behind distinct lazy loaders", () => {
    const majorAdminRoutes = ["adminDashboard", "courseWorkspace", "lessonStudio", "classes", "mediaLibrary", "previewCourse", "previewLesson"] as const;
    expect(majorAdminRoutes.every((route) => typeof routeModuleLoaders[route] === "function")).toBe(true);
    expect(new Set(majorAdminRoutes.map((route) => routeModuleLoaders[route])).size).toBe(majorAdminRoutes.length);
  });
  it("keeps the Supabase-backed admin protection boundary out of the entry graph", () => {
    expect(typeof routeModuleLoaders.adminRoute).toBe("function");
    expect(routeModuleLoaders.adminRoute).not.toBe(routeModuleLoaders.adminLayout);
  });
  it("preserves distinct learner route loaders", () => {
    expect(new Set([routeModuleLoaders.dashboard, routeModuleLoaders.courses, routeModuleLoaders.progress, routeModuleLoaders.lesson]).size).toBe(4);
  });
});
