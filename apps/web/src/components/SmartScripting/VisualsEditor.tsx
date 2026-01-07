interface Props {
    data: Record<string, string>;
    onChange: (newData: Record<string, string>) => void;
}

export function VisualsEditor({ data, onChange }: Props) {
    const handleChange = (key: string, val: string) => {
        onChange({ ...data, [key]: val });
    };

    return (
        <div className="space-y-4 bg-white p-4 rounded border">
            {Object.entries(data)
                .filter(([key]) => !key.startsWith('script_voice_text_'))
                .map(([key, value]) => (
                    <div key={key}>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded p-2 text-sm"
                        />
                    </div>
                ))}
        </div>
    );
}
