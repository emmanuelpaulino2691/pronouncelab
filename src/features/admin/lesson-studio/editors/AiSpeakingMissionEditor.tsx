import { useEffect, useMemo, useRef, useState } from "react";

import AiSpeakingMissionCard from "../../../ai-missions/AiSpeakingMissionCard";
import { cefrLevels, copyPlainText, generateAiMissionPrompt, validateAiSpeakingMission, type AiSpeakingMissionData } from "../../../ai-missions";
import { normalizeAiSpeakingMission } from "../../../ai-missions/missionNormalization";
import { Alert, Button, Card, FormField, Select, TextArea, TextInput } from "../../ui";
import {
  AiMissionConflictError,
  getAiMission,
  saveAiMission,
} from "../services/aiMissionService";

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
    const normalized = normalizeAiSpeakingMission(data);
    const validation =
      validateAiSpeakingMission(normalized);
    if (!validation.ok) {
      setMessage(validation.error);
      return;
    }
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
        <div className="sm:col-span-2"><FormField label="Student instructions — English" htmlFor="student-instructions" hint="Explain how the student should complete the external voice practice."><TextArea id="student-instructions" disabled={!editable || busy} value={data.studentInstructions} onChange={(e) => patch({ studentInstructions: e.target.value })} /></FormField></div>
        <div className="sm:col-span-2"><FormField label="Student instructions — Spanish (optional)" htmlFor="student-instructions-es" hint="Support students who may not understand the English workflow. The AI prompt does not need to be translated."><TextArea id="student-instructions-es" maxLength={5000} disabled={!editable || busy} value={data.studentInstructionsEs ?? ""} onChange={(e) => patch({ studentInstructionsEs: e.target.value })} /></FormField></div>
        <div className="sm:col-span-2"><FormField label="Teacher note" htmlFor="teacher-instructions"><TextArea id="teacher-instructions" disabled={!editable || busy} value={data.teacherInstructions} onChange={(e) => patch({ teacherInstructions: e.target.value })} /></FormField></div>
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">AI prompt</h2><p className="text-sm text-slate-500">Generated from the mission configuration and kept separate from student instructions.</p></div><Button variant="secondary" onClick={() => void copyPlainText(prompt).then(() => setCopyStatus("Prompt copied.")).catch(() => setCopyStatus("Copy failed."))}>Copy Prompt</Button></div>
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
