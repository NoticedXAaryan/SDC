import { IEventRepository } from "../interfaces/IEventRepository";
import { IRegistrationRepository } from "../interfaces/IRegistrationRepository";
import crypto from "crypto";

export class EventService {
  constructor(
    private eventRepo: IEventRepository,
    private registrationRepo: IRegistrationRepository
  ) {}

  /**
   * Register a user for an event, automatically handling capacity and waitlisting.
   */
  async registerForEvent(eventId: string, userId: string) {
    // 1. Check if event exists
    const event = await this.eventRepo.findById(eventId);

    if (!event) {
      throw new Error("Event not found");
    }

    // 2. Check if already registered
    const existingRegistration = await this.registrationRepo.findByEventAndUser(eventId, userId);

    if (existingRegistration) {
      throw new Error("Already registered");
    }

    // 3. Check capacity
    const confirmedCount = await this.registrationRepo.countConfirmed(eventId);
    
    let status: "confirmed" | "waitlist" = "confirmed";
    if (event.hasLimitedSeating && event.capacity && confirmedCount >= event.capacity) {
      status = "waitlist";
    }

    // 4. Generate unique pass code
    const passCode = crypto.randomBytes(8).toString("hex");
    
    // 5. Create registration
    const registration = await this.registrationRepo.create({
      eventId,
      userId,
      status,
      passCode
    });
    
    return registration;
  }
}
