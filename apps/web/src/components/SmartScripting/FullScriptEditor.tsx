import { useState } from "react";
import { toast } from "react-hot-toast";
import { SceneRegenerationModal } from "./SceneRegenerationModal";
import { ScriptMetadataEditor, ScriptMetadata } from "./ScriptMetadataEditor";

interface Props {
  data: Record<string, string>;
  onChange: (newData: Record<string, string>) => void;
  title?: string;
  templateName?: string;
  onRegenerateScene?: (
    sceneNum: number,
    instruction: string,
  ) => Promise<Record<string, string>>;
  metadata?: ScriptMetadata;
  onMetadataChange?: (key: keyof ScriptMetadata, value: string) => void;
}

export function FullScriptEditor({
  data,
  onChange,
  title: _title,
  templateName,
  onRegenerateScene,
  metadata,
  onMetadataChange,
}: Props) {
  const [regenModal, setRegenModal] = useState<{
    isOpen: boolean;
    sceneNum: number | null;
  }>({
    isOpen: false,
    sceneNum: null,
  });
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenNewVariables, setRegenNewVariables] = useState<Record<
    string,
    string
  > | null>(null);

  const handleChange = (key: string, val: string) => {
    onChange({ ...data, [key]: val });
  };

  const handleOpenRegen = (sceneNum: number) => {
    setRegenModal({ isOpen: true, sceneNum });
    setRegenNewVariables(null); // Reset prev state
  };

  const handleConfirmRegen = async (instruction: string) => {
    if (!regenModal.sceneNum || !onRegenerateScene) return;

    setRegenLoading(true);
    try {
      const newVars = await onRegenerateScene(regenModal.sceneNum, instruction);
      setRegenNewVariables(newVars);
      toast.success(`Scene ${regenModal.sceneNum} regenerated!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to regenerate scene.");
    } finally {
      setRegenLoading(false);
    }
  };

  const handleApplyRegen = () => {
    if (regenNewVariables) {
      onChange({ ...data, ...regenNewVariables });
      setRegenModal({ isOpen: false, sceneNum: null });
      setRegenNewVariables(null);
    }
  };

  // 1. Group variables
  const globals: string[] = [];
  const scenes: Record<string, { visuals: string[]; voice?: string }> = {};

  Object.keys(data).forEach((key) => {
    // 1. Check if the key belongs to a specific scene via suffix
    const sceneMatch = key.match(/_scene_(\d+)$/);

    if (sceneMatch) {
      const sceneNum = sceneMatch[1];
      if (!scenes[sceneNum]) scenes[sceneNum] = { visuals: [] };

      if (key.startsWith("script_voice_text_")) {
        scenes[sceneNum].voice = key;
      } else {
        scenes[sceneNum].visuals.push(key);
      }
      return;
    }

    // 2. Fallback for legacy voice scripts (e.g. script_voice_text_1)
    if (key.startsWith("script_voice_text_")) {
      const num = key.replace("script_voice_text_", "");
      // If the remainder is just a number, assign it to that scene
      if (/^\d+$/.test(num)) {
        if (!scenes[num]) scenes[num] = { visuals: [] };
        scenes[num].voice = key;
        return;
      }
    }

    // 3. Otherwise, it's a global variable
    globals.push(key);
  });

  // Sort scene numbers
  const sortedSceneNums = Object.keys(scenes).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );
  console.log(sortedSceneNums);
  return (
    <div className="space-y-8">
      {/* Template Name */}
      {templateName && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <span className="block text-xs font-bold text-blue-500 uppercase mb-1">
            Synthesia Template Name
          </span>
          <p className="text-lg font-bold text-blue-900">{templateName}</p>
        </div>
      )}

      {/* Metadata Editor */}
      {metadata && onMetadataChange && (
        <ScriptMetadataEditor metadata={metadata} onChange={onMetadataChange} />
      )}

      {/* Scene Specific Sections */}
      {sortedSceneNums.map((num) => (
        <div
          key={num}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-bold text-green-800 uppercase">
              Scene {num}
            </h3>
            {onRegenerateScene && (
              <button
                onClick={() => handleOpenRegen(parseInt(num))}
                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Regenerate
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Visuals for this scene */}
            {scenes[num].visuals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenes[num].visuals.map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      {key.replace(`_scene_${num}`, "").replace(/_/g, " ")}
                    </label>
                    <input
                      type="text"
                      value={data[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Voice Script for this scene */}
            {scenes[num].voice && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Voice Script
                </label>
                <textarea
                  value={data[scenes[num].voice!]}
                  onChange={(e) =>
                    handleChange(scenes[num].voice!, e.target.value)
                  }
                  className="w-full border border-gray-300 rounded p-3 h-32 text-sm font-mono bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter script for this scene..."
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {globals.length === 0 && sortedSceneNums.length === 0 && (
        <div className="text-gray-500 italic p-4 text-center">
          No editable content found for this script.
        </div>
      )}

      {onRegenerateScene && regenModal.isOpen && (
        <SceneRegenerationModal
          isOpen={regenModal.isOpen}
          sceneNumber={regenModal.sceneNum!}
          onClose={() => setRegenModal({ isOpen: false, sceneNum: null })}
          onConfirm={handleConfirmRegen}
          onApply={handleApplyRegen}
          loading={regenLoading}
          newVariables={regenNewVariables}
        />
      )}
    </div>
  );
}
