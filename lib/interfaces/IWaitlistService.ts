export interface IWaitlistService {
  add(eventId: string, userId: string): Promise<{ position: number }>
  promote(eventId: string): Promise<any | null>
}
