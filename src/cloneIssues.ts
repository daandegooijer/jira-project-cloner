//@ts-nocheck
import api, { route } from "@forge/api";

export async function cloneIssues(
  sourceProject: string,
  targetProjectKey: string
): Promise<{ message: string }> {
  const allIssues = await fetchIssues(sourceProject);
  const createdKeys: string[] = [];

  for (const issue of allIssues) {
    const { fields } = issue;
    const summary = fields.summary || "Untitled";
    const description = fields.description || "";
    const issueTypeId = fields.issuetype.id;

    const res = await api.asApp().requestJira(route`/rest/api/3/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          project: { key: targetProjectKey },
          summary,
          description,
          issuetype: { id: issueTypeId },
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      createdKeys.push(data.key);
    }
  }

  return { message: `✅ Cloned ${createdKeys.length} issues.` };
}

async function fetchIssues(projectKey: string): Promise<any[]> {
  let startAt = 0;
  let allIssues: any[] = [];
  let total = 1;

  while (startAt < total) {
    const response = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/search?jql=project=${projectKey}&startAt=${startAt}&maxResults=50`
      );
    const data = await response.json();
    total = data.total;
    allIssues = [...allIssues, ...data.issues];
    startAt += 50;
  }

  return allIssues;
}
