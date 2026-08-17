export type ContentOperationKind =
  | "duplicate-unit"
  | "copy-lesson"
  | "move-lesson"
  | "bulk-reorder";

export type OperationAvailability = {
  available: boolean;
  reason?: string;
};

export type DuplicateUnitRequest = {
  courseId: number;
  unitId: number;
  title: string;
};

export type CopyLessonRequest = {
  courseId: number;
  lessonId: number;
  sourceUnitId: number;
  destinationUnitId: number;
  title: string;
};

export type MoveLessonRequest = {
  courseId: number;
  lessonId: number;
  sourceUnitId: number;
  destinationUnitId: number;
  position: number;
};

export type BulkReorderRequest = {
  parentKind: "course" | "unit";
  parentId: number;
  orderedIds: number[];
};

export type BulkOperationResult =
  | { status: "success"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export const pendingBackendOperation: OperationAvailability = {
  available: false,
  reason: "This operation will become available after the pending backend deployment.",
};
