type Course = {
  id: number;
  title: string;
  level: string;
  units: number;
  emoji: string;
};

export const courses: Course[] = [
  {
    id: 1,
    title: "American English",
    level: "Beginner",
    units: 24,
    emoji: "🇺🇸",
  },
  {
    id: 2,
    title: "British English",
    level: "Intermediate",
    units: 18,
    emoji: "🇬🇧",
  },
  {
    id: 3,
    title: "IPA Mastery",
    level: "Advanced",
    units: 12,
    emoji: "🎤",
  },
];