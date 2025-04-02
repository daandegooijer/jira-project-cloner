import getAuth from "./getAuth";

export async function cloneSprints(payload: any) {
  const { sourceProject, targetBoardId } = payload;
  const { baseUrl, auth } = getAuth();

  const boardsRes = await fetch(
    `${baseUrl}/rest/agile/1.0/board?projectKeyOrId=${sourceProject}`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );
  const sourceBoardId = (await boardsRes.json()).values?.[0]?.id;
  if (!sourceBoardId) throw new Error("Could not find source board.");

  const sprintsRes = await fetch(
    `${baseUrl}/rest/agile/1.0/board/${sourceBoardId}/sprint`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  const sprints = (await sprintsRes.json()).values;
  const sprintMap: Record<string, string> = {};

  await Promise.all(
    sprints.map(async (sprint: any) => {
      console.info(`Cloning ${sprint.name}...`);

      const res = await fetch(`${baseUrl}/rest/agile/1.0/sprint`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: sprint.name,
          originBoardId: targetBoardId,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.warn(`❌ Failed to clone ${sprint.name}: ${error}`);
      } else {
        const created = await res.json();
        sprintMap[sprint.id] = created.id;
        console.info(`✅ Cloned ${sprint.name}`);
      }
    })
  );

  return {
    message: `Cloned ${sprints.length} sprint(s).`,
    sprintMap,
  };
}
