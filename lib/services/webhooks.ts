import { logger } from "@/lib/logger";

/**
 * Service to dispatch webhooks to Discord, Slack, etc.
 */
export class WebhookService {
  static async notifyDiscord(webhookUrl: string | undefined, payload: { content: string; embeds?: any[] }) {
    if (!webhookUrl) {
      logger.warn("Discord webhook URL not provided. Skipping notification.");
      return false;
    }

    try {
      logger.info({ content: payload.content }, "Stub: Sending Discord webhook");
      // TODO: const res = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      return true;
    } catch (error) {
      logger.error({ error }, "Failed to send Discord webhook");
      return false;
    }
  }

  static async notifySlack(webhookUrl: string | undefined, payload: { text: string; blocks?: any[] }) {
    if (!webhookUrl) {
      logger.warn("Slack webhook URL not provided. Skipping notification.");
      return false;
    }

    try {
      logger.info({ text: payload.text }, "Stub: Sending Slack webhook");
      // TODO: const res = await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      return true;
    } catch (error) {
      logger.error({ error }, "Failed to send Slack webhook");
      return false;
    }
  }

  static async broadcastNewEvent(eventName: string, eventUrl: string) {
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    await this.notifyDiscord(discordUrl, {
      content: `🎉 New Event Announced: **${eventName}**! RSVP here: ${eventUrl}`
    });
  }
}
