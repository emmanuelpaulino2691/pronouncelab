export function getEmptyClassesContent(canCreate: boolean) {
  return canCreate
    ? { description: "Classes will let you organize students and assign published courses. Class creation is not connected yet, but you can review the planned setup.", showSetupAction: true }
    : { description: "No classes are available to your role. Classroom management is limited to teachers and administrators.", showSetupAction: false };
}
