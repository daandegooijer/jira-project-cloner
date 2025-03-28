//@ts-nocheck
import api, { route } from "@forge/api";

export async function cloneSprints(
  sourceProject: string,
  targetProjectKey: string
): Promise<{ message: string }> {
  const boardId = await getBoardId(targetProjectKey);
  const sourceBoardId = await getBoardId(sourceProject);

  const res = await api
    .asApp()
    .requestJira(route`/rest/agile/1.0/board/${sourceBoardId}/sprint`);
  const data = await res.json();

  const createdSprints: string[] = [];

  for (const sprint of data.values) {
    if (sprint.state === "closed") continue; // skip old sprints

    const result = await api
      .asApp()
      .requestJira(route`/rest/agile/1.0/sprint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sprint.name,
          originBoardId: boardId,
          goal: sprint.goal || "",
        }),
      });

    if (result.ok) {
      const created = await result.json();
      createdSprints.push(created.name);
    }
  }

  return { message: `✅ Cloned ${createdSprints.length} sprints.` };
}

async function getBoardId(projectKeyOrId: string): Promise<number> {
  const res = await api
    .asApp()
    .requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKeyOrId}`);
  const data = await res.json();
  return data.values[0].id;
}
