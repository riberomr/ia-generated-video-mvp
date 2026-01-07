import React, { useState, useEffect } from 'react';
import { SynthesiaTemplate, SynthesiaTemplateDetails, SynthesiaAsset, Script } from '@eduvideogen/shared-types';

interface Avatar {
    avatar_id: string;
    avatar_name?: string;
    preview_image_url?: string;
}

interface Voice {
    voice_id: string;
    name?: string;
    language?: string;
    preview_audio?: string;
}

interface VideoGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (payload: any) => void;
    script?: Script | null;
}

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose, onGenerate, script }) => {
    const [selectedProvider, setSelectedProvider] = useState<'heygen' | 'synthesia' | ''>('');
    const [mode, setMode] = useState<'basic' | 'template'>('basic');

    // Basic Mode Assets
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<string>('');
    const [selectedVoice, setSelectedVoice] = useState<string>('');

    // Template Mode Assets
    const [templates, setTemplates] = useState<SynthesiaTemplate[]>([]);
    const [assets, setAssets] = useState<SynthesiaAsset[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [templateDetails, setTemplateDetails] = useState<SynthesiaTemplateDetails | null>(null);
    const [templateFormData, setTemplateFormData] = useState<Record<string, any>>({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens/closes or provider changes
    useEffect(() => {
        if (!isOpen) {
            setSelectedProvider('');
            // Reset other states if needed
        } else if (script?.isTemplated) {
            // Auto-select provider for templated scripts to setup logic, 
            // though UI won't show the selector.
            setSelectedProvider('synthesia');
        }
    }, [isOpen, script]);

    // Fetch assets based on provider and mode
    useEffect(() => {
        if (isOpen && selectedProvider) {
            if (script?.isTemplated) {
                // Do not fetch basic assets or template list for already templated scripts
                return;
            }

            if (selectedProvider === 'heygen') {
                fetchBasicAssets('heygen');
            } else if (selectedProvider === 'synthesia') {
                if (mode === 'basic') fetchBasicAssets('synthesia');
                else fetchTemplateAssets();
            }
        }
    }, [isOpen, selectedProvider, mode, script]);

    // Fetch template details when a template is selected
    useEffect(() => {
        if (selectedTemplate && selectedProvider === 'synthesia' && !script?.isTemplated) {
            fetchTemplateDetails(selectedTemplate);
        }
    }, [selectedTemplate, script]);

    const fetchBasicAssets = async (provider: string) => {
        setLoading(true);
        setError(null);
        try {
            const [avatarRes, voiceRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/avatars?provider=${provider}`),
                fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/voices?provider=${provider}`)
            ]);

            if (!avatarRes.ok) throw new Error('Failed to fetch avatars');
            const avatarData = await avatarRes.json();
            const voiceData = voiceRes.ok ? await voiceRes.json() : [];

            setAvatars(avatarData);
            setVoices(voiceData);

            if (avatarData.length > 0) setSelectedAvatar(avatarData[0].avatar_id);
            else setSelectedAvatar('');

            if (voiceData.length > 0) {
                const enVoice = voiceData.find((v: Voice) => v.language?.includes('English') || v.language?.includes('en-US'));
                setSelectedVoice(enVoice ? enVoice.voice_id : voiceData[0].voice_id);
            } else {
                setSelectedVoice('');
            }
        } catch (err) {
            console.error('Error fetching basic assets:', err);
            setError('Could not load assets.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplateAssets = async () => {
        setLoading(true);
        setError(null);
        try {
            const [templatesRes, assetsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia/templates`),
                fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia/assets`)
            ]);

            if (!templatesRes.ok) throw new Error('Failed to fetch templates');
            const templatesData = await templatesRes.json();
            const assetsData = assetsRes.ok ? await assetsRes.json() : [];

            setTemplates(templatesData);
            setAssets(assetsData);
        } catch (err) {
            console.error('Error fetching template assets:', err);
            setError('Could not load templates/assets.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplateDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia/templates/${id}`);
            if (!res.ok) throw new Error('Failed to fetch template details');
            const data = await res.json();
            setTemplateDetails(data);
            setTemplateFormData({}); // Reset form data
        } catch (err) {
            console.error(err);
            setError('Failed to load template details');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        let payload: any = { provider: selectedProvider };

        if (script?.isTemplated) {
            // Templated Script Confirmation
            // Extract voice script for payload verification (backend handles actual mapping)
            payload = {
                provider: 'synthesia',
                test: true,
                templateId: script.templateId,
                templateData: script.templateData || {},
                title: `Smart Video - ${new Date().toLocaleString()}`,
                description: 'Generated via Smart Scripting'
            };
        }
        else if (!selectedProvider) return;

        else if (selectedProvider === 'synthesia' && mode === 'template') {
            payload = {
                ...payload,
                templateId: selectedTemplate,
                templateData: templateFormData,
            };
        } else {
            // Basic Mode (HeyGen or Synthesia Basic)
            payload = {
                ...payload,
                avatarId: selectedAvatar,
                voiceId: selectedVoice,
            };
        }
        console.log(payload, 'payload');
        onGenerate(payload);
        onClose();
    };

    const handleInputChange = (key: string, value: any) => {
        setTemplateFormData(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    // Special UI for Templated Scripts
    if (script?.isTemplated) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg p-6 m shadow-xl relative">
                    <button onClick={onClose} className="absolute top-4 right-4 tew-full max-w-sxt-gray-400 hover:text-gray-600">✕</button>
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Generate Smart Video</h2>
                    <p className="text-gray-600 mb-6">
                        This is a pre-configured Smart Script. Are you sure you want to generate the video now?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                        <button
                            onClick={handleGenerate}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Generate Video
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Generate Video</h2>

                {/* Provider Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Provider</label>
                    <select
                        value={selectedProvider}
                        onChange={(e) => {
                            setSelectedProvider(e.target.value as any);
                            setMode('basic'); // Reset mode on provider change
                        }}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                        <option value="">-- Select a Provider --</option>
                        <option value="heygen">HeyGen</option>
                        <option value="synthesia">Synthesia</option>
                    </select>
                </div>

                {selectedProvider === 'synthesia' && (
                    <div className="flex mb-4 border-b">
                        <button
                            className={`px-4 py-2 border-b-2 font-medium ${mode === 'basic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
                            onClick={() => setMode('basic')}
                        >
                            Basic
                        </button>
                        <button
                            className={`px-4 py-2 border-b-2 font-medium ${mode === 'template' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'}`}
                            onClick={() => setMode('template')}
                        >
                            Template
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded mb-4">{error}</div>
                ) : selectedProvider && (
                    <div className="space-y-4">
                        {(mode === 'basic') ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Avatar</label>
                                    <select
                                        value={selectedAvatar}
                                        onChange={(e) => setSelectedAvatar(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        {avatars.map((a) => (
                                            <option key={a.avatar_id} value={a.avatar_id}>{a.avatar_name || a.avatar_id}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Voice</label>
                                    <select
                                        value={selectedVoice}
                                        onChange={(e) => setSelectedVoice(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        {voices.map((v) => (
                                            <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.language})</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            /* Template Mode */
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        <option value="">-- Choose Template --</option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {templateDetails && templateDetails.variables && (
                                    <div className="space-y-3 border-t pt-3 mt-3">
                                        <h3 className="text-sm font-semibold text-gray-600">Template Variables</h3>
                                        {Object.entries(templateDetails.variables).map(([key]) => (
                                            <div key={key}>
                                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{key}</label>
                                                {/* Heuristic: if key contains 'img' or 'background', show Asset selector, else Input */}
                                                {(key.toLowerCase().includes('img') || key.toLowerCase().includes('background') || key.toLowerCase().includes('logo')) ? (
                                                    <select
                                                        className="w-full border border-gray-300 rounded-md text-sm p-2"
                                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                                    >
                                                        <option value="">Select Asset...</option>
                                                        {assets.map(a => (
                                                            <option key={a.id} value={a.id}>{a.title} ({a.type})</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-300 rounded-md text-sm p-2"
                                                        placeholder={`Enter value for ${key}`}
                                                        onChange={(e) => handleInputChange(key, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !selectedProvider || (mode === 'basic' && (!selectedAvatar || !selectedVoice)) || (mode === 'template' && !selectedTemplate)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Generate Video
                    </button>
                </div>
            </div>
        </div>
    );
};
