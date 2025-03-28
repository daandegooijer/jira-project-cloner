//@ts-nocheck
import React, { useState, ChangeEvent } from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@forge/bridge";

export default function App() {
  const [sourceProject, setSourceProject] = useState<string>("FNDTNTMPLT");
  const [targetProjectKey, setTargetProjectKey] = useState<string>("");
  const [targetProjectName, setTargetProjectName] = useState<string>("");
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [log, setLog] = useState<string>("");

  const handleClone = async () => {
    setIsCloning(true);
    setLog("⏳ Cloning in progress...");

    try {
      const result = await invoke("startClone", {
        payload: {
          sourceProject,
          targetProjectKey,
          targetProjectName,
        },
      });
      setLog(result.message);
    } catch (err) {
      console.error(err);
      setLog("❌ Something went wrong. Check the console.");
    }
    setIsCloning(false);
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        🔁 Jira Project Cloner
      </h2>

      <div style={{ marginBottom: 12 }}>
        <label
          style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
        >
          Source Project Key:
        </label>
        <input
          style={{
            width: "100%",
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
          type="text"
          value={sourceProject}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSourceProject(e.target.value)
          }
          placeholder="e.g., FNDTNTMPLT"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label
          style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
        >
          Target Project Key:
        </label>
        <input
          style={{
            width: "100%",
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
          type="text"
          value={targetProjectKey}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTargetProjectKey(e.target.value)
          }
          placeholder="e.g., TST"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label
          style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}
        >
          Target Project Name:
        </label>
        <input
          style={{
            width: "100%",
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
          type="text"
          value={targetProjectName}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setTargetProjectName(e.target.value)
          }
          placeholder="e.g., Test Project"
        />
      </div>

      <button
        onClick={handleClone}
        disabled={isCloning}
        style={{
          backgroundColor: isCloning ? "#94a3b8" : "#2563eb",
          color: "white",
          padding: "10px 16px",
          borderRadius: 4,
          border: "none",
          cursor: isCloning ? "not-allowed" : "pointer",
        }}
      >
        🚀 Clone Project
      </button>

      <pre
        style={{
          marginTop: 20,
          fontSize: 14,
          backgroundColor: "#f3f4f6",
          padding: 12,
          borderRadius: 4,
          whiteSpace: "pre-wrap",
        }}
      >
        {log}
      </pre>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
