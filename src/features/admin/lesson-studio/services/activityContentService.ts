import { supabase } from "../../../../shared/lib/supabaseClient";
import type {
  AssessmentSet,
  ListeningItem,
  PronunciationItem,
  QuizQuestion,
  QuestionOption,
  TheoryBlock,
  TheoryBlockType,
} from "../types";
import {
  getListeningTranscriptError,
  normalizeListeningTranscript,
} from "../listeningValidation";

function client() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

export type DraftAudioAsset = {
  id: string;
  filename: string;
};

export async function listDraftAudioAssets() {
  const { data, error } = await client()
    .from("media_assets")
    .select("id,original_filename")
    .eq("kind", "audio")
    .eq("status", "draft")
    .order("original_filename");
  if (error) throw error;
  return (
    data as unknown as Array<{
      id: string;
      original_filename: string;
    }>
  ).map((row) => ({
    id: row.id,
    filename: row.original_filename,
  }));
}

export async function listTheoryBlocks(
  activityId: number
) {
  const { data, error } = await client()
    .from("theory_blocks")
    .select(
      "id,activity_id,block_type,position,heading_level,title,text,media_asset_id,alt_text,updated_at"
    )
    .eq("activity_id", activityId)
    .order("position");
  if (error) throw error;
  return (
    data as unknown as Array<{
      id: number;
      activity_id: number;
      block_type: TheoryBlockType;
      position: number;
      heading_level: number | null;
      title: string | null;
      text: string | null;
      media_asset_id: string | null;
      alt_text: string | null;
      updated_at: string;
    }>
  ).map((row): TheoryBlock => ({
    id: row.id,
    activityId: row.activity_id,
    blockType: row.block_type,
    position: row.position,
    headingLevel: row.heading_level,
    title: row.title,
    text: row.text,
    mediaAssetId: row.media_asset_id,
    altText: row.alt_text,
    updatedAt: row.updated_at,
  }));
}

export async function addTheoryBlock(
  activityId: number,
  position: number,
  blockType: TheoryBlockType
) {
  const { error } = await client()
    .from("theory_blocks")
    .insert({
      activity_id: activityId,
      position,
      block_type: blockType,
      heading_level:
        blockType === "heading" ? 2 : null,
      text: "",
    });
  if (error) throw error;
}

export async function saveTheoryBlock(
  block: TheoryBlock,
  expectedActivityId: number
) {
  const { data, error } = await client()
    .from("theory_blocks")
    .update({
      block_type: block.blockType,
      heading_level:
        block.blockType === "heading"
          ? block.headingLevel ?? 2
          : null,
      title: block.title?.trim() || null,
      text: block.text?.trim() ?? "",
      media_asset_id: block.mediaAssetId,
      alt_text: block.altText?.trim() || null,
    })
    .eq("id", block.id)
    .eq("activity_id", expectedActivityId)
    .select(
      "id,activity_id,block_type,position,heading_level,title,text,media_asset_id,alt_text,updated_at"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Theory block is stale, unavailable, or no longer belongs to this activity."
    );
  }
  const row = data as unknown as {
    id: number;
    activity_id: number;
    block_type: TheoryBlockType;
    position: number;
    heading_level: number | null;
    title: string | null;
    text: string | null;
    media_asset_id: string | null;
    alt_text: string | null;
    updated_at: string;
  };
  return {
    id: row.id,
    activityId: row.activity_id,
    blockType: row.block_type,
    position: row.position,
    headingLevel: row.heading_level,
    title: row.title,
    text: row.text,
    mediaAssetId: row.media_asset_id,
    altText: row.alt_text,
    updatedAt: row.updated_at,
  } satisfies TheoryBlock;
}

export async function deleteTheoryBlock(
  blockId: number,
  expectedActivityId: number
) {
  const { error } = await client()
    .from("theory_blocks")
    .delete()
    .eq("id", blockId)
    .eq("activity_id", expectedActivityId);
  if (error) throw error;
}

