import { NextResponse, NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-wrapper";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { projects } from "@/lib/db/schema";
import { isNotNull } from "drizzle-orm";

export const GET = withApiHandler(async (req: NextRequest) => {
  try {
    // Optional: Add authorization header check to ensure only Vercel Cron can call this
    
    const allProjects = await db.select().from(projects).where(isNotNull(projects.githubUrl));
    let updatedCount = 0;

    for (const project of allProjects) {
      if (project.githubUrl) {
        try {
          // Extract owner and repo from github URL
          const urlParts = new URL(project.githubUrl).pathname.split('/').filter(Boolean);
          if (urlParts.length >= 2) {
            const owner = urlParts[0];
            const repo = urlParts[1];
            
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
              headers: {
                "Accept": "application/vnd.github.v3+json",
                // Optional: "Authorization": `token ${process.env.GITHUB_TOKEN}`
              }
            });
            
            if (res.ok) {
              const data = await res.json();
              // In this schema, we don't have a 'stars' column yet, but we could update upvotes or metadata.
              // For now, just logging it as proof of concept for the cron.
              logger.info(`Synced ${repo}: ${data.stargazers_count} stars`);
              updatedCount++;
            } else {
              logger.error(`Failed to fetch stars for ${repo}: ${res.statusText}`);
            }
          }
        } catch (e) {
          logger.error(`Failed to sync stars for ${project.id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    logger.error(`Internal server error in github sync: ${String(error)}`);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
});
