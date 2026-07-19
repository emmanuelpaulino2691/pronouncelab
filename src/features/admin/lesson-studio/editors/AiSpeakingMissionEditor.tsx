import { useEffect, useMemo, useRef, useState } from "react";

import AiSpeakingMissionCard from "../../../ai-missions/AiSpeakingMissionCard";
import { cefrLevels, copyPlainText, generateAiMissionPrompt, type AiSpeakingMissionData } from "../../../ai-missions";
import { Alert, Button, Card, FormField, Select, TextArea, TextInput } from "../../ui";
import {
  AiMissionConflictError,
  getAiMission,
  saveAiMission,
} from "../services/aiMissionService";

function validate(data: AiSpeakingMissionData) {
  if (!data.missionTitle.trim() || !data.goal.trim()) return "Mission title and goal are required.";
  if (data.missionTitle.length > 200 || data.goal.length > 2000) return "Mission title or goal is too long.";
  if (data.missionLabel.length > 100 || data.difficultyLabel.length > 100) return "Mission label or difficulty is too long.";
  if (!data.primarySoundLabel.trim() || !data.primarySoundIpa.trim()) return "The primary sound name and IPA are required.";
  if ([data.primarySoundLabel, data.primarySoundIpa, data.secondarySoundLabel, data.secondarySoundIpa].some((value) => value.length > 200)) return "Sound names and IPA must use 200 characters or fewer.";
  if (!data.primaryWords.length) return "Add at least one primary practice word.";
  if (data.primaryWords.length > 50 || data.secondaryWords.length > 50) return "Use no more than 50 words in each sound group.";
  if (data.secondaryWords.length && (!data.secondarySoundLabel.trim() || !data.secondarySoundIpa.trim())) return "Add the secondary sound name and IPA when using secondary words.";
  if (!data.sentences.length || !data.readingText.trim()) return "Add at least one sentence and a short reading.";
  if (data.sentences.length > 20 || data.readingText.length > 3000) return "Use no more than 20 sentences and 3,000 reading characters.";
  if (!data.supportedTools.length) return "Select at least one supported AI platform.";
  if (!data.promptLanguage.trim() || !data.feedbackLanguage.trim() || data.promptLanguage.length > 100 || data.feedbackLanguage.length > 100) return "Instruction and feedback languages are required and must use 100 characters or fewer.";
  if (data.teacherInstructions.length > 5000 || data.studentInstructions.length > 5000) return "Teacher and student instructions must use 5,000 characters or fewer.";
  if (data.resultFormatVersion !== 1) return "Only mission Format Version 1 is supported.";
  if (data.estimatedMinutes < 1 || data.estimatedMinutes > 60) return "Estimated duration must be between 1 and 60 minutes.";
  return null;
}

function normalizeMission(data: AiSpeakingMissionData): AiSpeakingMissionData {
  const clean = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
  return {
    ...data,
    missionTitle: data.missionTitle.trim(),
    missionLabel: data.missionLabel.trim(),
    goal: data.goal.trim(),
    primarySoundLabel: data.primarySoundLabel.trim(),
    primarySoundIpa: data.primarySoundIpa.trim(),
    secondarySoundLabel: data.secondarySoundLabel.trim(),
    secondarySoundIpa: data.secondarySoundIpa.trim(),
    primaryWords: clean(data.primaryWords),
    secondaryWords: clean(data.secondaryWords),
    sentences: clean(data.sentences),
    readingText: data.readingText.trim(),
    promptLanguage: data.promptLanguage.trim() || "English",
    feedbackLanguage: data.feedbackLanguage.trim() || "English",
    difficultyLabel: data.difficultyLabel.trim(),
    teacherInstructions: data.teacherInstructions.trim(),
    studentInstructions: data.studentInstructions.trim(),
  };
}

