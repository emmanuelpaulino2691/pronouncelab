type SignOutClient = { signOut(): Promise<{ error: unknown }> };

export async function signOutAccount(auth: SignOutClient) {
  const { error } = await auth.signOut();
  if (error) throw new Error("Unable to sign out.");
}
