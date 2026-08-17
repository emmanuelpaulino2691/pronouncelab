export type EmojiCatalogEntry = {
  emoji: string;
  label: string;
};

export const emojiCatalog = [
  { emoji: "📘", label: "Blue book" },
  { emoji: "📚", label: "Books" },
  { emoji: "🎓", label: "Graduation cap" },
  { emoji: "✏️", label: "Pencil" },
  { emoji: "📝", label: "Notes" },
  { emoji: "💬", label: "Conversation" },
  { emoji: "🗣️", label: "Speaking" },
  { emoji: "👂", label: "Listening" },
  { emoji: "🎧", label: "Headphones" },
  { emoji: "🎙️", label: "Microphone" },
  { emoji: "🔤", label: "Letters" },
  { emoji: "🔊", label: "Sound" },
  { emoji: "🌍", label: "World" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "💼", label: "Business" },
  { emoji: "🏫", label: "School" },
  { emoji: "🧠", label: "Learning" },
  { emoji: "💡", label: "Idea" },
  { emoji: "🎯", label: "Goal" },
  { emoji: "⭐", label: "Star" },
  { emoji: "🚀", label: "Progress" },
  { emoji: "🌱", label: "Growth" },
  { emoji: "🏆", label: "Achievement" },
  { emoji: "🤝", label: "Collaboration" },
  { emoji: "🎭", label: "Role play" },
  { emoji: "📰", label: "News" },
] as const satisfies readonly EmojiCatalogEntry[];
