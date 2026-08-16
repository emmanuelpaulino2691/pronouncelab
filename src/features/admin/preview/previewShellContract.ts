// Authoring Preview reuses learner rendering, never learner identity/navigation.
// Supabase owns one session per browser profile, so Preview must not authenticate.
export const studentPreviewShellContract = { usesLearnerNavigation: false, mutatesAuthentication: false } as const;
