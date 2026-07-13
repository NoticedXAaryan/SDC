# Testing Issues Log

This file contains issues found during the browser testing process of the Club management system.

## Auth & Admin Dashboard
- **Global JS Crash on Initial Load**: `RangeError: Invalid time value` occurred initially on all pages (`/`, `/login`, etc.) due to an invalid session cookie format (leftover from a previous db reset). Navigating to `/api/logout` cleared the cookie and resolved the initial load crash, but highlights a vulnerability to unsafe date string parsing on the client.

## Events Management
- **Event Creation Form Crash**: Submitting the event creation form at `/events/create` (either with filled or empty date/time fields) causes a global client-side JS crash with `RangeError: Invalid time value at Date.toISOString`. The component code likely calls `new Date(value).toISOString()` in the onSubmit handler or onChange handlers without validating that the value is a valid date string.

## General UI & Flow
- *(No issues yet)*
