interface Props {
    data: Record<string, string>;
    onChange: (newData: Record<string, string>) => void;
}

export function ScriptEditor({ data, onChange }: Props) {
    // 1. Extract scene keys and sort them (script_voice_text_1, script_voice_text_2...)
    const sceneKeys = Object.keys(data)
        .filter(key => key.startsWith('script_voice_text_'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('script_voice_text_', ''), 10);
            const numB = parseInt(b.replace('script_voice_text_', ''), 10);
            return numA - numB;
        });

    const handleChange = (key: string, val: string) => {
        onChange({ ...data, [key]: val });
    };

    if (sceneKeys.length === 0) {
        return <div className="text-gray-500 italic">No scene scripts detected.</div>;
    }

    return (
        <div className="space-y-4">
            {sceneKeys.map((key) => {
                const sceneNum = key.replace('scene_voice_text_', '');
                return (
                    <div key={key} className="bg-white p-4 rounded border">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Scene {sceneNum} Script</label>
                        <textarea
                            value={data[key]}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full border rounded p-2 h-32 text-sm font-mono bg-gray-50"
                            placeholder="Enter script for this scene..."
                        />
                    </div>
                );
            })}
        </div>
    );
}
