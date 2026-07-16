export const CATEGORIES = [
  { id: "all",       emoji: "⭐", label: "All",        color: "#A1A1AA", bg: "#2A2A2E" },
  { id: "workplace", emoji: "💼", label: "Workplace",  color: "#1CB0F6", bg: "#0D2233" },
  { id: "smalltalk", emoji: "☕", label: "Small Talk", color: "#58CC02", bg: "#0D2210" },
  { id: "travel",    emoji: "✈️", label: "Travel",     color: "#CE82FF", bg: "#22123A" },
  { id: "emotions",  emoji: "❤️", label: "Emotions",   color: "#FF4B4B", bg: "#2A0D0D" },
  { id: "random",    emoji: "🎲", label: "Random",     color: "#FF9600", bg: "#2A1A00" },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];