
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SynthesiaAsset {
    id: string;
    originalName: string;
    mimeType: string;
    url: string;
    synthesiaId: string;
    type: 'IMAGE' | 'VIDEO' | 'AUDIO';
    createdAt: string;
}

export const assetService = {
    async uploadAsset(file: File): Promise<SynthesiaAsset> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/assets/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${error}`);
        }

        return response.json();
    },

    async getAssets(): Promise<SynthesiaAsset[]> {
        const response = await fetch(`${API_URL}/assets`);

        if (!response.ok) {
            throw new Error('Failed to fetch assets');
        }

        return response.json();
    },

    async checkStatus(id: string): Promise<any> {
        const response = await fetch(`${API_URL}/assets/${id}/check`);
        if (!response.ok) {
            throw new Error('Failed to check status');
        }
        return response.json();
    }
};
