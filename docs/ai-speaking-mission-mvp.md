# AI Speaking Mission MVP

PronounceLab lessons follow this learning sequence:

**Learn → Listen → Repeat → Word Practice → Minimal Pairs → Mixed Practice → Sentences → Reading → AI Mission → Quiz**

Most pronunciation practice stays inside PronounceLab. The AI Speaking Mission is a short final practice step that lets a learner use an external voice tool such as ChatGPT or Gemini. PronounceLab does not call, embed, or authenticate with either service.

For a typical contrast lesson, a mission contains:

- 10 words for sound group A
- 10 words for sound group B
- 2–3 sentences
- one short reading
- an estimated duration of 8–10 minutes

Mission content is stored as structured data. PronounceLab generates the external prompt deterministically and asks the external coach to finish with the stable `PRONOUNCELAB MISSION RESULT` plain-text format. The learner copies that result back into PronounceLab, where it is parsed and previewed as text only.

The MVP does not persist learner mission results. Confirmation applies only to the current browser session and does not create progress or assessment records. A future AI Progress Journal may securely store the provider, score, practice words, feedback, strengths, next goal, coach message, raw pasted result, parser format version, and submission timestamp after learner identity and attempt-level RLS are designed.

External AI feedback is guidance rather than an authoritative pronunciation assessment. Its quality depends on the provider, model behavior, microphone, environment, and audio conditions.
