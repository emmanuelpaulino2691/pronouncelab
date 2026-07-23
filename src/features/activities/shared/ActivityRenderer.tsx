import { useState } from "react";

import AiSpeakingMissionCard from "../../ai-missions/AiSpeakingMissionCard";
import AudioPlayer from "../../../shared/components/listening/AudioPlayer";
import ToggleSection from "../../../shared/components/ui/ToggleSection";
import type { LearnerActivity, LearnerQuestion } from "../../../shared/content/contracts/learnerActivities";

type Props = { activity: LearnerActivity; onReadyChange: (ready: boolean) => void };

export default function ActivityRenderer({ activity, onReadyChange }: Props) {
  switch (activity.type) {
    case "theory":
      return <div className="space-y-5">{activity.blocks.map((block, index) => <TheoryBlockView key={index} block={block} />)}</div>;
    case "listening": {
      const questions = activity.items.flatMap((item) => item.questions);
      return <div className="space-y-5">{activity.items.map((item) => <section key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-xl font-semibold">{item.title}</h3>{item.instructions && <p className="mt-2 text-slate-600">{item.instructions}</p>}{item.audio && <AudioPlayer src={item.audio.url} />}{item.transcript && <ToggleSection buttonText="Show transcript" closeButtonText="Hide transcript" regionLabel={`${item.title} transcript`}><p className="whitespace-pre-wrap leading-7 text-slate-700">{item.transcript}</p></ToggleSection>}</section>)}{questions.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-xl font-semibold">Listening check</h3><AnswerSafeQuestions questions={questions} onReadyChange={onReadyChange} /></section>}</div>;
    }
    case "pronunciation":
      return <div className="space-y-5">{activity.items.map((item) => <section key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-xl font-semibold">{item.title}</h3>{item.instructions && <p className="mt-2 text-slate-600">{item.instructions}</p>}{item.spellingPattern && <p className="mt-3 text-sm font-semibold text-blue-700">Pattern: {item.spellingPattern}</p>}{item.blockType === "word_list" ? <ul className="mt-4 space-y-2">{item.entries?.filter((entry): entry is string => typeof entry === "string").map((word, index) => <li key={`${word}-${index}`} className="rounded-lg bg-slate-50 px-4 py-2 font-medium">{word}</li>)}</ul> : item.blockType === "minimal_pairs" ? <div className="mt-4 overflow-hidden rounded-xl border border-slate-200" role="table">{item.entries?.filter((entry): entry is { left: string; right: string } => typeof entry !== "string").map((pair, index) => <div key={index} role="row" className="grid grid-cols-2 border-b last:border-0"><span role="cell" className="border-r p-3 text-center">{pair.left}</span><span role="cell" className="p-3 text-center">{pair.right}</span></div>)}</div> : <p className="mt-3 text-slate-700">{item.displayText}</p>}{item.audio && <AudioPlayer src={item.audio.url} />}</section>)}</div>;
    case "practice":
      return <div className="space-y-4">{activity.items.map((item) => <section key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold">{item.title}</h3>{item.instructions && <p className="mt-2 text-slate-600">{item.instructions}</p>}</section>)}</div>;
    case "quiz": {
      const questions = activity.assessments.flatMap((assessment) => assessment.questions);
      return <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-xl font-semibold">{activity.assessments.map((assessment) => assessment.title).join(" · ") || activity.title}</h3><AnswerSafeQuestions questions={questions} onReadyChange={onReadyChange} /></section>;
    }
    case "ai_speaking_mission":
      return <AiSpeakingMissionCard mission={{ ...activity.config, supportedTools: [...activity.config.supportedTools], primaryWords: [...activity.config.primaryWords], secondaryWords: [...activity.config.secondaryWords], sentences: [...activity.config.sentences] }} onConfirmed={() => onReadyChange(true)} />;
  }
}

function TheoryBlockView({ block }: { block: import("../../../shared/content/contracts/learnerActivities").LearnerTheoryBlock }) {
  switch (block.type) {
    case "heading": return block.level === 1 ? <h2 className="text-2xl font-bold">{block.text}</h2> : <h3 className="text-xl font-semibold">{block.text}</h3>;
    case "paragraph": return <p className="leading-7 text-slate-700">{block.text}</p>;
    case "tip": return <aside className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">{block.text}</aside>;
    case "example": return <div className="rounded-xl bg-slate-50 p-4"><strong>{block.title}</strong><p className="mt-2">{block.text}</p></div>;
    case "image": return <figure><img src={block.media.url} alt={block.alt} className="max-w-full rounded-xl" /></figure>;
    case "audio": return <AudioPlayer src={block.media.url} />;
  }
}

function AnswerSafeQuestions({ questions, onReadyChange }: { questions: readonly LearnerQuestion[]; onReadyChange: (ready: boolean) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  if (questions.length === 0) return <p className="mt-4 text-slate-600">No questions are available.</p>;
  const complete = questions.every((question) => Boolean(answers[question.id]));
  return <form className="mt-5 space-y-5" onSubmit={(event) => { event.preventDefault(); if (complete) { setSubmitted(true); onReadyChange(true); } }}>
    {questions.map((question) => <fieldset key={question.id} className="space-y-2"><legend className="font-semibold">{question.prompt}</legend>{question.options.map((option) => <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 p-3"><input type="radio" name={`question-${question.id}`} value={option.id} checked={answers[question.id] === option.id} onChange={() => { setSubmitted(false); onReadyChange(false); setAnswers((current) => ({ ...current, [question.id]: option.id })); }} />{option.text}</label>)}</fieldset>)}
    <button type="submit" disabled={!complete} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Submit responses</button>
    {submitted && <p role="status" className="text-sm text-emerald-700">Responses recorded for this device session. Answer scoring is not shown.</p>}
  </form>;
}
