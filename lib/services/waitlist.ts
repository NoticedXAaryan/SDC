import { IWaitlistService } from "../interfaces/IWaitlistService";
import { IRegistrationRepository } from "../interfaces/IRegistrationRepository";

export class WaitlistService implements IWaitlistService {
  constructor(private registrationRepo: IRegistrationRepository) {}

  async add(eventId: string, userId: string): Promise<{ position: number }> {
    await this.registrationRepo.create({
      eventId,
      userId,
      status: "waitlist",
      passCode: "WAITLIST"
    });
    return { position: await this.registrationRepo.countWaitlisted(eventId) };
  }

  async promote(eventId: string): Promise<any | null> {
    const nextInLine = await this.registrationRepo.getFirstWaitlisted(eventId);
    if (nextInLine) {
      await this.registrationRepo.updateStatus(nextInLine.id, "confirmed");
      // Additionally we would enqueue email via BullMQ here
      return nextInLine;
    }
    return null;
  }
}