export async function reorderTheoryBlocks(
  activityId: number,
  blockIds: number[]
) {
  const { error } = await client().rpc(
    "reorder_draft_theory_blocks",
    {
      expected_activity_id: activityId,
      ordered_block_ids: blockIds,
    }
  );
  if (error) throw error;
}

type ListeningRow = {
  id: number;
  activity_id: number;
  title: string;
  instructions: string | null;
  transcript: string | null;
  audio_asset_id: string | null;
  position: number;
  updated_at: string;
};

export async function listListeningItems(
  activityId: number
) {
  const { data, error } = await client()
    .from("listening_items")
    .select(
      "id,activity_id,title,instructions,transcript,audio_asset_id,position,updated_at"
    )
    .eq("activity_id", activityId)
    .order("position");
  if (error) throw error;
  return (data as unknown as ListeningRow[]).map(
    (row): ListeningItem => ({
      id: row.id,
      activityId: row.activity_id,
      title: row.title,
      instructions: row.instructions,
      transcript: row.transcript,
      audioAssetId: row.audio_asset_id,
      position: row.position,
      updatedAt: row.updated_at,
    })
  );
}

export async function saveListeningItem(
  item: ListeningItem,
  expectedActivityId: number
) {
  if (!item.title.trim()) {
    throw new Error("Item title is required.");
  }
  const transcriptError = getListeningTranscriptError(item.transcript);
  if (transcriptError) throw new Error(transcriptError);
  const { data, error } = await client()
    .from("listening_items")
    .update({
      title: item.title.trim(),
      instructions:
        item.instructions?.trim() || null,
      transcript: normalizeListeningTranscript(item.transcript),
      audio_asset_id: item.audioAssetId,
    })
    .eq("id", item.id)
    .eq("activity_id", expectedActivityId)
    .select(
      "id,activity_id,title,instructions,transcript,audio_asset_id,position,updated_at"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Listening item is stale, unavailable, or no longer belongs to this activity."
    );
  }
  const row = data as unknown as ListeningRow;
  return {
    id: row.id,
    activityId: row.activity_id,
    title: row.title,
    instructions: row.instructions,
    transcript: row.transcript,
    audioAssetId: row.audio_asset_id,
    position: row.position,
    updatedAt: row.updated_at,
  } satisfies ListeningItem;
}

type PronunciationRow = {
  id: number;
  activity_id: number;
  title: string;
  instructions: string | null;
  display_text: string;
  block_type: "word_list" | "minimal_pairs" | null;
  spelling_pattern: string | null;
  entries: Array<string | { left: string; right: string }>;
  audio_asset_id: string | null;
  position: number;
  updated_at: string;
};

export async function listPronunciationItems(
  activityId: number
) {
  const { data, error } = await client()
    .from("pronunciation_items")
    .select(
      "id,activity_id,title,instructions,display_text,block_type,spelling_pattern,entries,audio_asset_id,position,updated_at"
    )
    .eq("activity_id", activityId)
    .order("position");
  if (error) throw error;
  return (
    data as unknown as PronunciationRow[]
  ).map(
    (row): PronunciationItem => ({
      id: row.id,
      activityId: row.activity_id,
      title: row.title,
      instructions: row.instructions,
      displayText: row.display_text,
      blockType: row.block_type,
      spellingPattern: row.spelling_pattern,
      entries: row.entries,
      audioAssetId: row.audio_asset_id,
      position: row.position,
      updatedAt: row.updated_at,
    })
  );
}

export async function savePronunciationItem(
  item: PronunciationItem,
  expectedActivityId: number
) {
  if (!item.title.trim()) {
    throw new Error("Item title is required.");
  }
  const { data, error } = await client()
    .from("pronunciation_items")
    .update({
      title: item.title.trim(),
      instructions:
        item.instructions?.trim() || null,
      display_text: item.displayText.trim(),
      audio_asset_id: item.audioAssetId,
    })
    .eq("id", item.id)
    .eq("activity_id", expectedActivityId)
    .select(
      "id,activity_id,title,instructions,display_text,block_type,spelling_pattern,entries,audio_asset_id,position,updated_at"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Pronunciation item is stale, unavailable, or no longer belongs to this activity."
    );
  }
  return mapPronunciationRow(data as unknown as PronunciationRow);
}

