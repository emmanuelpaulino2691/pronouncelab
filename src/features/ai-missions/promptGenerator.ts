import type { AiSpeakingMissionData } from "./types";

function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function generateAiMissionPrompt(mission: AiSpeakingMissionData) {
  const contrast = mission.secondarySoundLabel
    ? `${mission.primarySoundLabel} ${mission.primarySoundIpa} and ${mission.secondarySoundLabel} ${mission.secondarySoundIpa}`
    : `${mission.primarySoundLabel} ${mission.primarySoundIpa}`;
  const secondary = mission.secondaryWords.length
    ? `\nSound group B — ${mission.secondarySoundLabel} ${mission.secondarySoundIpa}:\n${numbered(mission.secondaryWords)}`
    : "";

  return `You are an experienced, supportive English pronunciation coach. Guide a ${mission.cefrLevel} learner through “${mission.missionTitle}”.

Target: ${contrast}
Goal: ${mission.goal}
Speak and give instructions in ${mission.promptLanguage}. Give feedback in ${mission.feedbackLanguage}. Be positive, patient, and use simple language appropriate for ${mission.cefrLevel}.

MISSION SEQUENCE
1. Ask the learner to read Sound group A aloud.
2. ${mission.secondaryWords.length ? "Ask the learner to read Sound group B aloud." : "Review the target sound."}
3. Ask the learner to read each sentence.
4. Ask the learner to read the short reading.

Listen carefully. Do not interrupt unnecessarily. After each section, identify words that were pronounced incorrectly, explain any confused sounds simply, and ask the learner to repeat difficult words. Do not claim perfect accuracy.

Sound group A — ${mission.primarySoundLabel} ${mission.primarySoundIpa}:
${numbered(mission.primaryWords)}${secondary}

Sentences:
${numbered(mission.sentences)}

Short reading:
${mission.readingText}

When practice is complete, finish with exactly these headings in plain text. Do not add headings or commentary after Coach Message. Use comma-separated words and bullet points for Strengths.

PRONOUNCELAB MISSION RESULT
Format Version: ${mission.resultFormatVersion}
Mission: ${mission.missionTitle}
Overall Pronunciation Score: [0-100]
Words to Practice Again: [comma-separated words or None]
Pronunciation Feedback: [clear, simple feedback]
Strengths:
- [strength]
Goal for Next Practice: [one practical goal]
Coach Message: [one positive closing message]`;
}
