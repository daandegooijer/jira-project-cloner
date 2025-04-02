import api, { route } from "@forge/api";
import getAuth from "./getAuth";

export async function createBoard(payload: any) {
  const { targetProjectKey, targetProjectName } = payload;
  const { baseUrl, auth } = getAuth();

  const filterRes = await api.asUser().requestJira(route`/rest/api/3/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `${targetProjectKey} Filter ${Date.now()}`,
      jql: `project = ${targetProjectKey}`,
      favourite: false,
    }),
  });

  const filterId = (await filterRes.json()).id;

  if (!filterRes.ok || !filterId) {
    console.error(`❌ Failed to create filter: ${filterId}`);
    throw new Error(`Failed to create filter: ${JSON.stringify(filterRes)}`);
  }

  // Fetch all groups
  const groupsRes = await api
    .asUser()
    .requestJira(route`/rest/api/3/groups/picker?query=`, {
      headers: {
        Accept: "application/json",
      },
    });

  const groups = (await groupsRes.json()).groups;

  // Grant access to each group
  for (const group of groups) {
    await api
      .asUser()
      .requestJira(route`/rest/api/3/filter/${filterId}/permission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "group",
          groupname: group.name,
        }),
      });
  }

  const boardRes = await fetch(`${baseUrl}/rest/agile/1.0/board`, {
    method: "POST",

    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${targetProjectName} board`,
      type: "scrum",
      filterId,
      location: {
        type: "project",
        projectKeyOrId: targetProjectKey,
      },
    }),
  });

  if (!boardRes.ok) {
    const error = await boardRes.text();
    throw new Error(`Failed to create board: ${error}`);
  }
  const board = await boardRes.json();

  console.log(`🧩 Board created: ${board.name} (ID: ${board.id})`);

  return {
    message: `Board '${board.name}' created.`,
    boardId: board.id,
    board,
  };
}
