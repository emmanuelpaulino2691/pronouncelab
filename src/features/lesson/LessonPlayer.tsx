import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ActivityRenderer from "../activities/shared/ActivityRenderer";
import { useLessonState } from "../../shared/hooks/useLessonState";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import type { LessonData } from "../../shared/types/LessonData";
import LessonNavigator from "./LessonNavigator";
import ActivityErrorBoundary from "./components/ActivityErrorBoundary";
import LessonHeader from "./components/LessonHeader";
import {
  calculateProgress, estimateRemainingMinutes, estimateTotalMinutes,
  getActivityDetails, getCompletionMessage,
} from "./studentExperience";

type Props = { lesson: LessonData; returnPath?: string; contextLabel?: string };
type TransitionState = { completedIndex: number; nextIndex: number } | null;

export default function LessonPlayer({ lesson, returnPath = "/courses", contextLabel }: Props) {
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
  const {
    progress: userProgress, startLesson, completeLesson,
    completeActivity: saveActivityProgress, resetLessonProgress,
  } = useUserProgress();
  const {
    state, previousActivity, completeActivity, goToActivity,
    restartLesson, reviewLesson, isLastActivity,
  } = useLessonState(lesson.id, activities.length);
  const [activityReadiness, setActivityReadiness] = useState<Record<number, boolean>>({});
  const [transition, setTransition] = useState<TransitionState>(null);
  const [showCompletion, setShowCompletion] = useState(
    () => userProgress.lessonsCompleted.includes(lesson.id)
  );

  useEffect(() => { startLesson(lesson.id); }, [lesson.id, startLesson]);

  const current = state.currentActivity;
  const activity = activities[current];
  const completedSet = useMemo(() => {
    const persisted = userProgress.activitiesCompleted.find((item) => item.lessonId === lesson.id)?.activities ?? [];
    return new Set([...state.completedActivities, ...persisted].filter((index) => index >= 0 && index < activities.length));
  }, [activities.length, lesson.id, state.completedActivities, userProgress.activitiesCompleted]);
  const completedCount = completedSet.size;
  const progress = calculateProgress(completedCount, activities.length);
  const details = activity ? getActivityDetails(activity.type) : null;
  const remainingMinutes = estimateRemainingMinutes(activities, current);
  const totalMinutes = estimateTotalMinutes(activities);
  const requiresResponse = activity && ["listening", "practice", "quiz"].includes(activity.type);
  const canCompleteCurrent = Boolean(activity) && (completedSet.has(current) || !requiresResponse || activityReadiness[current]);

  const handleReadyChange = useCallback((index: number, ready: boolean) => {
    setActivityReadiness((previous) => previous[index] === ready ? previous : { ...previous, [index]: ready });
  }, []);

  function markCurrentComplete() {
    if (!activity || !canCompleteCurrent) return;
    completeActivity(current);
    saveActivityProgress(lesson.id, current);
    if (isLastActivity) {
      completeLesson(lesson.id);
      setShowCompletion(true);
      setTransition(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setTransition({ completedIndex: current, nextIndex: current + 1 });
  }

  function continueAfterTransition() {
    if (!transition) return;
    goToActivity(transition.nextIndex);
    setTransition(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRestart() {
    if (!window.confirm("Restart this lesson? This resets only this lesson’s device-local progress.")) return;
    restartLesson();
    resetLessonProgress(lesson.id);
    setActivityReadiness({});
    setTransition(null);
    setShowCompletion(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!activities.length) {
    return <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold text-slate-950">{lesson.title || "Lesson unavailable"}</h1><p className="mt-3 text-slate-600">This lesson does not contain any activities yet.</p><Link to={returnPath} className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Return to lessons</Link></section>;
  }

  if (showCompletion) {
    return <CompletionScreen lesson={lesson} completed={completedCount} total={activities.length} totalMinutes={totalMinutes} returnPath={returnPath} onReview={() => { reviewLesson(); setShowCompletion(false); }} onRestart={handleRestart} />;
  }

  return <div className="min-h-screen bg-slate-50">
    <LessonHeader title={lesson.title} description={lesson.description} current={current + 1} total={activities.length} progress={progress} remainingMinutes={remainingMinutes} returnPath={returnPath} />
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
      <aside className="hidden self-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-4 lg:block">
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{contextLabel || "Lesson outline"}</p>
        <ol className="space-y-1">
          {activities.map((item, index) => {
            const completed = completedSet.has(index);
            const available = completed || index === current;
            return <li key={item.id}>
              <button type="button" disabled={!available} onClick={() => { goToActivity(index); setTransition(null); }} aria-current={index === current ? "step" : undefined} className={`w-full rounded-xl px-3 py-3 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${index === current ? "bg-blue-50 font-bold text-blue-800" : completed ? "font-medium text-slate-700 hover:bg-slate-50" : "cursor-not-allowed text-slate-400"}`}>
                <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-white text-xs ring-1 ring-slate-200">{completed ? "✓" : index + 1}</span>
                <span className="line-clamp-2">{item.title || `Activity ${index + 1}`}</span>
              </button>
            </li>;
          })}
        </ol>
        <button type="button" onClick={handleRestart} className="mt-4 w-full rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-red-700">Restart lesson</button>
        <p className="mt-2 px-3 text-xs leading-5 text-slate-400">Progress is stored on this device only.</p>
      </aside>

      <main className="min-w-0">
        {transition ? <TransitionPanel
          message={getCompletionMessage(completedSet.has(transition.completedIndex) ? completedCount : completedCount + 1, activities.length)}
          isAiNext={activities[transition.nextIndex]?.type === "ai_speaking_mission"}
          onContinue={continueAfterTransition}
        /> : <>
          <section aria-live="polite" className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600"><span>{details?.label || "Activity"}</span><span aria-hidden="true">·</span><span>{details?.minutes ?? 5} min estimate</span></div>
            <h2 className="mt-2 break-words text-2xl font-bold text-slate-950">{activity?.title || `Activity ${current + 1}`}</h2>
            {details?.instruction && <p className="mt-2 text-sm leading-6 text-slate-600">{details.instruction}</p>}
          </section>

          {activities.map((item, index) => <div key={item.id} hidden={index !== current}>
            <ActivityErrorBoundary activityTitle={item.title}>
              <ActivityRenderer activity={item} lesson={lesson} onReadyChange={(ready) => handleReadyChange(index, ready)} />
            </ActivityErrorBoundary>
          </div>)}

          {!canCompleteCurrent && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">Submit each question in this activity before continuing. Correct answers are not required.</p>}
          <div className="mt-6"><LessonNavigator current={current} total={activities.length} canAdvance={canCompleteCurrent} isLast={isLastActivity} onPrevious={() => { previousActivity(); setTransition(null); }} onComplete={markCurrentComplete} /></div>
        </>}
      </main>
    </div>
  </div>;
}

function TransitionPanel({ message, isAiNext, onContinue }: { message: string; isAiNext: boolean; onContinue: () => void }) {
  return <section role="status" aria-live="polite" className="rounded-3xl border border-blue-200 bg-white p-8 text-center shadow-sm motion-safe:animate-[fade-in_180ms_ease-out] sm:p-12">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">✓</span>
    <h2 className="mt-5 text-2xl font-bold text-slate-950">{isAiNext ? "Final Speaking Challenge" : "Great work"}</h2>
    <p className="mx-auto mt-3 max-w-lg leading-7 text-slate-600">{isAiNext ? "You have completed the lesson practice. Now use an external AI pronunciation coach such as ChatGPT or Gemini to test today’s sounds." : message}</p>
    {isAiNext && <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">PronounceLab is not directly connected to those services. Mission results are confirmed locally only.</p>}
    <button autoFocus type="button" onClick={onContinue} className="mt-7 min-h-12 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Continue</button>
  </section>;
}

function CompletionScreen({ lesson, completed, total, totalMinutes, returnPath, onReview, onRestart }: {
  lesson: LessonData; completed: number; total: number; totalMinutes: number | null;
  returnPath: string; onReview: () => void; onRestart: () => void;
}) {
  return <section className="mx-auto max-w-3xl rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-lg sm:p-12">
    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">✓</span>
    <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Lesson completed</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{lesson.title || "PronounceLab lesson"}</h1>
    <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">You completed every lesson step. Review the activities whenever you want to reinforce today’s pronunciation work.</p>
    <div className="mx-auto mt-7 grid max-w-lg gap-3 sm:grid-cols-3">
      <CompletionStat label="Activities" value={`${completed} of ${total}`} />
      <CompletionStat label="Completion" value="100%" />
      <CompletionStat label="Practice time" value={totalMinutes === null ? "Not available" : `About ${totalMinutes} min`} />
    </div>
    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <button type="button" onClick={onReview} className="min-h-12 rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700">Review Lesson</button>
      <Link to={returnPath} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 font-bold text-slate-700 hover:bg-slate-50">Return to lessons</Link>
    </div>
    <button type="button" onClick={onRestart} className="mt-5 text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-red-700">Restart Lesson</button>
    <p className="mt-6 text-xs text-slate-500">Completion is stored on this device and is not synchronized to an account.</p>
  </section>;
}

function CompletionStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-bold text-slate-950">{value}</p></div>;
}
