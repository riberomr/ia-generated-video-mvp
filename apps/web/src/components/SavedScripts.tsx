import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, Script, RenderedVideo, Scene } from '@eduvideogen/shared-types';

interface ScriptWithVideos extends Script {
    videos: RenderedVideo[];
}

interface CourseWithScripts extends Course {
    scripts: ScriptWithVideos[];
}

import { VideoGenerationModal } from './VideoGenerationModal';

export const SavedScripts: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<CourseWithScripts[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch('http://localhost:3000/courses');
            const data = await response.json();
            setCourses(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setLoading(false);
        }
    };

    const openGenerateModal = (scriptId: string) => {
        setSelectedScriptId(scriptId);
        setModalOpen(true);
    };

    const handleGenerateVideo = async (avatarId: string, voiceId: string) => {
        if (!selectedScriptId) return;

        setGenerating(selectedScriptId);
        try {
            const response = await fetch(`http://localhost:3000/videos/generate/${selectedScriptId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    avatarId,
                    voiceId
                })
            });
            if (!response.ok) {
                console.error('Failed to start generation');
            }
            // Refresh to see the new PENDING video
            fetchCourses();
        } catch (error) {
            console.error('Error generating video:', error);
        } finally {
            setGenerating(null);
        }
    };

    const handleCheckStatus = async (videoId: string) => {
        try {
            await fetch(`http://localhost:3000/videos/status/${videoId}`);
            fetchCourses();
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    if (loading) return <div>Loading scripts...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800">Scripts Guardados</h2>
                {courses.length === 0 ? (
                    <p className="text-gray-500">No saved scripts found.</p>
                ) : (
                    <div className="space-y-6">
                        {courses.map((course) => (
                            <div key={course.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                                <h3 className="text-xl font-semibold mb-2 text-indigo-700">{course.topic}</h3>
                                <div className="text-sm text-gray-500 mb-4">
                                    Created: {new Date(course.createdAt).toLocaleDateString()}
                                </div>

                                {course.scripts && course.scripts.length > 0 ? course.scripts.map((script) => (
                                    <div key={script.id} className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                                        <h4 className="font-medium text-gray-700 mb-2">Script ID: {script.id.slice(0, 8)}...</h4>

                                        {/* Script Preview */}
                                        <div className="mb-4 max-h-40 overflow-y-auto text-sm text-gray-600 space-y-2">
                                            {(script.scenes as unknown as Scene[]).map((scene, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="font-bold text-gray-400">#{idx + 1}</span>
                                                    <p>{scene.text.substring(0, 100)}...</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-4 mb-4">
                                            <button
                                                onClick={() => navigate(`/editor/${script.id}`)}
                                                className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openGenerateModal(script.id)}
                                                disabled={generating === script.id}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                {generating === script.id ? 'Starting...' : 'Generar Video'}
                                            </button>
                                        </div>

                                        {/* Rendered Videos List */}
                                        {script.videos && script.videos.length > 0 && (
                                            <div className="mt-4 border-t pt-4">
                                                <h5 className="text-sm font-semibold text-gray-600 mb-2">Generated Videos:</h5>
                                                <div className="space-y-2">
                                                    {script.videos.map((video) => (
                                                        <div key={video.id} className="flex items-center justify-between bg-white p-2 rounded border">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${video.status === 'COMPLETED' ? 'bg-green-500' :
                                                                    video.status === 'FAILED' ? 'bg-red-500' :
                                                                        'bg-yellow-500'
                                                                    }`} />
                                                                <span className="text-sm font-medium">{video.status}</span>
                                                                <span className="text-xs text-gray-400">({video.externalId})</span>
                                                            </div>

                                                            <div className="flex gap-2 text-sm">
                                                                <button
                                                                    onClick={() => handleCheckStatus(video.id)}
                                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                                >
                                                                    Check Status
                                                                </button>

                                                                {video.status === 'COMPLETED' && video.downloadUrl && (
                                                                    <a
                                                                        href={`http://localhost:3000/videos/${video.id}/redirect`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-green-600 hover:text-green-800 underline font-medium"
                                                                    >
                                                                        Ver Video
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-sm text-yellow-600">No scripts found for this course.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <VideoGenerationModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onGenerate={handleGenerateVideo}
                />
            </div>
        </div>
    );
}
