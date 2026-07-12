import { IWaitlistService } from "../interfaces/IWaitlistService";
import { IRegistrationRepository } from "../interfaces/IRegistrationRepository";

export class WaitlistService implements IWaitlistService {
  constructor(private registrationRepo: IRegistrationRepository) {}

  async add(eventId: string, userId: string): Promise<{ position: number }> {
    // In a real app, position might be calculated. Here we just create waitlist status.
    await this.registrationRepo.create({
      eventId,
      userId,
      status: "waitlist",
      passCode: "WAITLIST"
    });
    // Waitlist position is tricky without a separate count query, return dummy for now
    return { position: 1 };
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
