import api, { route } from "@forge/api";

export async function createProject(payload: any) {
  const { targetProjectKey, targetProjectName } = payload;

  const myselfRes = await api.asApp().requestJira(route`/rest/api/3/myself`);
  const { accountId } = await myselfRes.json();

  const issueTypeSchemeRes = await api
    .asUser()
    .requestJira(route`/rest/api/3/issuetypescheme?queryString=FNDTN`, {
      headers: {
        Accept: "application/json",
      },
    });

  const schemaId = (await issueTypeSchemeRes.json())?.values[0]?.id;

  const screenRes = await api
    .asUser()
    .requestJira(route`/rest/api/3/issuetypescreenscheme?queryString=FNDTN`, {
      headers: {
        Accept: "application/json",
      },
    });

  const screenId = (await screenRes.json())?.values[0]?.id;

  try {
    const res = await api.asApp().requestJira(route`/rest/api/3/project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: targetProjectKey,
        name: targetProjectName,
        projectTypeKey: "software",
        leadAccountId: accountId,
        issueTypeScheme: schemaId,
        issueTypeScreenScheme: screenId,
      }),
    });

    const data = await res.json();

    if (!res.ok || data?.errors) {
      throw new Error(
        `Failed to create project: ${JSON.stringify(data?.errors)}`
      );
    }
    return {
      message: `✅ Project '${targetProjectKey}' created.`,
      projectId: data.id,
      project: data,
    };
  } catch (error: any) {
    throw new Error(`Failed to create project: ${error}`);
  }
}
