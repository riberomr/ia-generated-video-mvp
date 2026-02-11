import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (instruction: string) => void;
  sceneNumber: number;
  loading: boolean;
  newVariables: Record<string, string> | null;
  onApply: () => void;
}

export function SceneRegenerationModal({
  isOpen,
  onClose,
  onConfirm,
  sceneNumber,
  loading,
  newVariables,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const [instruction, setInstruction] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          {t("script_editor.regenerate_scene_title", { num: sceneNumber })}
        </h2>

        {!newVariables ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {t("script_editor.regenerate_instruction_label")}
            </p>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-3 h-32 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
              placeholder={t("script_editor.regenerate_placeholder")}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={() => onConfirm(instruction)}
                disabled={loading || !instruction.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("actions.regenerating")}
                  </>
                ) : (
                  t("actions.regenerate")
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800 font-medium mb-2">
                {t("script_editor.regenerate_success")}
              </p>
              <div className="max-h-60 overflow-y-auto text-xs text-gray-600 space-y-2">
                {Object.entries(newVariables).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold text-gray-700">{key}:</span>{" "}
                    {value}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onConfirm(instruction)} // Retry with same instruction
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                {t("actions.try_again")}
              </button>
              <button
                onClick={onApply}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                {t("actions.apply_changes")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
