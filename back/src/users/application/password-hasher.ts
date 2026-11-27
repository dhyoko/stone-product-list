export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;

  abstract verify(input: { readonly hash: string; readonly password: string }): Promise<boolean>;
}
