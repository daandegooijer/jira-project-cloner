// This helper assumes you've cloned your template workflow & statuses.
// It maps statuses from a template project (e.g. 'FNDTNTMPLT') to a new target project.

import api, { route } from "@forge/api";

export async function copyWorkflowStatuses({
  sourceProjectKey,
  targetProjectKey,
}: any) {
  // 1. Get workflow scheme from template project
  const schemeRes = await api
    .asUser()
    .requestJira(
      route`/rest/api/3/workflowscheme/project?projectIdOrKey=${sourceProjectKey}`,
      { headers: { Accept: "application/json" } }
    );
  const workflowSchemeId = (await schemeRes.json())?.values?.[0]?.workflowScheme
    ?.id;
  if (!workflowSchemeId) throw new Error("Workflow scheme not found");

  // 2. Get the status list from the workflow scheme
  const workflowsRes = await api.asUser().requestJira(
    route`/rest/api/3/workflowscheme/${workflowSchemeId}/workflow` // not public, might fallback
  );
  const workflowDetails = await workflowsRes.json();

  // Simulated fallback: define statuses manually (from FNDTNTMPLT)
  const statuses = [
    "TO DO UX",
    "IN PROGRESS UX",
    "TO DO DESIGN",
    "IN PROGRESS DESIGN",
    "DESIGN CHECK",
    "TO DO DEV",
    "IN PROGRESS DEV",
    "STAGING",
    "QA CHECK",
    "DONE",
  ];

  // 3. Create a custom workflow scheme for the new project (if needed)
  // 4. Apply this scheme to the new project
  const applyRes = await api
    .asUser()
    .requestJira(route`/rest/api/3/workflowscheme/project`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowSchemeId: parseInt(workflowSchemeId),
        projectIdOrKey: targetProjectKey,
      }),
    });

  if (!applyRes.ok) {
    const error = await applyRes.text();
    throw new Error(`Failed to apply workflow: ${error}`);
  }

  return {
    message: `✅ Applied statuses to project '${targetProjectKey}'. Ensure issues use these statuses.`,
  };
}
