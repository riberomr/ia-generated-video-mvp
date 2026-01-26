
import { AssetUpload } from '../components/AssetUpload';

export function AssetsPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Asset Management</h1>
            <AssetUpload />
        </div>
    );
}
