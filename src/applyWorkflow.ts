//@ts-nocheck
import api from "@forge/api";

export async function applyWorkflowScheme(
  projectId: string,
  workflowSchemeId: number
): Promise<{ message: string }> {
  const res = await api
    .asApp()
    .requestJira("/rest/api/3/workflowscheme/project", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        workflowSchemeId,
      }),
    });

  if (!res.ok) {
    const error = await res.text();
    return { message: `❌ Failed to apply workflow scheme: ${error}` };
  }

  return {
    message: `✅ Workflow scheme ${workflowSchemeId} applied to project ${projectId}.`,
  };
}
