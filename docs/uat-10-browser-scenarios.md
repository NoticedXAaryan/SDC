# Ten real-browser acceptance scenarios

These scenarios are written from the user’s point of view. A scenario passes only when the tester actually clicks through the visible interface and captures the final screen. API-only checks do not count.

## 1. Sign in and land in the correct workspace

1. Open the home page and click **Sign in**.
2. Enter a valid member account and submit.
3. Confirm the member dashboard opens.
4. Sign out, sign in as a lead, and confirm lead tools are visible.
5. Try opening an admin page as a normal member and confirm access is refused.

Expected: each role sees the correct starting page and cannot enter a more powerful workspace.

## 2. Create, review, and publish an event

1. Sign in as an event lead and click **Create event**.
2. Enter the event details and save the draft.
3. Confirm it appears in the lead’s event list but not on the public events page.
4. Submit/approve it using the authorized reviewer account.
5. Click **Publish**, then open the public events page and the event details page.

Expected: drafts stay private; approved/published events become publicly visible with the correct details.

## 3. Register and receive a working event pass

1. Sign in as a member and open a published event.
2. Click **Register** and complete any required questions.
3. Confirm the success state and open **My pass**.
4. Refresh the page and confirm the registration and pass remain available.
5. Try registering again and confirm a duplicate is not created.

Expected: one registration is created and a usable QR/pass is shown only to its owner.

## 4. Fill an event, use the waitlist, and promote the next person

1. Use a test event with one available seat.
2. Register the first member and confirm the registration is accepted.
3. Register a second member and confirm the interface says **Waitlisted**.
4. Cancel the first member’s registration.
5. Refresh the second member’s page and confirm they were promoted.

Expected: capacity is never exceeded and the first waiting attendee moves into the open seat.

## 5. Run an event from the lead workspace

1. Open an event’s management page.
2. Add a session and confirm it appears in the schedule.
3. Assign or update an event task and confirm it appears in the correct person’s task queue.
4. Send a test communication and confirm its delivery/status record appears.
5. Open the scanner, scan a valid pass, and confirm the attendee becomes checked in; scan it again and confirm a duplicate check-in is rejected.

Expected: sessions, work assignment, communications, and attendance behave as one connected event workflow.

## 6. Design, issue, verify, and revoke a certificate

1. Create a certificate template and save its design.
2. Link the template to a completed test event.
3. Issue a certificate to a checked-in attendee.
4. Open the attendee’s certificate and its public verification page.
5. Revoke the certificate, refresh verification, and confirm it is visibly marked revoked.

Expected: the certificate is traceable from template to attendee and revocation changes the public truth.

## 7. Move an applicant through recruitment

1. Submit an application as an applicant.
2. Sign in as a reviewer and open the recruitment queue.
3. Move the applicant to interview, schedule a date and meeting link, and confirm it appears in the interview view.
4. Accept the applicant using a different authorized reviewer.
5. Sign back in as the applicant and confirm the new member experience is available.

Expected: every recruitment stage is visible, independently reviewed, and produces the correct final access.

## 8. Purchase something without losing financial control

1. Create an event budget.
2. Submit a procurement request linked to that event.
3. Add/select a vendor and attach a quote.
4. Approve it with a finance reviewer, record the expense, and mark the item received.
5. Open finance, procurement, and inventory views and confirm the same purchase is represented consistently.

Expected: no approval without a quote/vendor; the money and received item remain connected to the event.

## 9. Build and submit a public form

1. Create a form containing text, choice, conditional, and file-upload fields.
2. Publish it and open its public URL in a signed-out browser window.
3. Trigger the conditional field, upload an allowed file, and submit.
4. Confirm the thank-you page/redirect works and the response appears for the form owner.
5. Submit beyond the configured quota and try a disallowed file type.

Expected: visible-field rules, file restrictions, quotas, public access settings, and response review all work in the browser.

## 10. Export and delete an account safely

1. Sign in as a test member and open privacy/compliance settings.
2. Click **Export my data** and confirm the downloaded file contains the member’s expected areas.
3. Start deletion and read the visible consequences.
4. Confirm deletion, then attempt to sign in again.
5. As an administrator, confirm operational audit history remains but the deleted person’s private participation data is removed/anonymized.

Expected: export is usable, deletion requires deliberate confirmation, sign-in is disabled, and retained audit information does not restore private profile data.

## Evidence required for every scenario

- Screenshot of the starting state.
- Screenshot after each important navigation or state change.
- Final screenshot showing the expected outcome.
- The visible URL after navigation.
- Any console/page error captured verbatim.
- Result: **Pass**, **Fail**, or **Blocked**—never an assumed pass.
