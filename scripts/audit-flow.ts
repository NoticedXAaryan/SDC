import 'dotenv/config';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { expenses } from '@/lib/db/schema';

async function runAudit() {
  const BASE_URL = 'http://localhost:3000';
  console.log("Starting System Audit against", BASE_URL);

  let cookies: string[] = [];

  // Helper to fetch with cookies
  const apiFetch = async (path: string, options: any = {}) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
        'Cookie': cookies.join('; '),
        ...(options.headers || {})
      }
    });
    
    // Save cookies
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      // Very naive cookie parsing for test script
      cookies.push(setCookie.split(';')[0]);
    }
    
    return res;
  };

  try {
    console.log("--- PHASE 1: Authentication ---");
    
    // 1. Register a test user
    const userSuffix = Math.random().toString(36).substring(7);
    const testEmail = `audit-${userSuffix}@example.com`;
    const testPassword = "Password123!";
    
    console.log(`Registering user: ${testEmail}`);
    const regRes = await apiFetch('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: `Audit User ${userSuffix}`
      })
    });
    
    const regData = await regRes.json();
    console.log("Registration status:", regRes.status, regData);
    if (!regRes.ok) throw new Error("Registration failed");
    
    // Elevate user to owner directly via DB to bypass email verification and get permissions
    console.log(`Elevating user ${testEmail} to owner...`);
    await db.update(user).set({ role: 'owner', emailVerified: true }).where(eq(user.email, testEmail));
    
    // 2. Log in
    console.log(`Logging in user: ${testEmail}`);
    const loginRes = await apiFetch('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await loginRes.json();
    console.log("Login status:", loginRes.status, loginData);
    if (!loginRes.ok) throw new Error("Login failed");

    // 3. Fetch session
    console.log(`Fetching session`);
    const sessionRes = await apiFetch('/api/auth/get-session');
    const sessionData = await sessionRes.json();
    console.log("Session data:", sessionData);
    
    console.log("--- PHASE 2: Events ---");
    
    console.log("Attempting to create event as owner");
    const createEventRes = await apiFetch('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: "Audit Test Event",
        slug: `audit-test-${userSuffix}`,
        description: "Test event for audit",
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        capacity: 100,
        status: "published",
        isPublic: true,
        type: "workshop"
      })
    });
    
    const eventData = await createEventRes.json();
    console.log("Create event status:", createEventRes.status, eventData);
    if (!createEventRes.ok) throw new Error("Failed to create event");
    const eventId = eventData.id;

    console.log("--- PHASE 3: Finance ---");
    console.log(`Allocating budget for event ${eventId}`);
    
    // Testing budget allocation
    const allocateBudgetRes = await apiFetch(`/api/events/${eventId}/budget`, {
      method: 'POST',
      body: JSON.stringify({
        allocated: 1000
      })
    });
    
    const budgetData = await allocateBudgetRes.json();
    console.log("Allocate budget status:", allocateBudgetRes.status, budgetData);
    if (!allocateBudgetRes.ok) throw new Error("Failed to allocate budget");
    const budgetId = budgetData.budgetId;
    
    console.log(`Submitting expense for budget ${budgetId}`);
    const submitExpenseRes = await apiFetch('/api/finance/expenses', {
      method: 'POST',
      body: JSON.stringify({
        budgetId: budgetId,
        amount: 250,
        category: "food"
      })
    });
    const expenseData = await submitExpenseRes.json();
    console.log("Submit expense status:", submitExpenseRes.status, expenseData);
    if (!submitExpenseRes.ok) throw new Error("Failed to submit expense");
    const expenseId = expenseData.id;

    console.log(`Approving expense ${expenseId}`);
    // A user cannot approve their own expense, so we must mock another user
    console.log("Creating dummy user and modifying DB directly to change expense creator so we can approve it...");
    const dummyUserId = "dummy-" + userSuffix;
    await db.insert(user).values({
      id: dummyUserId,
      email: `dummy-${userSuffix}@example.com`,
      name: "Dummy User",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.update(expenses).set({ createdBy: dummyUserId }).where(eq(expenses.id, expenseId));

    const approveExpenseRes = await apiFetch(`/api/finance/expenses/${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: "approved"
      })
    });
    console.log("Approve expense status:", approveExpenseRes.status, await approveExpenseRes.text());
    
    console.log("--- PHASE 4: Recruitment ---");
    console.log("Submitting a recruitment application");
    const submitAppRes = await apiFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        turnstileToken: "dummy",
        applicationCycle: "2026-odd-sem",
        status: "applied",
        skills: "React, Node.js",
        teamPreference: "tech",
        whyJoin: "I love building stuff",
        availability: "10 hours/week"
      })
    });
    const submitAppData = await submitAppRes.json();
    console.log("Submit application status:", submitAppRes.status, submitAppData);
    if (!submitAppRes.ok) throw new Error("Failed to submit application");
    const applicationId = submitAppData.applicationId;
    
    console.log(`Approving application ${applicationId}`);
    const approveAppRes = await apiFetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: "accepted",
        feedback: "Great skills"
      })
    });
    console.log("Approve application status:", approveAppRes.status, await approveAppRes.text());

    console.log("--- PHASE 5: Inventory ---");
    console.log("Creating an inventory item");
    const createInventoryRes = await apiFetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({
        name: "Test Audit Item",
        qtyTotal: 10
      })
    });
    const inventoryData = await createInventoryRes.json();
    console.log("Create inventory status:", createInventoryRes.status, inventoryData);
    if (!createInventoryRes.ok) throw new Error("Failed to create inventory item");
    
    console.log("Audit script completed successfully.");
  } catch (error) {
    console.error("Audit failed:", error);
  }
}

runAudit();
