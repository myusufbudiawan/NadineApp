export interface IdentityRepository {
  findUserByEmail(email: string): Promise<{ id: string; email: string } | null>;
}
