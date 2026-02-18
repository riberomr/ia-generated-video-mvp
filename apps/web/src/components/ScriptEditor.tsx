import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingsContext"; // Import context
import { FullScriptEditor } from "./SmartScripting/FullScriptEditor";

import { ScriptMetadata } from "./SmartScripting/ScriptMetadataEditor";

interface AiScript {
  id: string;
  title: string;
  courseName?: string;
  teacherName?: string;
  teacherRole?: string;
  teacherSpecialty?: string;
  studentProfile?: string;
  videoType?: string;
  tone?: string;
  style?: string;
  templateData: any;
  templateId?: string;
}

export function ScriptEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { aiProvider } = useSettings(); // Use context
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [script, setScript] = useState<AiScript | null>(null);
  const [templateData, setTemplateData] = useState<Record<string, string>>({});
  const [scenePurposes, setScenePurposes] = useState<Record<string, string>>(
    {},
  );
  const [templateName, setTemplateName] = useState<string>("");
  const [metadata, setMetadata] = useState<ScriptMetadata>({
    title: "",
    courseName: "",
    teacherName: "",
    teacherRole: "",
    teacherSpecialty: "",
    studentProfile: "",
    videoType: "",
    tone: "",
    style: "",
  });

  useEffect(() => {
    if (!id) return;

    const fetchScript = async () => {
      try {
        // New Endpoint
        const response = await fetch(
          `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts/${id}`,
        );
        if (!response.ok) throw new Error("Failed to load script");
        const data: AiScript = await response.json();
        setScript(data);
        setMetadata({
          title: data.title || "",
          courseName: data.courseName || "",
          teacherName: data.teacherName || "",
          teacherRole: data.teacherRole || "",
          teacherSpecialty: data.teacherSpecialty || "",
          studentProfile: data.studentProfile || "",
          videoType: data.videoType || "",
          tone: data.tone || "",
          style: data.style || "",
        });

        if (data.templateId) {
          try {
            const tmplRes = await fetch(
              `${import.meta.env.VITE_APP_BASE_URL}/videos/templates/${data.templateId}`,
            );
            if (tmplRes.ok) {
              const tmplData = await tmplRes.json();
              setTemplateName(tmplData.title);
            }
          } catch (err) {
            console.error("Failed to fetch template name", err);
          }
        }

        if (data.templateData) {
          // Handle new structure { data: {}, scenePurposes: {} }
          let vars: any = {};
          let purposes: any = {};

          if ((data.templateData as any).data) {
            // New Structure
            vars = (data.templateData as any).data;
            purposes = (data.templateData as any).scenePurposes || {};
          } else {
            // Old Structure (flat or inside variables)
            vars = (data.templateData as any).variables || data.templateData;
            purposes = {};
            // Try to extract purposes from INFO_ keys in old structure
            if (vars) {
              Object.keys(vars).forEach((key) => {
                if (key.startsWith("INFO_")) {
                  const match = key.match(/_scene_(\d+)/);
                  if (match) {
                    purposes[match[1]] = vars[key];
                  }
                }
              });
            }
          }

          setTemplateData(vars || {});
          setScenePurposes(purposes || {});
        }
      } catch (error) {
        console.error(error);
        toast.error(t("toast.failed_load_script"));
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [id, t]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Update the script with new templateData
      // We preserve the structure "variables": { ... } if that's what we received,
      // or just save the flat object if that's how we model it.
      // Let's assume we save it as the 'templateData' field directly.

      const payload = {
        templateData: {
          data: templateData,
          scenePurposes: scenePurposes,
        },
        ...metadata,
      };

      const response = await fetch(
        `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Failed to save script");

      toast.success(t("toast.script_updated"));
      navigate("/"); // Go back to saved scripts
    } catch (error) {
      console.error(error);
      toast.error(t("toast.failed_save_script"));
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateScene = async (
    sceneNum: number,
    instruction: string,
  ): Promise<Record<string, string>> => {
    if (!id || !script) throw new Error("No script context");

    const response = await fetch(
      `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts/${id}/regenerate-scene`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneNumber: sceneNum,
          currentScript: {
            ...script,
            templateData: {
              data: templateData,
              scenePurposes: scenePurposes,
            },
          },
          userInstruction: instruction,
          provider: aiProvider, // Include provider
        }),
      },
    );

    if (response.status === 202) {
      // Async Poll
      return new Promise((resolve, reject) => {
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(
              `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts/${id}`,
            );
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status === "COMPLETED") {
                clearInterval(pollInterval);
                
                // Extract new variables for the specific scene
                const newData = pollData.templateData?.data || {};
                const sceneVars: Record<string, string> = {};
                
                Object.keys(newData).forEach(key => {
                   if (key.endsWith(`_scene_${sceneNum}`) || key === `script_voice_text_${sceneNum}`) {
                       sceneVars[key] = newData[key];
                   }
                });
                
                resolve(sceneVars);
              } else if (pollData.status === "FAILED") {
                clearInterval(pollInterval);
                reject(new Error("Scene regeneration failed."));
              }
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 2000);

        // Timeout 2 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            reject(new Error("Timeout waiting for regeneration"));
        }, 120000);
      });
    }

    if (!response.ok) {
      throw new Error("Failed to regenerate scene");
    }

    const newVariables = await response.json();
    return newVariables;
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">{t("loading.script")}</div>
    );

  if (!script)
    return (
      <div className="p-8 text-center text-red-500">
        {t("script_editor.script_not_found")}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t("script_editor.page_title")}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50"
          >
            {t("actions.back")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? t("actions.saving") : t("actions.save")}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <FullScriptEditor
          data={templateData}
          onChange={(newData) => setTemplateData(newData)}
          scenePurposes={scenePurposes}
          onScenePurposesChange={setScenePurposes}
          title={script.title}
          templateName={templateName}
          onRegenerateScene={handleRegenerateScene}
          metadata={metadata}
          onMetadataChange={(key, value) =>
            setMetadata({ ...metadata, [key]: value })
          }
        />
      </div>
    </div>
  );
}
