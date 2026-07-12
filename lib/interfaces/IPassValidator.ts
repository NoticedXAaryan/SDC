export interface IPassValidator {
  validate(payload: string): Promise<{ valid: boolean; eventId?: string; userId?: string; passCode?: string; iat?: number }>
}
