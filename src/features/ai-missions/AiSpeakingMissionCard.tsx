import { useMemo, useState, type ReactNode } from "react";

import { copyPlainText } from "./clipboard";
import {
  getStudentInstructions,
  hasSpanishStudentInstructions,
  type StudentInstructionLanguage,
} from "./instructionLanguage";
import { generateAiMissionPrompt } from "./promptGenerator";
import { parseAiMissionResult } from "./resultParser";
import type { AiSpeakingMissionData, ParsedAiMissionResult } from "./types";

type Props = {
  mission: AiSpeakingMissionData;
  previewOnly?: boolean;
  onConfirmed?: () => void;
};

export default function AiSpeakingMissionCard({ mission, previewOnly = false, onConfirmed }: Props) {
  const prompt = useMemo(() => generateAiMissionPrompt(mission), [mission]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [rawResult, setRawResult] = useState("");
  const [parsed, setParsed] = useState<ParsedAiMissionResult | null>(null);
  const [parseError, setParseError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [instructionLanguage, setInstructionLanguage] =
    useState<StudentInstructionLanguage>("en");
  const hasSpanishInstructions = hasSpanishStudentInstructions(mission);
  const authoredInstructions = getStudentInstructions(
    mission,
    instructionLanguage
  );

  async function copyPrompt() {
    setCopyStatus("");
    try {
      await copyPlainText(prompt);
      setCopyStatus("Mission copied. Paste it into ChatGPT or Gemini voice mode.");
    } catch (error) {
      setCopyStatus(error instanceof Error ? error.message : "Copy failed. Please copy the visible prompt manually.");
      setShowPrompt(true);
    }
  }

  function parseResult() {
    setParseError("");
    setConfirmed(false);
    try { setParsed(parseAiMissionResult(rawResult)); }
    catch (error) { setParsed(null); setParseError(error instanceof Error ? error.message : "The result could not be parsed."); }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-[0_18px_45px_rgb(30_64_175/0.10)]">
      <div className="bg-blue-700 px-5 py-5 text-white sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">AI Speaking Mission</p>
        <h2 className="mt-2 text-2xl font-bold">{mission.missionTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">{mission.goal}</p>
      </div>
      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-3">
          <Summary label="Target sounds" value={[`${mission.primarySoundLabel} ${mission.primarySoundIpa}`, mission.secondarySoundLabel && `${mission.secondarySoundLabel} ${mission.secondarySoundIpa}`].filter(Boolean).join(" vs ")} />
          <Summary label="Practice" value={`${mission.primaryWords.length + mission.secondaryWords.length} words · ${mission.sentences.length} sentences · 1 reading`} />
          <Summary label="Estimated time" value={`${mission.estimatedMinutes} minutes`} />
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <strong>{instructionLanguage === "es" ? "Cómo funciona" : "How it works"}</strong>
            {hasSpanishInstructions && (
              <button
                type="button"
                aria-pressed={instructionLanguage === "es"}
                onClick={() =>
                  setInstructionLanguage((current) =>
                    current === "en" ? "es" : "en"
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {instructionLanguage === "en"
                  ? "Ver instrucciones en español"
                  : "View instructions in English"}
              </button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap">
            {authoredInstructions || `Copy the mission, paste it into ${mission.supportedTools.join(" or ")} voice mode, complete the speaking practice, then copy its final PronounceLab result back here.`}
          </p>
          <p className="mt-2 text-xs text-slate-500">PronounceLab is not connected to these services.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => void copyPrompt()} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Copy AI Mission</button>
          <button type="button" onClick={() => setShowPrompt((value) => !value)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{showPrompt ? "Hide Prompt" : "View Prompt"}</button>
        </div>
        {copyStatus && <p role="status" aria-live="polite" className="text-sm font-medium text-blue-700">{copyStatus}</p>}
        {showPrompt && <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">{prompt}</pre>}

        {!previewOnly && <div className="border-t border-slate-200 pt-6">
          <h3 className="text-xl font-bold text-slate-950">Paste Your Mission Result</h3>
          <p className="mt-2 text-sm text-slate-600">Copy the complete final result from your external AI coach. It stays only on this device for now and is not added to your progress record.</p>
          <label className="mt-4 block text-sm font-semibold text-slate-800" htmlFor="ai-mission-result">Mission result</label>
          <textarea id="ai-mission-result" maxLength={20_000} value={rawResult} onChange={(event) => { setRawResult(event.target.value); setConfirmed(false); }} className="mt-2 min-h-48 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="PRONOUNCELAB MISSION RESULT…" />
          <button type="button" disabled={!rawResult.trim()} onClick={parseResult} className="mt-3 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Parse Result</button>
          {parseError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{parseError}</p>}
          {parsed && <ResultPreview result={parsed} confirmed={confirmed} onConfirm={() => { setConfirmed(true); onConfirmed?.(); }} />}
        </div>}
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p></div>;
}

function ResultPreview({ result, confirmed, onConfirm }: { result: ParsedAiMissionResult; confirmed: boolean; onConfirm: () => void }) {
  return <div className="mt-6 space-y-4">
    {result.warnings.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Check this result:</strong><ul className="mt-2 list-disc pl-5">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>}
    <div className="grid gap-4 md:grid-cols-2">
      <ResultCard title="Pronunciation score"><strong className="text-4xl text-blue-700">{result.score ?? "—"}</strong><span className="text-sm text-slate-500"> / 100</span></ResultCard>
      <ResultCard title="Words to practice again">{result.wordsToPracticeAgain.length ? result.wordsToPracticeAgain.join(", ") : "No words were listed."}</ResultCard>
      <ResultCard title="Pronunciation feedback">{result.pronunciationFeedback || "No feedback was provided."}</ResultCard>
      <ResultCard title="Strengths">{result.strengths.length ? <ul className="list-disc pl-5">{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : "No strengths were listed."}</ResultCard>
      <ResultCard title="Goal for next practice">{result.goalForNextPractice || "No goal was provided."}</ResultCard>
      <ResultCard title="Coach message">{result.coachMessage || "No coach message was provided."}</ResultCard>
    </div>
    <p className="text-xs leading-5 text-slate-500">This score is not an authoritative assessment. Feedback quality depends on the external AI tool, microphone, audio conditions, and model behavior.</p>
    <button type="button" disabled={confirmed} onClick={onConfirm} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{confirmed ? "Confirmed for this session" : "Confirm Result Preview"}</button>
    {confirmed && <p role="status" className="text-sm text-emerald-700">Confirmed locally. Progress Journal persistence is planned for a future release.</p>}
  </div>;
}

function ResultCard({ title, children }: { title: string; children: ReactNode }) {
  return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h4><div className="mt-2 text-sm leading-6 text-slate-800">{children}</div></article>;
}