export default function AiSpeakingMissionEditor({ activityId, editable }: { activityId: number; editable: boolean }) {
  const active = useRef(true);
  const request = useRef(0);
  const [missionId, setMissionId] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [data, setData] = useState<AiSpeakingMissionData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const prompt = useMemo(() => data ? generateAiMissionPrompt(data) : "", [data]);

  useEffect(() => {
    active.current = true;
    const id = ++request.current;
    void getAiMission(activityId).then((row) => {
      if (active.current && request.current === id) {
        setMissionId(row.id);
        setUpdatedAt(row.updated_at);
        setData(row.config);
      }
    }).catch(() => { if (active.current && request.current === id) setMessage("Unable to load the AI mission."); });
    return () => { active.current = false; request.current += 1; };
  }, [activityId]);

  function patch(values: Partial<AiSpeakingMissionData>) {
    setData((current) => current ? { ...current, ...values } : current);
  }

  async function save() {
    if (!data || !missionId || !updatedAt || busy) return;
    const normalized = normalizeMission(data);
    const error = validate(normalized);
    if (error) { setMessage(error); return; }
    const id = ++request.current;
    setBusy(true); setMessage("");
    try {
      const saved = await saveAiMission(
        missionId,
        activityId,
        updatedAt,
        normalized
      );
      if (active.current && request.current === id) {
        setData(saved.config);
        setUpdatedAt(saved.updated_at);
        setMessage("AI speaking mission saved.");
      }
    } catch (error) {
      if (
        error instanceof AiMissionConflictError
      ) {
        try {
          const latest = await getAiMission(activityId);
          if (
            active.current &&
            request.current === id
          ) {
            setMissionId(latest.id);
            setUpdatedAt(latest.updated_at);
            setData(latest.config);
            setMessage(error.message);
          }
        } catch {
          if (
            active.current &&
            request.current === id
          ) {
            setMessage(
              "This mission changed in another editor, but the latest version could not be loaded."
            );
          }
        }
      } else if (
        active.current &&
        request.current === id
      ) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to save the mission."
        );
      }
    } finally { if (active.current && request.current === id) setBusy(false); }
  }

  if (!data) return <Card className="p-6 text-sm text-slate-600">{message || "Loading AI speaking mission…"}</Card>;

  return <div className="space-y-6">
    {message && <Alert tone={message.includes("saved") ? "success" : "info"}>{message}</Alert>}
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Mission basics</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <FormField label="Mission title" htmlFor="mission-title" required><TextInput id="mission-title" disabled={!editable || busy} value={data.missionTitle} onChange={(e) => patch({ missionTitle: e.target.value })} /></FormField>
        <FormField label="Mission label or number" htmlFor="mission-label"><TextInput id="mission-label" disabled={!editable || busy} value={data.missionLabel} onChange={(e) => patch({ missionLabel: e.target.value })} /></FormField>
        <FormField label="CEFR level" htmlFor="mission-level"><Select id="mission-level" disabled={!editable || busy} value={data.cefrLevel} onChange={(e) => patch({ cefrLevel: e.target.value as AiSpeakingMissionData["cefrLevel"] })}>{cefrLevels.map((level) => <option key={level}>{level}</option>)}</Select></FormField>
        <FormField label="Estimated minutes" htmlFor="mission-minutes"><TextInput id="mission-minutes" type="number" min={1} max={60} disabled={!editable || busy} value={data.estimatedMinutes} onChange={(e) => patch({ estimatedMinutes: Number(e.target.value) })} /></FormField>
        <FormField label="Difficulty label" htmlFor="mission-difficulty"><TextInput id="mission-difficulty" disabled={!editable || busy} value={data.difficultyLabel} onChange={(e) => patch({ difficultyLabel: e.target.value })} /></FormField>
        <div className="sm:col-span-2"><FormField label="Short goal" htmlFor="mission-goal" required><TextArea id="mission-goal" disabled={!editable || busy} value={data.goal} onChange={(e) => patch({ goal: e.target.value })} /></FormField></div>
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Sound focus and practice</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <FormField label="Primary sound name" htmlFor="primary-sound"><TextInput id="primary-sound" disabled={!editable || busy} value={data.primarySoundLabel} onChange={(e) => patch({ primarySoundLabel: e.target.value })} /></FormField>
        <FormField label="Primary IPA" htmlFor="primary-ipa"><TextInput id="primary-ipa" disabled={!editable || busy} value={data.primarySoundIpa} onChange={(e) => patch({ primarySoundIpa: e.target.value })} /></FormField>
        <FormField label="Secondary sound name" htmlFor="secondary-sound"><TextInput id="secondary-sound" disabled={!editable || busy} value={data.secondarySoundLabel} onChange={(e) => patch({ secondarySoundLabel: e.target.value })} /></FormField>
        <FormField label="Secondary IPA" htmlFor="secondary-ipa"><TextInput id="secondary-ipa" disabled={!editable || busy} value={data.secondarySoundIpa} onChange={(e) => patch({ secondarySoundIpa: e.target.value })} /></FormField>
        <MissionListEditor label="Primary words" items={data.primaryWords} recommended="Ten words are recommended. Paste comma- or line-separated words into any field." disabled={!editable || busy} onChange={(primaryWords) => patch({ primaryWords })} />
        <MissionListEditor label="Secondary words" items={data.secondaryWords} recommended="Optional. Ten words are recommended for contrast practice." disabled={!editable || busy} onChange={(secondaryWords) => patch({ secondaryWords })} />
        <div className="sm:col-span-2"><MissionListEditor label="Sentences" items={data.sentences} recommended="Two or three sentences are recommended." disabled={!editable || busy} onChange={(sentences) => patch({ sentences })} /></div>
        <div className="sm:col-span-2"><FormField label={`Short reading (${data.readingText.trim().split(/\s+/).filter(Boolean).length} words)`} htmlFor="mission-reading"><TextArea id="mission-reading" disabled={!editable || busy} value={data.readingText} onChange={(e) => patch({ readingText: e.target.value.slice(0, 3000) })} /></FormField></div>
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">AI configuration</h2>
      <p className="mt-1 text-sm text-slate-500">ChatGPT and Gemini are enabled by default. PronounceLab does not call either API.</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-semibold text-slate-800">Supported platforms</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {(["ChatGPT", "Gemini"] as const).map((tool) => <label key={tool} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                disabled={!editable || busy}
                checked={data.supportedTools.includes(tool)}
                onChange={(event) => patch({
                  supportedTools: event.target.checked
                    ? [...new Set([...data.supportedTools, tool])]
                    : data.supportedTools.filter((value) => value !== tool),
                })}
              />
              {tool}
            </label>)}
          </div>
        </fieldset>
        <FormField label="Instruction language" htmlFor="prompt-language"><TextInput id="prompt-language" disabled={!editable || busy} value={data.promptLanguage} onChange={(e) => patch({ promptLanguage: e.target.value })} /></FormField>
        <FormField label="Feedback language" htmlFor="feedback-language"><TextInput id="feedback-language" disabled={!editable || busy} value={data.feedbackLanguage} onChange={(e) => patch({ feedbackLanguage: e.target.value })} /></FormField>
        <div className="sm:col-span-2"><FormField label="Student instructions" htmlFor="student-instructions"><TextArea id="student-instructions" disabled={!editable || busy} value={data.studentInstructions} onChange={(e) => patch({ studentInstructions: e.target.value })} /></FormField></div>
        <div className="sm:col-span-2"><FormField label="Teacher note" htmlFor="teacher-instructions"><TextArea id="teacher-instructions" disabled={!editable || busy} value={data.teacherInstructions} onChange={(e) => patch({ teacherInstructions: e.target.value })} /></FormField></div>
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Prompt preview</h2><p className="text-sm text-slate-500">Generated deterministically from the structured mission.</p></div><Button variant="secondary" onClick={() => void copyPlainText(prompt).then(() => setCopyStatus("Prompt copied.")).catch(() => setCopyStatus("Copy failed."))}>Copy Prompt</Button></div>
      {copyStatus && <p role="status" className="mt-3 text-sm text-blue-700">{copyStatus}</p>}
      <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">{prompt}</pre>
    </Card>
    {editable && <Button isLoading={busy} onClick={() => void save()}>Save AI mission</Button>}
    <div><h2 className="mb-3 text-lg font-bold">Student preview</h2><AiSpeakingMissionCard mission={data} previewOnly /></div>
  </div>;
}

