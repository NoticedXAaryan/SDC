export interface IRegistrationRepository {
  findByEventAndUser(eventId: string, userId: string): Promise<any | null>;
  countConfirmed(eventId: string): Promise<number>;
  create(registration: any): Promise<any>;
  getFirstWaitlisted(eventId: string): Promise<any | null>;
  updateStatus(registrationId: string, status: "confirmed" | "waitlist" | "cancelled" | "checked_in" | "no_show"): Promise<void>;
}
