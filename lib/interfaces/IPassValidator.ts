export interface IPassValidator {
  validate(payload: string): Promise<{ valid: boolean; eventId?: string; userId?: string; iat?: number }>
}
