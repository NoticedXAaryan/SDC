export async function createGitHubIssue(title: string, body: string, labels: string[] = []) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
    console.warn("GitHub integration missing. Skipping issue creation.");
    return null;
  }

  const [owner, repo] = process.env.GITHUB_REPO.split("/");

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to create GitHub issue:", err);
    return null;
  }
}
