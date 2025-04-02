import getAuth from "./getAuth";

export async function deleteDefaultSprint(projectKey: string) {
  const { baseUrl, auth } = getAuth();

  // 1. Find board for new project
  const boardRes = await fetch(`${baseUrl}/rest/agile/1.0/board`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  const boardId = (await boardRes.json()).values?.[0]?.id;

  if (!boardId) throw new Error("Board not found.");

  // 2. Get all sprints
  const sprintRes = await fetch(
    `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );
  const sprints = (await sprintRes.json()).values;

  // 3. Find default sprint
  const defaultSprint = sprints.find(
    (s: any) =>
      s.name.toLowerCase().includes("sprint 1") ||
      s.name.toLowerCase().includes("default")
  );

  // 4. Delete if found
  if (defaultSprint?.state === "future") {
    await fetch(`${baseUrl}/rest/agile/1.0/sprint/${defaultSprint.id}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${auth}` },
    });
    console.info(`🗑 Deleted default sprint: ${defaultSprint.name}`);

    return boardId;
  }

  console.info("⚠️ No deletable default sprint found.");

  return boardId;
}
