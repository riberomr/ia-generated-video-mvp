import React, { useState, useEffect } from 'react';

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
    onGenerate: (avatarId: string, voiceId: string) => void;
}

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [voices, setVoices] = useState<Voice[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<string>('');
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchAssets();
        }
    }, [isOpen]);

    const fetchAssets = async () => {
        setLoading(true);
        setError(null);
        try {
            const [avatarRes, voiceRes] = await Promise.all([
                fetch('http://localhost:3000/videos/avatars'),
                fetch('http://localhost:3000/videos/voices')
            ]);

            if (!avatarRes.ok || !voiceRes.ok) {
                throw new Error('Failed to fetch assets');
            }

            const avatarData = await avatarRes.json();
            const voiceData = await voiceRes.json();

            setAvatars(avatarData);
            setVoices(voiceData);

            // Set sensible defaults
            if (avatarData.length > 0) setSelectedAvatar(avatarData[0].avatar_id);
            if (voiceData.length > 0) {
                // Try to pick English voice as default
                const enVoice = voiceData.find((v: Voice) => v.language?.includes('English') || v.language?.includes('en-US'));
                setSelectedVoice(enVoice ? enVoice.voice_id : voiceData[0].voice_id);
            }

        } catch (err) {
            console.error('Error fetching assets:', err);
            setError('Could not load avatars and voices. Checking your API key might help.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        onGenerate(selectedAvatar, selectedVoice);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Generate Video</h2>

                {loading ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600">Loading assets...</span>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded mb-4">
                        {error}
                        <div className="mt-2 text-sm text-gray-500">
                            Note currently using mock data or API key might be invalid.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 text-blue-700 rounded text-sm mb-4">
                            <strong>Note:</strong> To save tokens, only the <strong>first scene</strong> of your script will be generated.
                        </div>

                        {/* Avatar Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Avatar</label>
                            <select
                                value={selectedAvatar}
                                onChange={(e) => setSelectedAvatar(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {avatars.map((avatar) => (
                                    <option key={avatar.avatar_id} value={avatar.avatar_id}>
                                        {avatar.avatar_name || avatar.avatar_id}
                                    </option>
                                ))}
                            </select>
                            {/* Preview Image if available */}
                            {avatars.find(a => a.avatar_id === selectedAvatar)?.preview_image_url && (
                                <img
                                    src={avatars.find(a => a.avatar_id === selectedAvatar)?.preview_image_url}
                                    alt="Avatar Preview"
                                    className="mt-2 h-32 object-cover rounded shadow-sm border"
                                />
                            )}
                        </div>

                        {/* Voice Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Voice</label>
                            <select
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {voices.map((voice) => (
                                    <option key={voice.voice_id} value={voice.voice_id}>
                                        {voice.name || voice.voice_id} ({voice.language || 'Unknown'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !!error || !selectedAvatar || !selectedVoice}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Video
                    </button>
                </div>
            </div>
        </div>
    );
};