function MissionListEditor({ label, items, recommended, disabled, onChange }: {
  label: string;
  items: string[];
  recommended: string;
  disabled: boolean;
  onChange: (items: string[]) => void;
}) {
  function update(index: number, value: string) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? value : item));
  }
  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  return <fieldset>
    <legend className="text-sm font-semibold text-slate-800">{label} ({items.length})</legend>
    <p className="mt-1 text-xs text-slate-500">{recommended}</p>
    <div className="mt-2 space-y-2">
      {items.map((item, index) => <div key={`${label}-${index}`} className="flex gap-2">
        <TextInput
          aria-label={`${label} item ${index + 1}`}
          disabled={disabled}
          value={item}
          onChange={(event) => update(index, event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            const values = pasted.split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean);
            if (values.length > 1) {
              event.preventDefault();
              onChange([...items.slice(0, index), ...values, ...items.slice(index + 1)].slice(0, 50));
            }
          }}
        />
        <Button type="button" variant="ghost" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`Move ${label} item up`}>↑</Button>
        <Button type="button" variant="ghost" disabled={disabled || index === items.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${label} item down`}>↓</Button>
        <Button type="button" variant="danger" disabled={disabled} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${label} item`}>×</Button>
      </div>)}
    </div>
    <Button type="button" variant="secondary" disabled={disabled || items.length >= 50} onClick={() => onChange([...items, ""])} className="mt-2">Add {label.toLowerCase().replace(/s$/, "")}</Button>
  </fieldset>;
}
