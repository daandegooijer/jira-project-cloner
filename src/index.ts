// //@ts-nocheck
import api, { route } from "@forge/api";
import { cloneIssues } from "./cloneIssues";
import { cloneSprints } from "./cloneSprints";
import { applyWorkflowScheme } from "./applyWorkflow";

export async function startClone(event: any) {
  const payload = event?.call?.payload?.payload || {};

  const { sourceProject, targetProjectKey, targetProjectName } = payload;

  if (!sourceProject || !targetProjectKey || !targetProjectName) {
    return { message: "❌ Missing fields in payload." };
  }

  try {
    const myselfRes = await api.asApp().requestJira(route`/rest/api/3/myself`);
    const myself = await myselfRes.json();

    if (!myself.accountId) {
      return { message: "❌ Failed to fetch user account ID." };
    }

    const projectRes = await api
      .asApp()
      .requestJira(route`/rest/api/3/project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: targetProjectKey,
          name: targetProjectName,
          projectTypeKey: "software",
          projectTemplateKey:
            "com.pyxis.greenhopper.jira:gh-simplified-scrum-classic",
          leadAccountId: myself.accountId,
        }),
      });

    if (!projectRes.ok) {
      const error = await projectRes.text();
      return { message: `❌ Failed to create project: ${error}` };
    }

    const projectData = await projectRes.json();

    // 🔍 Fetch workflow scheme from source project
    const schemeRes = await api
      .asApp()
      .requestJira(
        route`/rest/api/3/workflowscheme/project?projectIdOrKey=${sourceProject}`
      );
    const schemeData = await schemeRes.json();
    const workflowSchemeId = schemeData?.values?.[0]?.workflowScheme?.id;

    let applyWorkflowResult = { message: "⚠️ No workflow scheme applied." };
    if (workflowSchemeId) {
      applyWorkflowResult = await applyWorkflowScheme(
        projectData.id,
        parseInt(workflowSchemeId)
      );
    }

    // Clone sprints and issues
    const cloneSprintResult = await cloneSprints(
      sourceProject,
      targetProjectKey
    );
    const cloneIssueResult = await cloneIssues(sourceProject, targetProjectKey);

    return {
      message: [
        `✅ Project '${targetProjectName}' created successfully with key '${targetProjectKey}'!`,
        applyWorkflowResult.message,
        cloneSprintResult.message,
        cloneIssueResult.message,
      ].join("\n"),
    };
  } catch (err: any) {
    console.error(err);
    return { message: `❌ Unexpected error: ${err.message}` };
  }
}
