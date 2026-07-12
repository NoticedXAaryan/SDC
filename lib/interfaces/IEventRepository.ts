export interface IEventRepository {
  findById(eventId: string): Promise<any>
  updateCapacity(eventId: string, newCount: number): Promise<void>
}
