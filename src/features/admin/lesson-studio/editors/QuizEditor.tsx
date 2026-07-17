import { useEffect, useState } from "react";

import {
  createQuestion,
  deleteQuestion,
  getAssessment,
  listQuestions,
  reorderQuestions,
  saveAssessment,
  saveQuestion,
} from "../services/activityContentService";
import type {
  AssessmentSet,
  QuizQuestion,
} from "../types";

export default function QuizEditor({
  activityId,
  editable,
}: {
  activityId: number;
  editable: boolean;
}) {
  const [assessment, setAssessment] =
    useState<AssessmentSet | null>(null);
  const [questions, setQuestions] = useState<
    QuizQuestion[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    string | null
  >(null);

  async function refresh() {
    const set = await getAssessment(activityId);
    setAssessment(set);
    setQuestions(
      set ? await listQuestions(set.id) : []
    );
  }

  useEffect(() => {
    let active = true;
    void getAssessment(activityId)
      .then(async (set) => ({
        set,
        questions: set
          ? await listQuestions(set.id)
          : [],
      }))
      .then(
        (result) => {
          if (active) {
            setAssessment(result.set);
            setQuestions(result.questions);
          }
        },
        (error: unknown) => {
          if (active) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to load quiz."
            );
          }
        }
      );
    return () => {
      active = false;
    };
  }, [activityId]);

  async function run(
    action: () => Promise<unknown>,
    success: string
  ) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save quiz."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleQuestionSave(
    question: QuizQuestion
  ) {
    const currentAssessment = assessment;
    if (!currentAssessment) {
      setMessage("Quiz settings are unavailable.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const saved = await saveQuestion(
        question,
        currentAssessment.id
      );
      setQuestions((current) =>
        current.map((item) =>
          item.id === saved.id ? saved : item
        )
      );
      setMessage("Question saved.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save quiz.";
      if (
        message
          .toLowerCase()
          .includes("save conflict")
      ) {
        let reloaded = false;
        try {
          await refresh();
          reloaded = true;
        } catch {
          // Preserve the conflict as the actionable error.
        }
        setMessage(
          reloaded
            ? "Save conflict: this question changed in another session. The latest version has been reloaded."
            : "Save conflict: this question changed in another session, and the latest version could not be reloaded. Refresh the studio before editing."
        );
      } else {
        setMessage(message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (!assessment) {
    return (
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        Quiz settings are unavailable.
      </p>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">
        Quiz editor
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        The schema supports single-correct option
        questions. Question type and points are not
        stored.
      </p>
      {message && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
      <div className="mt-5 grid gap-4">
        <input
          aria-label="Quiz title"
          className="field"
          disabled={!editable || busy}
          value={assessment.title}
          onChange={(event) =>
            setAssessment({
              ...assessment,
              title: event.target.value,
            })
          }
        />
        <textarea
          aria-label="Quiz instructions"
          className="field"
          disabled={!editable || busy}
          value={assessment.instructions ?? ""}
          onChange={(event) =>
            setAssessment({
              ...assessment,
              instructions: event.target.value,
            })
          }
        />
        {editable && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  async () => {
                    const saved =
                      await saveAssessment(
                      assessment,
                      activityId
                    );
                    setAssessment(saved);
                  },
                  "Quiz settings saved."
                )
              }
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Save settings
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () =>
                    createQuestion(
                      assessment.id,
                      questions.length === 0
                        ? 0
                        : Math.max(
                            ...questions.map(
                              (question) =>
                                question.position
                            )
                          ) + 1
                    ),
                  "Question added."
                )
              }
              className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700"
            >
              Add question
            </button>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-5">
        {questions.map((question, questionIndex) => (
          <article
            key={question.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex justify-between gap-3">
              <strong className="text-sm">
                Question {questionIndex + 1}
              </strong>
              {editable && (
                <div className="flex gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    disabled={busy || questionIndex === 0}
                    onClick={() => {
                      const ids = questions.map(
                        (item) => item.id
                      );
                      [
                        ids[questionIndex - 1],
                        ids[questionIndex],
                      ] = [
                        ids[questionIndex],
                        ids[questionIndex - 1],
                      ];
                      void run(
                        () =>
                          reorderQuestions(
                            assessment.id,
                            ids
                          ),
                        "Questions reordered."
                      );
                    }}
                    className="disabled:opacity-30"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      questionIndex ===
                        questions.length - 1
                    }
                    onClick={() => {
                      const ids = questions.map(
                        (item) => item.id
                      );
                      [
                        ids[questionIndex],
                        ids[questionIndex + 1],
                      ] = [
                        ids[questionIndex + 1],
                        ids[questionIndex],
                      ];
                      void run(
                        () =>
                          reorderQuestions(
                            assessment.id,
                            ids
                          ),
                        "Questions reordered."
                      );
                    }}
                    className="disabled:opacity-30"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () =>
                          deleteQuestion(
                            question.id,
                            assessment.id
                          ),
                        "Question deleted."
                      )
                    }
                    className="text-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <textarea
              aria-label={`Question ${questionIndex + 1} prompt`}
              className="field"
              disabled={!editable || busy}
              value={question.prompt}
              onChange={(event) =>
                setQuestions((current) =>
                  current.map((item) =>
                    item.id === question.id
                      ? {
                          ...item,
                          prompt: event.target.value,
                        }
                      : item
                  )
                )
              }
            />
            <div className="mt-3 space-y-2">
              {question.options.map(
                (option, optionIndex) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={option.isCorrect}
                      disabled={!editable || busy}
                      onChange={() =>
                        setQuestions((current) =>
                          current.map((item) =>
                            item.id === question.id
                              ? {
                                  ...item,
                                  options:
                                    item.options.map(
                                      (value) => ({
                                        ...value,
                                        isCorrect:
                                          value.id ===
                                          option.id,
                                      })
                                    ),
                                }
                              : item
                          )
                        )
                      }
                    />
                    <input
                      aria-label={`Option ${optionIndex + 1}`}
                      className="field mt-0"
                      disabled={!editable || busy}
                      value={option.text}
                      onChange={(event) =>
                        setQuestions((current) =>
                          current.map((item) =>
                            item.id === question.id
                              ? {
                                  ...item,
                                  options:
                                    item.options.map(
                                      (value) =>
                                        value.id ===
                                        option.id
                                          ? {
                                              ...value,
                                              text: event
                                                .target
                                                .value,
                                            }
                                          : value
                                    ),
                                }
                              : item
                          )
                        )
                      }
                    />
                  </label>
                )
              )}
            </div>
            <textarea
              aria-label="Explanation"
              placeholder="Explanation (optional)"
              className="field"
              disabled={!editable || busy}
              value={question.explanation ?? ""}
              onChange={(event) =>
                setQuestions((current) =>
                  current.map((item) =>
                    item.id === question.id
                      ? {
                          ...item,
                          explanation:
                            event.target.value,
                        }
                      : item
                  )
                )
              }
            />
            {editable && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void handleQuestionSave(question)
                }
                className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Save question
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
