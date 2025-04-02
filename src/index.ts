import api, { route } from "@forge/api";
import { applyWorkflow } from "./handlers/applyWorkfow";
import { createProject } from "./handlers/createProject";
import { cloneSprints } from "./handlers/cloneSprints";
import { cloneIssues } from "./handlers/cloneIssues";
import { createBoard } from "./handlers/createBoard";

export async function startClone(call: any) {
  const { sourceProject, targetProjectKey, targetProjectName } =
    call.call?.payload;

  let projectCreated = false;
  const payload = {
    sourceProject,
    targetProjectKey,
    targetProjectName,
    targetProjectId: null,
    targetBoardId: null,
    sprintMap: "",
  };

  // 1. Create Project
  try {
    const project = await createProject(payload);

    projectCreated = true;

    console.info(`${project.message} (ID: ${project.projectId})`);

    payload["targetProjectId"] = project.projectId;

    const board = await createBoard(payload);

    payload["targetBoardId"] = board.boardId;

    if (!project.projectId || !board.boardId) {
      throw new Error(
        `Failed to create project or board. Project ID: ${project.projectId}, Board ID: ${board.boardId}`
      );
    }

    const workflow = await applyWorkflow(payload);

    console.info(`${workflow.message}`);

    const clonedSprints = await cloneSprints(payload);

    //@ts-ignore
    payload["sprintMap"] = clonedSprints.sprintMap;

    console.info(`${clonedSprints.message}`);

    const clonedIssues = await cloneIssues(payload);

    console.info(`${clonedIssues.message}`);

    return {
      message: [
        project.message,
        workflow.message,
        clonedSprints.message,
        clonedIssues.message,
        "🎉 Full cloning done!",
      ].join("/n"),
    };
  } catch (err: any) {
    console.error("❌ Cloning failed:", err.message);

    // 🔥 Try to delete project (and trash) if it was created
    if (projectCreated) {
      try {
        await deleteProject(targetProjectKey);
        console.warn("🗑️ Project cleanup successful.");
      } catch (cleanupErr: any) {
        console.error("⚠️ Cleanup failed:", cleanupErr.message);
      }
    }

    return {
      message: `❌ Cloning failed: ${err.message}`,
    };
  }
}

export async function deleteProject(projectKey: any) {
  const res = await api
    .asApp()
    .requestJira(route`/rest/api/3/project/${projectKey}`, {
      method: "DELETE",
    });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to delete project: ${err}`);
  }

  return { message: `Project ${projectKey} deleted.` };
}
