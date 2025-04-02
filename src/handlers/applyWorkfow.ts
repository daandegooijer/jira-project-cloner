import api, { route } from "@forge/api";

export async function applyWorkflow(payload: any) {
  const {
    sourceProject,
    targetProjectKey,
    targetProjectName,
    targetProjectId,
  } = payload;

  const projectRes = await api
    .asApp()
    .requestJira(route`/rest/api/3/project/${sourceProject}`);

  const project = await projectRes.json();

  const schemaRes = await api
    .asApp()
    .requestJira(
      route`/rest/api/3/workflowscheme/project?projectId=${project.id}`
    );

  const schemeData = await schemaRes.json();

  const workflowSchemeId = schemeData?.values?.[0]?.workflowScheme?.id;

  if (!workflowSchemeId) {
    return { message: "⚠️ No workflow scheme found, skipping..." };
  }

  const assignRes = await api
    .asApp()
    .requestJira(route`/rest/api/3/workflowscheme/project`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowSchemeId: parseInt(workflowSchemeId),
        projectId: targetProjectId,
      }),
    });

  if (!assignRes.ok) {
    const error = await assignRes.text();
    throw new Error(`Failed to assign workflow: ${error}`);
  }

  return { message: `Workflow applied to '${targetProjectKey}'.` };
}
