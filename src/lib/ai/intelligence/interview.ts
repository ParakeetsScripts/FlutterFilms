import { trustBadge } from "../trust";

export const INTERVIEW_QUESTIONS = [
  { id: "mood", question: "How do you usually feel when you sit down to watch a movie?" },
  { id: "genres", question: "Which genres do you return to most — and which do you avoid?" },
  { id: "runtime", question: "Do you prefer short films, standard length, or epics?" },
  { id: "attention", question: "Are you multitasking or giving the film your full attention?" },
  { id: "era", question: "Which decades of cinema appeal to you most?" },
  { id: "language", question: "English only, or are you open to international films?" },
  { id: "intensity", question: "How much emotional intensity can you handle in one sitting?" },
  { id: "discovery", question: "Do you want familiar comfort or something that challenges you?" },
];

export type InterviewAnswers = Record<string, string>;

export function buildInterviewProfile(answers: InterviewAnswers) {
  const profile = {
    mood: answers.mood ?? "",
    genres: answers.genres ?? "",
    runtimePreference: answers.runtime ?? "",
    attention: answers.attention ?? "",
    decades: answers.era ?? "",
    languages: answers.language ?? "",
    intensity: answers.intensity ?? "",
    discoveryStyle: answers.discovery ?? "",
    summary: summarize(answers),
    createdAt: new Date().toISOString(),
    labels: [trustBadge("user"), trustBadge("ai_interpretation")],
  };
  return profile;
}

function summarize(answers: InterviewAnswers) {
  const parts = Object.values(answers).filter(Boolean);
  if (!parts.length) return "Complete the interview to generate your profile.";
  return `You tend toward ${answers.mood || "varied"} viewing, with ${answers.genres || "mixed genres"}, ${answers.runtime || "flexible runtime"}, and ${answers.discovery || "balanced"} discovery.`;
}
