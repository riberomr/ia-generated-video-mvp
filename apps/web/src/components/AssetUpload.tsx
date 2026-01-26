
import { useState, useEffect, useRef } from 'react';
import { assetService, SynthesiaAsset } from '../services/asset.service';

export function AssetUpload() {
    const [assets, setAssets] = useState<SynthesiaAsset[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAssets = async () => {
        try {
            const data = await assetService.getAssets();
            setAssets(data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load assets');
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleCheckStatus = async (id: string) => {
        try {
            const result = await assetService.checkStatus(id);
            alert(JSON.stringify(result, null, 2));
        } catch (err: any) {
            alert("Error checking status: " + err.message);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // ... (rest of logic same)
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            await assetService.uploadAsset(file);
            await fetchAssets(); // Refresh list
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Synthesia Assets</h2>

            <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">Upload New Asset</label>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                    {uploading && <span className="text-blue-600 self-center">Uploading...</span>}
                </div>
                {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {assets.map(asset => (
                    <div key={asset.id} className="border rounded-md overflow-hidden bg-gray-50 hover:shadow-lg transition-shadow">
                        <div className="h-32 bg-gray-200 flex items-center justify-center overflow-hidden">
                            {asset.type === 'IMAGE' ? (
                                <img src={asset.url} alt={asset.originalName} className="object-cover w-full h-full" />
                            ) : asset.type === 'VIDEO' ? (
                                <video src={asset.url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-500">Audio File</div>
                            )}
                        </div>
                        <div className="p-2 text-xs">
                            <p className="font-semibold truncate" title={asset.originalName}>{asset.originalName}</p>
                            <p className="text-gray-500 mt-1">ID: {asset.synthesiaId}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 rounded-full text-[10px]">{asset.type}</span>
                            <button
                                onClick={() => handleCheckStatus(asset.id)}
                                className="mt-2 w-full text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                            >
                                Check Status
                            </button>
                        </div>
                    </div>
                ))}
                {assets.length === 0 && !error && (
                    <p className="text-gray-500 col-span-full text-center py-8">No assets uploaded yet.</p>
                )}
            </div>
        </div>
    );
}
