import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface VideoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
}

export const VideoDownloadModal: React.FC<VideoDownloadModalProps> = ({
  isOpen,
  onClose,
  videoId,
}) => {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && videoId) {
      fetchDownloadUrl(videoId);
    } else {
      // Reset state when closed
      setLoading(false);
      setDownloadUrl(null);
      setError(null);
      setStatus(null);
    }
  }, [isOpen, videoId]);

  const fetchDownloadUrl = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BASE_URL}/videos/${id}/download-url`,
      );

      if (!response.ok) {
        throw new Error(t('toast.error_retrieving_video'));
      }

      const data = await response.json();

      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
      } else {
        setError(t('modal.video_not_ready'));
      }
      if (data.status) {
        setStatus(data.status);
      }
    } catch (err) {
      console.error(err);
      setError(t('toast.error_retrieving_video'));
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-xl font-bold mb-4 text-gray-800">{t('modal.download_video_title')}</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 text-sm">
              {t('modal.fetching_video')}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="text-red-500 mb-2">⚠️ {error}</div>
            {status && (
              <p className="text-xs text-gray-400">{t('modal.current_status')} {status}</p>
            )}
          </div>
        ) : downloadUrl ? (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-6">{t('modal.video_ready')}</p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full justify-center"
            >
              {t('modal.download_video')}
            </a>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {t('modal.no_info')}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            {t('actions.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
