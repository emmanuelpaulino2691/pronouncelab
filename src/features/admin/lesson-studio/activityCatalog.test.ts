import { describe, expect, it } from "vitest";

import { activityCatalog } from "./activityCatalog";
import { activityTypes } from "./types";

describe("activityCatalog", () => {
  it("contains every current activity type exactly once", () => {
    const catalogTypes = activityCatalog.map(
      (activity) => activity.type
    );

    expect([...catalogTypes].sort()).toEqual(
      [...activityTypes].sort()
    );
  });

  it("does not contain duplicate activity types", () => {
    const catalogTypes = activityCatalog.map(
      (activity) => activity.type
    );

    expect(new Set(catalogTypes).size).toBe(
      catalogTypes.length
    );
  });

  it("keeps Practice compatible but unavailable for creation", () => {
    const practice = activityCatalog.find(
      (activity) => activity.type === "practice"
    );

    expect(practice).toMatchObject({
      canCreate: false,
      future: false,
    });
  });

  it("keeps Quiz available for creation", () => {
    const quiz = activityCatalog.find(
      (activity) => activity.type === "quiz"
    );

    expect(quiz).toMatchObject({
      canCreate: true,
      future: false,
    });
  });

  it("makes Interactive Practice available for new authoring", () => {
    const interactivePractice = activityCatalog.find(
      (activity) =>
        activity.type === "interactive_practice"
    );

    expect(interactivePractice).toMatchObject({
      title: "Interactive Practice",
      canCreate: true,
      future: false,
    });
  });

  it("keeps AI Speaking Mission available for creation", () => {
    const aiMission = activityCatalog.find(
      (activity) =>
        activity.type === "ai_speaking_mission"
    );

    expect(aiMission).toMatchObject({
      canCreate: true,
      future: false,
    });
  });

  it("presents the stored theory type as Learn", () => {
    const learn = activityCatalog.find(
      (activity) => activity.type === "theory"
    );

    expect(learn?.title).toBe("Learn");
  });
});
