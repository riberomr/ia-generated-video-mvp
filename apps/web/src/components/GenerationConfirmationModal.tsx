import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (testMode: boolean) => void;
  title: string;
}

export function GenerationConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
}: Props) {
  const [testMode, setTestMode] = useState(false);
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800">{t('modal.generate_video_title')}</h2>
        <p className="text-gray-600 mb-6 text-sm">
          {t('modal.generate_video_message')} <strong>{title}</strong>.
        </p>

        <div className="flex items-center mb-6">
          <input
            id="test-mode-checkbox"
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="test-mode-checkbox"
            className="ml-2 block text-sm text-gray-900"
          >
            {t('modal.test_mode')}
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {t('actions.cancel')}
          </button>
          <button
            onClick={() => onConfirm(testMode)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {t('modal.start_generation')}
          </button>
        </div>
      </div>
    </div>
  );
}
