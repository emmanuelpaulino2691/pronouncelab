export type CommandCategory = "Navigation" | "Course" | "Unit" | "Lesson" | "Activity" | "Template" | "Future command";

export type Command = {
  id: string;
  category: CommandCategory;
  title: string;
  subtitle?: string;
  keywords?: readonly string[];
  href?: string;
  eventName?: string;
  available: boolean;
  unavailableReason?: string;
};

export type CommandRegistry = readonly Command[];
export type CommandResult = Command & { score: number; matchStart: number; matchLength: number };
