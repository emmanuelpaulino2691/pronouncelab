# Sprint 33 Student Experience

PronounceLab uses one activity per screen. This builds on the existing Lesson Player and activity registry rather than introducing another rendering system.

An activity is completed only when the learner selects **Complete Activity** or **Complete Lesson**. Listening, practice, and quiz steps require their existing in-session submissions first. Rendering an activity never marks it complete. The AI Speaking Mission remains optional for navigation because its external result is not a trustworthy completion requirement in the current product.

Lesson position, completed activity indices, and lesson completion are stored in validated `localStorage` records. They are device-local, unauthenticated, and not synchronized with a PronounceLab account. Corrupt indices and references to removed activities are discarded. Restart clears only the selected lesson’s local state; Review returns to the first activity while retaining completion indicators.

Refresh restores the validated activity position. Existing `/lessons/:lessonId` links remain unchanged, so no additional route state or redirect behavior is required.

Future account progress can replace the local storage adapter after learner identity, enrollment, attempt records, and suitable RLS exist. Scores, streaks, XP, badges, and AI feedback are intentionally absent from the lesson completion summary unless backed by a genuine future progress model.