export async function createPronunciationBlock(
  activityId: number,
  blockType: "word_list" | "minimal_pairs",
  title: string
) {
  const { data, error } = await client().rpc("create_draft_pronunciation_block", {
    expected_activity_id: activityId,
    requested_block_type: blockType,
    requested_title: title,
  });
  if (error) throw error;
  return mapPronunciationRow(data as unknown as PronunciationRow);
}

export async function savePronunciationBlock(
  item: PronunciationItem,
  expectedActivityId: number
) {
  const { data, error } = await client().rpc("save_draft_pronunciation_block", {
    requested_item_id: item.id,
    expected_activity_id: expectedActivityId,
    expected_updated_at: item.updatedAt,
    requested_title: item.title,
    requested_instructions: item.instructions ?? "",
    requested_spelling_pattern: item.spellingPattern ?? "",
    requested_audio_asset_id: item.audioAssetId,
    requested_entries: item.entries,
  });
  if (error) throw error;
  return mapPronunciationRow(data as unknown as PronunciationRow);
}

export async function deletePronunciationBlock(itemId: number, expectedActivityId: number) {
  const { error } = await client().rpc("delete_draft_pronunciation_block", {
    requested_item_id: itemId,
    expected_activity_id: expectedActivityId,
  });
  if (error) throw error;
}

export async function reorderPronunciationBlocks(activityId: number, itemIds: number[]) {
  const { data, error } = await client().rpc("reorder_draft_pronunciation_blocks", {
    expected_activity_id: activityId,
    ordered_item_ids: itemIds,
  });
  if (error) throw error;
  return (data as unknown as PronunciationRow[]).map(mapPronunciationRow);
}

function mapPronunciationRow(row: PronunciationRow): PronunciationItem {
  return {
    id: row.id,
    activityId: row.activity_id,
    title: row.title,
    instructions: row.instructions,
    displayText: row.display_text,
    blockType: row.block_type,
    spellingPattern: row.spelling_pattern,
    entries: row.entries,
    audioAssetId: row.audio_asset_id,
    position: row.position,
    updatedAt: row.updated_at,
  };
}

export async function getAssessment(
  activityId: number
) {
  const { data, error } = await client()
    .from("assessment_sets")
    .select(
      "id,activity_id,title,instructions,position,updated_at"
    )
    .eq("activity_id", activityId)
    .order("position")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: number;
    activity_id: number;
    title: string;
    instructions: string | null;
    position: number;
    updated_at: string;
  };
  return {
    id: row.id,
    activityId: row.activity_id,
    title: row.title,
    instructions: row.instructions,
    position: row.position,
    updatedAt: row.updated_at,
  } satisfies AssessmentSet;
}

export async function saveAssessment(
  set: AssessmentSet,
  expectedActivityId: number
) {
  if (!set.title.trim()) {
    throw new Error("Quiz title is required.");
  }
  const { data, error } = await client()
    .from("assessment_sets")
    .update({
      title: set.title.trim(),
      instructions:
        set.instructions?.trim() || null,
    })
    .eq("id", set.id)
    .eq("activity_id", expectedActivityId)
    .select(
      "id,activity_id,title,instructions,position,updated_at"
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Quiz settings are stale, unavailable, or no longer belong to this activity."
    );
  }
  const row = data as unknown as {
    id: number;
    activity_id: number;
    title: string;
    instructions: string | null;
    position: number;
    updated_at: string;
  };
  return {
    id: row.id,
    activityId: row.activity_id,
    title: row.title,
    instructions: row.instructions,
    position: row.position,
    updatedAt: row.updated_at,
  } satisfies AssessmentSet;
}

