import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SynthesiaTemplate } from "@eduvideogen/shared-types";

interface Props {
  source: string;
  onSelect: (template: SynthesiaTemplate) => void;
}

// Helper to format Unix timestamp (seconds) to dd/mm/yyyy
const formatUnixDate = (seconds: number): string => {
  if (!seconds) return "N/A";
  const date = new Date(seconds * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper to calculate max scene number from variables
const calculateScenes = (variables?: any[]): number => {
  if (!variables || !Array.isArray(variables)) return 0;
  let maxScene = 0;
  variables.forEach((v) => {
    const label = v.label || v.id || "";
    const match = label.match(/scene_(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxScene) maxScene = num;
    }
  });
  return maxScene;
};

export function TemplateSelector({ source, onSelect }: Props) {
  const [templates, setTemplates] = useState<SynthesiaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        
        // Construir URL con source parameter
        const queryParam = source ? `source=${source}` : '';
        const url = `${import.meta.env.VITE_APP_BASE_URL}/videos/templates?${queryParam}`;
        
        console.log("Fetching templates from:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch templates");
        const data = await res.json();
        setTemplates(data || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(t('toast.failed_load_scripts'));
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [t, source]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (error) return <div className="text-red-600 p-4 border border-red-200 rounded bg-red-50">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((tmpl) => (
        <div
          key={tmpl.id}
          className="group border rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-white flex flex-col h-full"
          onClick={() => onSelect(tmpl)}
        >
          <div className="p-5 flex flex-col flex-grow">
            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {tmpl.title}
            </h3>
            <p className="text-sm text-gray-500 italic mb-4 line-clamp-2 h-10">
              {tmpl.description || t('template_selector.no_description')}
            </p>

            {/* Metadata Section */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mb-4 mt-auto">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">
                  {t('template_selector.created_at')}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {formatUnixDate(tmpl.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">
                  {t('template_selector.updated_at')}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {formatUnixDate(tmpl.lastUpdatedAt || tmpl.createdAt)}
                </p>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                <span>🎬</span>
                <span>{calculateScenes(tmpl.variables)} {t('template_selector.scenes')}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                <span>🔧</span>
                <span>{tmpl.variables?.length || 0} {t('template_selector.variables')}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
