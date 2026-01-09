import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type ScriptSummary = {
    id: string;
    title: string;
    createdAt: string;
    scenes: any[]; // We only need the length
    renderedVideos: {
        id: string;
        status: string;
        downloadUrl?: string;
        createdAt: string;
    }[];
};

export const AiScriptsListScreen = () => {
    const [scripts, setScripts] = useState<ScriptSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    const fetchScripts = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-video-scripts`);
            if (!res.ok) throw new Error("Failed to load scripts");
            const data = await res.json();
            setScripts(data);
        } catch (err) {
            console.error(err);
            // alert("Error fetching scripts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScripts();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // 1. Find videos that need updating
            const videosToCheck: string[] = [];
            scripts.forEach(s => {
                s.renderedVideos.forEach(v => {
                    if (['processing', 'pending', 'created', 'queued', 'in_progress'].includes(v.status.toLowerCase())) {
                        videosToCheck.push(v.id);
                    }
                });
            });

            // 2. Call status endpoint for each
            await Promise.all(videosToCheck.map(id =>
                fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/status/${id}`)
                    .catch(e => console.error(`Failed to refresh video ${id}`, e))
            ));

            // 3. Reload list
            await fetchScripts();
        } catch (error) {
            console.error("Error refreshing videos:", error);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading AI Scripts...</div>;

    const getVideoStatus = (videos: ScriptSummary['renderedVideos']) => {
        if (!videos || videos.length === 0) return null;
        // Sort by date desc
        const sorted = [...videos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = sorted[0];
        return {
            count: videos.length,
            latest
        };
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">AI Generated Scripts</h1>
                    <p className="text-gray-500 text-sm">Review, edit, and turn your scripts into videos.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`px-4 py-2 rounded shadow flex items-center gap-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {refreshing && (
                            <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {refreshing ? 'Checking...' : 'Refresh Status'}
                    </button>
                    <Link
                        to="/generate-script"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow flex items-center gap-2"
                    >
                        + New Script
                    </Link>
                </div>
            </div>

            {scripts.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded border border-dashed">
                    <p className="text-gray-500 mb-4">No scripts found.</p>
                    <Link to="/generate-script" className="text-purple-600 font-bold hover:underline">Generate your first script</Link>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {scripts.map((script) => {
                                const videoData = getVideoStatus(script.renderedVideos);
                                return (
                                    <tr key={script.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{script.title || "Untitled Script"}</div>
                                            <div className="text-xs text-gray-400 font-mono">{script.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(script.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                                                {Array.isArray(script.scenes) ? script.scenes.length : 0} Scenes
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {!videoData ? (
                                                <span className="text-gray-400 italic text-xs">No videos yet</span>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">{videoData.count} Generated</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {videoData.latest.status === 'completed' && (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                                <a href={videoData.latest.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                                                    Download
                                                                </a>
                                                            </>
                                                        )}
                                                        {videoData.latest.status === 'processing' && (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                                                <span className="text-yellow-600 text-xs">Processing</span>
                                                            </>
                                                        )}
                                                        {videoData.latest.status === 'failed' && (
                                                            <>
                                                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                                <span className="text-red-600 text-xs">Failed</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium gap-3 flex justify-end">
                                            <Link
                                                to={`/generate-script/${script.id}`}
                                                className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => navigate(`/video-from-scratch?scriptId=${script.id}`)}
                                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 shadow-sm"
                                            >
                                                Create Video
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