export async function listQuestions(
  assessmentSetId: number
) {
  const { data, error } = await client()
    .from("questions")
    .select(
      "id,assessment_set_id,prompt,explanation,position,required,updated_at"
    )
    .eq("assessment_set_id", assessmentSetId)
    .order("position");
  if (error) throw error;
  const rows = data as unknown as Array<{
    id: number;
    assessment_set_id: number;
    prompt: string;
    explanation: string | null;
    position: number;
    required: boolean;
    updated_at: string;
  }>;
  const questions = await Promise.all(
    rows.map(async (row): Promise<QuizQuestion> => {
      const response = await client()
        .from("question_options")
        .select(
          "id,question_id,text,position,is_correct"
        )
        .eq("question_id", row.id)
        .order("position");
      if (response.error) throw response.error;
      const options = (
        response.data as unknown as Array<{
          id: number;
          question_id: number;
          text: string;
          position: number;
          is_correct: boolean;
        }>
      ).map(
        (option): QuestionOption => ({
          id: option.id,
          questionId: option.question_id,
          text: option.text,
          position: option.position,
          isCorrect: option.is_correct,
        })
      );
      return {
        id: row.id,
        assessmentSetId: row.assessment_set_id,
        prompt: row.prompt,
        explanation: row.explanation,
        position: row.position,
        required: row.required,
        updatedAt: row.updated_at,
        options,
      };
    })
  );
  return questions;
}

export async function createQuestion(
  assessmentSetId: number,
  position: number
) {
  const { error } = await client().rpc(
    "create_draft_quiz_question",
    {
      expected_assessment_set_id:
        assessmentSetId,
      requested_position: position,
    }
  );
  if (error) throw error;
}

export async function saveQuestion(
  question: QuizQuestion,
  expectedAssessmentId: number
) {
  if (!question.prompt.trim()) {
    throw new Error("Question prompt is required.");
  }
  if (
    question.options.length < 2 ||
    question.options.some(
      (option) => !option.text.trim()
    ) ||
    question.options.filter(
      (option) => option.isCorrect
    ).length !== 1
  ) {
    throw new Error(
      "Questions require at least two options and exactly one correct answer."
    );
  }
  const { data, error } = await client().rpc(
    "save_draft_quiz_question",
    {
      requested_question_id: question.id,
      expected_assessment_set_id:
        expectedAssessmentId,
      expected_updated_at: question.updatedAt,
      requested_prompt: question.prompt,
      requested_explanation:
        question.explanation ?? "",
      requested_required: question.required,
      requested_option_ids: question.options.map(
        (option) => option.id
      ),
      requested_option_texts: question.options.map(
        (option) => option.text
      ),
      requested_correct_index:
        question.options.findIndex(
          (option) => option.isCorrect
        ),
    }
  );
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Quiz question save returned no authoritative row."
    );
  }
  const row = data as unknown as {
    id: number;
    assessment_set_id: number;
    prompt: string;
    explanation: string | null;
    position: number;
    required: boolean;
    updated_at: string;
    options: Array<{
      id: number;
      question_id: number;
      text: string;
      position: number;
      is_correct: boolean;
    }>;
  };
  return {
    id: row.id,
    assessmentSetId: row.assessment_set_id,
    prompt: row.prompt,
    explanation: row.explanation,
    position: row.position,
    required: row.required,
    updatedAt: row.updated_at,
    options: row.options.map(
      (option): QuestionOption => ({
        id: option.id,
        questionId: option.question_id,
        text: option.text,
        position: option.position,
        isCorrect: option.is_correct,
      })
    ),
  } satisfies QuizQuestion;
}

export async function deleteQuestion(
  questionId: number,
  expectedAssessmentId: number
) {
  const { error } = await client()
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("assessment_set_id", expectedAssessmentId);
  if (error) throw error;
}

export async function reorderQuestions(
  assessmentSetId: number,
  questionIds: number[]
) {
  const { error } = await client().rpc(
    "reorder_draft_quiz_questions",
    {
      expected_assessment_set_id:
        assessmentSetId,
      ordered_question_ids: questionIds,
    }
  );
  if (error) throw error;
}
