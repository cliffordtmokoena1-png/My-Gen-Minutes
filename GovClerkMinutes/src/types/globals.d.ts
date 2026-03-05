export {};

declare global {
  interface CustomJwtSessionClaims {
    role?: string;
  }
}
