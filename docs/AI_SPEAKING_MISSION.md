# AI Speaking Mission

## Contents

- [Decision](#decision)
- [Structured model](#structured-model)
- [Prompt generation](#prompt-generation)
- [Result contract and parser](#result-contract-and-parser)
- [Authoring workflow](#authoring-workflow)
- [Learner workflow](#learner-workflow)
- [Security and privacy](#security-and-privacy)
- [Known limitations](#known-limitations)
- [Future journal](#future-journal)

## Decision

AI Speaking Mission is a distinct `ai_speaking_mission` activity type, not a pronunciation-item configuration. It has a one-to-one `ai_speaking_missions` row keyed by `activity_id`, with structured configuration stored as JSONB.

The mission is a short final challenge after extensive in-platform practice. PronounceLab generates a prompt for an external ChatGPT or Gemini voice session. It does not integrate either API.

Reasons:

- no browser AI key or server AI billing surface;
- learners can inspect the complete prompt and result;
- no learner audio is sent to PronounceLab;
- the domain remains provider-neutral enough to evolve;
- a distinct activity can have its own editor, renderer, validation, and future result persistence.

See [ADR 0004](ADR/0004-ai-speaking-mission.md).

## Structured model

`AiSpeakingMissionData` contains:

- mission identity: title, optional label, result format version;
- audience: CEFR level and optional difficulty;
- goal and estimated duration;
- primary sound label/IPA and required word array;
- optional secondary sound label/IPA and word array;
- sentence array and reading text;
- supported providers (`ChatGPT`, `Gemini`);
- prompt and feedback languages;
- optional teacher and student instructions.

The prompt is derived from this source of truth. It is never stored as the only mission representation.

The learner-facing `AiSpeakingMission` shape adds `activityId`. `ActivityRenderer` passes the current activity, and `findAiMissionForActivity` resolves the matching configuration. Multiple AI mission activities therefore do not depend on array position.

Defaults target A1, 8–10 minutes, 10 + 10 contrast words, 2–3 sentences, and one short reading. Recommendations are not all hard limits.

## Prompt generation

`src/features/ai-missions/promptGenerator.ts` is a pure typed generator. It:

- assigns an experienced, supportive pronunciation-coach role;
- states CEFR level, target sound/contrast, and language preferences;
- embeds the words, sentences, and reading once;
- asks the coach to listen patiently and avoid needless interruption;
- requests simple correction, repetition, strengths, and a next goal;
- requires a stable plain-text final result.

No network call, secret, or runtime AI SDK is involved.

## Result contract and parser

Format version 1 uses:

```text
PRONOUNCELAB MISSION RESULT
Format Version: 1
Mission:
Overall Pronunciation Score:
Words to Practice Again:
Pronunciation Feedback:
Strengths:
Goal for Next Practice:
Coach Message:
```

`resultParser.ts` accepts LF/CRLF, case-insensitive headings, whitespace, and common bullet markers. It returns typed values and warnings for missing sections, cleans list values, limits input to 20,000 characters, and never interprets HTML. Duplicate recognized headings preserve the first section and produce a warning.

The only accepted score forms are a whole number, a whole-number percent, or a whole number over 100—for example `85`, `85%`, or `85/100`. Extra or conflicting text is rejected. The displayed result explicitly says external feedback and the score are not authoritative.

## Authoring workflow

Lesson Studio lazy-loads `AiSpeakingMissionEditor`. The editor provides:

- basics and sound-focus fields;
- list controls with multi-value paste and reorder;
- reading counts;
- provider/language configuration;
- prompt preview and clipboard copy;
- learner-card preview;
- explicit save and read-only behavior.

Creation uses the dedicated `create_draft_ai_speaking_mission` RPC so activity metadata and configuration are inserted in one transaction. Duplication uses a matching dedicated RPC. Generic AI activity creation is rejected by the database creation guard, and authenticated clients no longer receive direct activity-insert privileges.

Mission saves use `save_draft_ai_speaking_mission` with the loaded `updated_at` value. The function acquires the hierarchy gate, revalidates the full draft hierarchy, locks the mission and its parents, then compares the revision. Mission revisions use `clock_timestamp()` so separate successful writes receive a new concurrency token even inside one transaction. A stale save raises a conflict without changing data; the editor reloads the authoritative mission.

## Learner workflow

1. Read the mission, goal, sound focus, counts, and provider choices.
2. Copy the generated prompt using the Clipboard API or safe text-area fallback.
3. Open an external supported voice experience manually and practice.
4. Copy the final structured text back into PronounceLab.
5. Parse it, inspect warnings and preview cards, then explicitly confirm.

Confirmation remains component state only. It does not create progress, an attempt, or a journal entry. The Lesson Player does not require an AI result before navigation.

## Security and privacy

- No service role or AI credential is present in browser code.
- PronounceLab does not automatically open an external provider.
- Pasted text is rendered as React text; no raw HTML is executed.
- Raw AI results are not put in localStorage.
- The UI does not claim precise pronunciation assessment.
- Future persistence must define learner identity, consent, retention, RLS, and deletion.

## Known limitations

- Migration 009 contains the database hardening contract but is not applied by this sprint task.
- AI result confirmation remains component state only.
- The parser can validate structure, not the truth or quality of external feedback.
- No browser UI or disposable-database integration tests are configured.
- Native AI, audio assessment, and provider APIs remain intentionally absent.

## Future journal

`AiMissionJournalEntry` prepares a future domain shape for mission, lesson, course, student, provider, parsed feedback, raw result, score, and timestamp.

**Not implemented:** database table, learner identity binding, RLS, submission service, history UI, analytics, or synchronized progress. See [Roadmap](ROADMAP.md).
