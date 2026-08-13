import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createTask, updateTask } from "@/lib/dal/tasks";

describe("Tasks DAL Integration Tests & Security Audit", () => {
  let adminId: string;
  let memberId: string;
  let member2Id: string;
  let adminSession: any;
  let memberSession: any;
  let member2Session: any;
  let taskId: string;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    memberId = await createTestUser("member");
    member2Id = await createTestUser("member");
    adminSession = getMockSession(adminId, "admin");
    memberSession = getMockSession(memberId, "member");
    member2Session = getMockSession(member2Id, "member");
  });

  afterAll(async () => {
    if (taskId) {
      await db.delete(tasks).where(eq(tasks.id, taskId));
    }
    await cleanupTestUser(adminId);
    await cleanupTestUser(memberId);
    await cleanupTestUser(member2Id);
  });

  it("should block member from creating a task", async () => {
    await expect(
      createTask(memberSession, { title: "New Task" })
    ).rejects.toThrow("Unauthorized");
  });

  it("should allow admin to create a task assigned to member", async () => {
    const task = await createTask(adminSession, {
      title: "Audit DB",
      assigneeId: memberId,
    });
    
    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.status).toBe("todo");
    taskId = task.id;
  });

  it("should block unassigned member from updating the task (IDOR)", async () => {
    // member2 is not the assignee, they shouldn't be able to update it
    await expect(
      updateTask(member2Session, { id: taskId, status: "in_progress" })
    ).rejects.toThrow("You can only update tasks assigned to you");
  });

  it("should allow assignee to update task status", async () => {
    const updated = await updateTask(memberSession, { id: taskId, status: "in_progress" });
    expect(updated.status).toBe("in_progress");
  });
});
