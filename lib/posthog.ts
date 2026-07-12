import { PostHog } from 'posthog-node';

// P7-01: Concrete PostHog event taxonomy
export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_dummy_key',
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com' }
);

export function trackServerEvent(eventName: string, distinctId: string, properties?: Record<string, any>) {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture({
      distinctId,
      event: eventName,
      properties,
    });
  }
}

// Taxonomy defined by the roadmap
export type AnalyticsEvent = 
  | 'application_submitted'
  | 'certificate_issued'
  | 'achievement_approved'
  | 'resource_request_submitted'
  | 'resource_request_fulfilled'
  | 'content_posted'
  | 'event_registered'
  | 'event_checked_in';
