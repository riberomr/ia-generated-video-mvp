import { useState, useEffect } from 'react';
import { SynthesiaTemplate } from '@eduvideogen/shared-types';

interface Props {
    onSelect: (template: SynthesiaTemplate) => void;
}

export function TemplateSelector({ onSelect }: Props) {
    const [templates, setTemplates] = useState<SynthesiaTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                // Using hardcoded URL as seen in other components, ideally use env var
                const res = await fetch('http://localhost:3000/videos/synthesia/templates?source=workspace',);
                if (!res.ok) throw new Error('Failed to fetch templates');
                const data = await res.json();
                setTemplates(data || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load templates');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    if (loading) return <div>Loading templates...</div>;
    if (error) return <div className="text-red-600">{error}</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map(t => (
                <div
                    key={t.id}
                    className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-white"
                    onClick={() => onSelect(t)}
                >
                    {t.thumbnail_url ? (
                        <img src={t.thumbnail_url} alt={t.title} className="w-full h-40 object-cover" />
                    ) : (
                        <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-400">No Preview</div>
                    )}
                    <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{t.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{t.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
