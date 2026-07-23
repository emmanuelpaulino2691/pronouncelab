import { useEffect, useState } from "react";
import {
  Button,
  FormField,
  Select,
  TextArea,
  TextInput,
} from "../../ui";
import {
  emptyInteractivePractice,
  interactivePracticeModes,
  validateInteractivePractice,
  type InteractivePracticeConfig,
  type InteractivePracticeMode,
} from "../interactivePractice";
import {
  getInteractivePractice,
  saveInteractivePractice,
  type InteractivePracticeRecord,
} from "../services/interactivePracticeService";

const modeLabels: Record<
  InteractivePracticeMode,
  string
> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  match: "Match",
  fill_blank: "Fill in the Blank",
};

function nonEmptyLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function InteractivePracticeEditor({
  activityId,
  editable,
}: {
  activityId: number;
  editable: boolean;
}) {
  const [record, setRecord] =
    useState<InteractivePracticeRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    void getInteractivePractice(activityId).then(
      (value) => {
        if (active) {
          setRecord(value);
          setMessage("");
        }
      },
      () => {
        if (active) {
          setMessage(
            "Interactive Practice could not be loaded. Try again."
          );
        }
      }
    );

    return () => {
      active = false;
    };
  }, [activityId]);

  if (!record || record.activityId !== activityId) {
    return (
      <section
        role="status"
        className="rounded-2xl border p-5"
      >
        {message || "Loading Interactive Practice…"}
      </section>
    );
  }

  const validationErrors = validateInteractivePractice(
    record.mode,
    record.config
  );

  function patchConfig(
    patch: Partial<InteractivePracticeConfig>
  ) {
    setRecord((current) =>
      current
        ? {
            ...current,
            config: { ...current.config, ...patch },
          }
        : current
    );
  }

  async function save() {
    if (!record || busy) return;
    setBusy(true);
    setMessage("");
    try {
      setRecord(await saveInteractivePractice(record));
      setMessage("Saved");
    } catch {
      setMessage(
        "Save failed. Your changes are still here. Try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <h2 className="text-lg font-bold">
        Interactive Practice
      </h2>

      <FormField
        label="Exercise type"
        htmlFor="interactive-practice-mode"
      >
        <Select
          id="interactive-practice-mode"
          value={record.mode}
          disabled={!editable || busy}
          onChange={(event) =>
            setRecord({
              ...record,
              mode: event.target
                .value as InteractivePracticeMode,
              config: { ...emptyInteractivePractice },
            })
          }
        >
          {interactivePracticeModes.map((mode) => (
            <option key={mode} value={mode}>
              {modeLabels[mode]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label={
          record.mode === "true_false"
            ? "Statement"
            : "Prompt"
        }
        htmlFor="interactive-practice-prompt"
        required
      >
        <TextInput
          id="interactive-practice-prompt"
          value={record.config.prompt}
          disabled={!editable || busy}
          onChange={(event) =>
            patchConfig({ prompt: event.target.value })
          }
        />
      </FormField>

      <FormField
        label="Instructions (optional)"
        htmlFor="interactive-practice-instructions"
      >
        <TextArea
          id="interactive-practice-instructions"
          value={record.instructions}
          disabled={!editable || busy}
          onChange={(event) =>
            setRecord({
              ...record,
              instructions: event.target.value,
            })
          }
        />
      </FormField>

      {record.mode === "multiple_choice" && (
        <>
          <FormField
            label="Options — one per line"
            htmlFor="interactive-practice-options"
          >
            <TextArea
              id="interactive-practice-options"
              value={record.config.options
                .map((option) => option.text)
                .join("\n")}
              disabled={!editable || busy}
              onChange={(event) =>
                patchConfig({
                  options: nonEmptyLines(
                    event.target.value
                  ).map((text, index) => ({
                    text,
                    correct:
                      record.config.options[index]
                        ?.correct ?? false,
                  })),
                })
              }
            />
          </FormField>
          <FormField
            label="Correct option number"
            htmlFor="interactive-practice-correct-option"
          >
            <TextInput
              id="interactive-practice-correct-option"
              type="number"
              min="1"
              value={
                record.config.options.findIndex(
                  (option) => option.correct
                ) +
                  1 || ""
              }
              disabled={!editable || busy}
              onChange={(event) =>
                patchConfig({
                  options: record.config.options.map(
                    (option, index) => ({
                      ...option,
                      correct:
                        index ===
                        Number(event.target.value) - 1,
                    })
                  ),
                })
              }
            />
          </FormField>
        </>
      )}

      {record.mode === "true_false" && (
        <FormField
          label="Correct answer"
          htmlFor="interactive-practice-boolean-answer"
        >
          <Select
            id="interactive-practice-boolean-answer"
            value={
              record.config.correctAnswer === null
                ? ""
                : String(record.config.correctAnswer)
            }
            disabled={!editable || busy}
            onChange={(event) =>
              patchConfig({
                correctAnswer:
                  event.target.value === ""
                    ? null
                    : event.target.value === "true",
              })
            }
          >
            <option value="">Choose…</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </Select>
        </FormField>
      )}

      {record.mode === "match" && (
        <FormField
          label="Pairs — left, right on each line"
          htmlFor="interactive-practice-pairs"
        >
          <TextArea
            id="interactive-practice-pairs"
            value={record.config.pairs
              .map((pair) => `${pair.left}, ${pair.right}`)
              .join("\n")}
            disabled={!editable || busy}
            onChange={(event) =>
              patchConfig({
                pairs: nonEmptyLines(event.target.value)
                  .map((row) => {
                    const [left, ...remainder] =
                      row.split(",");
                    return {
                      left: left?.trim() ?? "",
                      right: remainder.join(",").trim(),
                    };
                  })
                  .filter(
                    (pair) => pair.left && pair.right
                  ),
              })
            }
          />
        </FormField>
      )}

      {record.mode === "fill_blank" && (
        <FormField
          label="Accepted answers — one per line"
          htmlFor="interactive-practice-answers"
        >
          <TextArea
            id="interactive-practice-answers"
            value={record.config.acceptedAnswers.join(
              "\n"
            )}
            disabled={!editable || busy}
            onChange={(event) =>
              patchConfig({
                acceptedAnswers: nonEmptyLines(
                  event.target.value
                ),
              })
            }
          />
        </FormField>
      )}

      <FormField
        label="Explanation (private, optional)"
        htmlFor="interactive-practice-explanation"
        hint="Available to teachers and future scoring services. It is not included in learner content."
      >
        <TextArea
          id="interactive-practice-explanation"
          value={record.explanation}
          disabled={!editable || busy}
          onChange={(event) =>
            setRecord({
              ...record,
              explanation: event.target.value,
            })
          }
        />
      </FormField>

      {validationErrors.length > 0 && (
        <p className="text-sm text-amber-800">
          Draft incomplete:{" "}
          {validationErrors.join(" ")}
        </p>
      )}

      {message && <p role="status">{message}</p>}

      {editable && (
        <Button type="submit" disabled={busy}>
          {busy
            ? "Saving…"
            : "Save Interactive Practice"}
        </Button>
      )}
    </form>
  );
}
