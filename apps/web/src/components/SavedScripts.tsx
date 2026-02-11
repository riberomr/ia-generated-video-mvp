import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { ConfirmationModal } from "./ConfirmationModal";
import { VideoDownloadModal } from "./VideoDownloadModal";
import { GenerationConfirmationModal } from "./GenerationConfirmationModal";

interface AiScript {
  id: string;
  title: string;
  courseName?: string;
  teacherName?: string;
  createdAt: string;
  videoType?: string;
  templateId?: string;
  templateName?: string;
  videos: VideoRender[];
}

interface VideoRender {
  id: string;
  status: string;
  updatedAt: string;
}

// Función helper para formatear fecha a dd/mm/yyyy
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const SavedScripts: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scripts, setScripts] = useState<AiScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Deletion State
  const [itemToDelete, setItemToDelete] = useState<{
    type: "script" | "video";
    id: string;
  } | null>(null);

  // Video Download State
  const [videoToDownload, setVideoToDownload] = useState<string | null>(null);

  // Generation Modal State
  const [generationModal, setGenerationModal] = useState<{
    isOpen: boolean;
    script: AiScript | null;
  }>({
    isOpen: false,
    script: null,
  });

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts`,
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setScripts(data);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      toast.error(t('toast.failed_load_scripts'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = (script: AiScript) => {
    setGenerationModal({ isOpen: true, script });
  };

  const confirmGeneration = async (testMode: boolean) => {
    const script = generationModal.script;
    if (!script) return;

    setGenerationModal({ isOpen: false, script: null }); // Close modal
    setGenerating(script.id);

    try {
      // Updated endpoint: POST /videos/generate/:scriptId
      const response = await fetch(
        `${import.meta.env.VITE_APP_BASE_URL}/videos/generate/${script.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: testMode }), // Pass test flag
        },
      );
      if (!response.ok) throw new Error("Generation failed");

      toast.success(t('toast.generation_started'));
      fetchScripts(); // Refresh to show pending status
    } catch (error) {
      console.error("Error generating video:", error);
      toast.error(t('toast.failed_generation'));
    } finally {
      setGenerating(null);
    }
  };

  const handleCheckStatus = async (videoId: string) => {
    try {
      await fetch(
        `${import.meta.env.VITE_APP_BASE_URL}/videos/status/${videoId}`,
      );
      toast.success(t('toast.status_updated'));
      fetchScripts();
    } catch (error) {
      console.error("Error checking status:", error);
      toast.error(t('toast.failed_status_update'));
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const url =
        itemToDelete.type === "script"
          ? `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts/${itemToDelete.id}`
          : `${import.meta.env.VITE_APP_BASE_URL}/videos/${itemToDelete.id}`;

      const response = await fetch(url, { method: "DELETE" });

      if (!response.ok)
        throw new Error(`Failed to delete ${itemToDelete.type}`);

      toast.success(
        itemToDelete.type === "script" ? t('toast.script_deleted') : t('toast.video_deleted'),
      );
      fetchScripts();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(itemToDelete.type === "script" ? t('toast.failed_delete_script') : t('toast.failed_delete_video'));
    } finally {
      setItemToDelete(null);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">{t('loading.scripts')}</div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title={
          itemToDelete?.type === "script" ? t('modal.delete_script_title') : t('modal.delete_video_title')
        }
        message={
          itemToDelete?.type === "script"
            ? t('modal.delete_script_message')
            : t('modal.delete_video_message')
        }
      />

      <VideoDownloadModal
        isOpen={!!videoToDownload}
        onClose={() => setVideoToDownload(null)}
        videoId={videoToDownload}
      />

      <GenerationConfirmationModal
        isOpen={generationModal.isOpen}
        onClose={() => setGenerationModal({ isOpen: false, script: null })}
        onConfirm={confirmGeneration}
        title={generationModal.script?.title || ""}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('saved_scripts.page_title')}</h1>
        <button
          onClick={() => navigate("/template-scripting")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm"
        >
          {t('saved_scripts.create_new')}
        </button>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <p className="text-gray-500 mb-4">{t('saved_scripts.no_scripts')}</p>
          <button
            onClick={() => navigate("/template-scripting")}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t('saved_scripts.create_first')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-5 sm:p-6 relative">
                <button
                  onClick={() =>
                    setItemToDelete({ type: "script", id: script.id })
                  }
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                  title={t('saved_scripts.delete_script')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                {/* Header con fecha */}
                <div className="flex items-center justify-end mb-3 pr-6">
                  <span className="text-xs text-gray-400">
                    {formatDate(script.createdAt)}
                  </span>
                </div>

                {/* Título del script */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {t('saved_scripts.title_label')}
                  </p>
                  <h3 className="text-lg leading-6 font-bold text-gray-900">
                    {script.title}
                  </h3>
                </div>

                {/* Plantilla */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    {t('saved_scripts.template_label')}
                  </p>
                  <p className="text-sm text-indigo-600 font-medium">
                    {script.templateName || t('saved_scripts.template_na')}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {/* Video Status */}
                  {script.videos && script.videos.length > 0 ? (
                    <div className="space-y-2">
                      {script.videos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm group"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                video.status === "COMPLETED"
                                  ? "bg-green-400"
                                  : video.status === "FAILED"
                                    ? "bg-red-400"
                                    : "bg-yellow-400"
                              }`}
                              aria-hidden="true"
                            />
                            <span className="font-medium text-gray-700 capitalize">
                              {t(`video_status.${video.status.toLowerCase()}`)}
                            </span>
                          </div>
                          <div className="flex space-x-2 items-center">
                            {video.status !== "COMPLETED" &&
                              video.status !== "FAILED" && (
                                <button
                                  onClick={() => handleCheckStatus(video.id)}
                                  className="text-indigo-600 hover:text-indigo-900 text-xs"
                                >
                                  {t('actions.check')}
                                </button>
                              )}
                            {video.status === "COMPLETED" && (
                              <button
                                onClick={() => setVideoToDownload(video.id)}
                                className="text-green-600 hover:text-green-900 text-xs font-semibold"
                              >
                                {t('actions.view')}
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setItemToDelete({ type: "video", id: video.id })
                              }
                              className="text-gray-400 hover:text-red-500 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t('modal.delete_video_title')}
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      {t('saved_scripts.no_videos')}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex justify-end space-x-3">
                  <button
                    onClick={() => navigate(`/editor/${script.id}`)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    {t('actions.edit')}
                  </button>
                  <button
                    onClick={() => handleGenerateVideo(script)}
                    disabled={generating === script.id}
                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                  >
                    {generating === script.id
                      ? t('saved_scripts.starting')
                      : t('saved_scripts.generate_video')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
