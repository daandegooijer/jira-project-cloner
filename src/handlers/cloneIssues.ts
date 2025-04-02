import api, { route } from "@forge/api";
import getAuth from "./getAuth";

export async function cloneIssues(payload: any) {
  const { sourceProject, targetProjectKey, sprintMap } = payload;
  const { baseUrl, auth } = getAuth();

  const boardRes = await fetch(
    `${baseUrl}/rest/agile/1.0/board?projectKeyOrId=${sourceProject}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const sourceBoardId = (await boardRes.json())?.values?.[0]?.id;
  if (!sourceBoardId) throw new Error("No board found");

  const issuesRes = await fetch(
    `${baseUrl}/rest/agile/1.0/board/${sourceBoardId}/issue`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  const issues = await issuesRes.json();

  await runInBatches(issues.issues, 5, async (issue: any) => {
    try {
      const fields = issue.fields;
      const summary = fields.summary;
      const descriptionADF = wrapInADF(
        fields.description?.content ? extractText(fields.description) : ""
      );
      const oldSprintId = fields?.customfield_10021?.[0]?.id;
      const newSprintId = oldSprintId ? sprintMap?.[oldSprintId] : undefined;

      const cloneBody: any = {
        fields: {
          project: { key: targetProjectKey },
          summary,
          description: descriptionADF,
          issuetype: { id: fields.issuetype.id },
          customfield_10025: fields.customfield_10025,
          assignee: null,
        },
      };

      if (newSprintId) {
        cloneBody.fields.customfield_10021 = newSprintId;
      }

      const issueRes = await api.asApp().requestJira(route`/rest/api/3/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cloneBody),
      });

      if (!issueRes.ok) {
        const error = await issueRes.text();
        console.warn(`❌ Failed to clone issue: ${summary}\n${error}`);
        return;
      }

      const created = await issueRes.json();

      if (newSprintId) {
        try {
          await fetch(`${baseUrl}/rest/agile/1.0/sprint/${newSprintId}/issue`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ issues: [created.key] }),
          });
        } catch (err) {
          console.warn(
            `⚠️ Could not move ${created.key} to sprint: ${newSprintId}`
          );
        }
      }

      console.info(`✅ Cloned issue: ${summary}`);
    } catch (err) {
      console.error(`❌ Unexpected error for issue: ${issue.key}`, err);
    }
  });

  return { message: `Cloned ${issues.issues.length} issue(s).` };
}

// 🧠 Batching helper
async function runInBatches<T>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<void>
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Promise.all(chunk.map(handler));
    await new Promise((r) => setTimeout(r, 300));
  }
}

function wrapInADF(text: string) {
  return {
    type: "doc",
    version: 1,
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      },
    ],
  };
}

function extractText(desc: any): string {
  try {
    return desc.content
      ?.map((c: any) => c.content?.map((d: any) => d.text).join(" ") || "")
      .join("\n");
  } catch {
    return "";
  }
}
