import * as SecureStore from 'expo-secure-store';
const SESSION_KEY = 'preemietrack.session';
export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};
export const saveSession = (session: Session) =>
  SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
export async function getSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}
export const clearSession = () => SecureStore.deleteItemAsync(SESSION_KEY);
