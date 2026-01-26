
import { useState, useEffect, useCallback } from 'react';
// import axios from 'axios'; // Removed axios import
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Adjust based on environment

interface AvatarMetadata {
    shot?: { camera?: string; zoom?: string; gaze?: string };
    framing?: string;
    userDescription?: string;
}

interface Avatar {
    id: string;
    name: string;
    gender: string;
    imageUrl: string;
    metadata: AvatarMetadata;
}



export function AvatarLibraryPage() {
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters State
    const [search, setSearch] = useState('');
    const [gender, setGender] = useState('');
    const [subject, setSubject] = useState('');
    const [shotZoom, setShotZoom] = useState('');
    const [shotCamera, setShotCamera] = useState('');
    const [gaze, setGaze] = useState('');

    // Debounce Search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchAvatars = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (gender) params.append('gender', gender);
            if (subject) params.append('subject', subject);
            if (shotZoom) params.append('shotZoom', shotZoom);
            if (shotCamera) params.append('shotCamera', shotCamera);
            if (gaze) params.append('gaze', gaze)
            // Adjust endpoint if needed (VITE_API_URL usually includes /api or not? checking typical setup)
            // Assuming /videos based on controller, or /videos/synthesia/avatars/library
            const response = await fetch(`${API_URL}/videos/synthesia/avatars/library?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setAvatars(data);
        } catch (error) {
            console.error('Failed to fetch avatars:', error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, gender, subject, shotZoom, shotCamera, gaze]);

    useEffect(() => {
        fetchAvatars();
    }, [fetchAvatars]);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto flex-shrink-0">
                <h2 className="text-lg font-semibold mb-6">Filters</h2>

                <div className="space-y-6">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Name..."
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">All</option>
                            <option value="m">Male</option>
                            <option value="f">Female</option>
                        </select>
                    </div>

                    {/* Framing
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Framing</label>
                        <select
                            value={framing}
                            onChange={(e) => setFraming(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">Any</option>
                            <option value="waist-up">Waist Up</option>
                            <option value="chest-up">Chest Up</option>
                            <option value="face">Face</option>
                            {/* Add more as discovered from data */}
                    {/* </select> */}
                    {/* </div> */}


                    {/* Zoom */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
                        <select
                            value={shotZoom}
                            onChange={(e) => setShotZoom(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">Any</option>
                            <option value="wide">Far Shot</option>
                            <option value="mid">Medium Shot</option>
                            <option value="close">Close Up</option>
                        </select>
                    </div>

                    {/* Camera */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Camera</label>
                        <select
                            value={shotCamera}
                            onChange={(e) => setShotCamera(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">Any</option>
                            <option value="centre">Centre</option>
                            <option value="leftShallow">Left Shallow</option>
                            <option value="rightShallow">Right Shallow</option>
                            <option value="leftDeep">Left Deep</option>
                            <option value="rightDeep">Right Deep</option>
                            {/* Add more as needed */}
                        </select>
                    </div>


                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">Any</option>
                            <option value="centre">Centre</option>
                            <option value="left">Left </option>
                            <option value="right">Right </option>
                            {/* Add more as needed */}
                        </select>
                    </div>

                    {/* Gaze */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gaze</label>
                        <select
                            value={gaze}
                            onChange={(e) => setGaze(e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                        >
                            <option value="">Any</option>
                            <option value="atCamera">At Camera</option>
                            <option value="screenLeft">Screen Left </option>
                            <option value="screenRight">Screen Right </option>
                            {/* Add more as needed */}
                        </select>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Avatar Library</h1>
                    <span className="text-gray-500 text-sm">{avatars.length} results</span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {avatars.map((avatar) => (
                            <div key={avatar.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-[3/4] bg-gray-200 relative">
                                    {avatar.imageUrl ? (
                                        <img
                                            src={avatar.imageUrl}
                                            alt={avatar.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <h3 className="text-white font-medium text-lg">{avatar.name}</h3>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                        {/* Gender Badge */}
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${avatar.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                                            avatar.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {avatar.gender || 'Unknown'}
                                        </span>

                                        {/* Framing Badge */}
                                        {avatar.metadata?.framing && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                {avatar.metadata.framing}
                                            </span>
                                        )}

                                        {/* Zoom Badge */}
                                        {avatar.metadata?.shot?.zoom && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                {avatar.metadata.shot.zoom}
                                            </span>
                                        )}
                                    </div>
                                    {avatar.metadata?.userDescription && (
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                                            {avatar.metadata.userDescription}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
