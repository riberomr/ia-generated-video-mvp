
import React from 'react';

interface Props {
    data: Record<string, string>;
    onChange: (newData: Record<string, string>) => void;
    title?: string;
}

export function FullScriptEditor({ data, onChange, title }: Props) {
    const handleChange = (key: string, val: string) => {
        onChange({ ...data, [key]: val });
    };

    // 1. Group variables
    const globals: string[] = [];
    const scenes: Record<string, { visuals: string[], voice?: string }> = {};

    Object.keys(data).forEach(key => {
        // 1. Check if the key belongs to a specific scene via suffix
        const sceneMatch = key.match(/_scene_(\d+)$/);

        if (sceneMatch) {
            const sceneNum = sceneMatch[1];
            if (!scenes[sceneNum]) scenes[sceneNum] = { visuals: [] };

            if (key.startsWith('script_voice_text_')) {
                scenes[sceneNum].voice = key;
            } else {
                scenes[sceneNum].visuals.push(key);
            }
            return;
        }

        // 2. Fallback for legacy voice scripts (e.g. script_voice_text_1)
        if (key.startsWith('script_voice_text_')) {
             const num = key.replace('script_voice_text_', '');
             // If the remainder is just a number, assign it to that scene
             if (/^\d+$/.test(num)) {
                  if (!scenes[num]) scenes[num] = { visuals: [] };
                  scenes[num].voice = key;
                  return;
             }
        }

        // 3. Otherwise, it's a global variable
        globals.push(key);
    });

    // Sort scene numbers
    const sortedSceneNums = Object.keys(scenes).sort((a, b) => parseInt(a) - parseInt(b));
console.log(sortedSceneNums)
    return (
        <div className="space-y-8">
            {/* Title Section */}
            {title && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                </div>
            )}

            {/* Global Variables Section */}
            {globals.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                     <h3 className="text-lg font-bold text-blue-800 uppercase mb-4 border-b pb-2">Global Variables</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {globals.map(key => (
                            <div key={key}>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                                <input
                                    type="text"
                                    value={data[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        ))}
                     </div>
                </div>
            )}

            {/* Scene Specific Sections */}
            {sortedSceneNums.map(num => (
                <div key={num} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-green-800 uppercase mb-4 border-b pb-2">Scene {num}</h3>
                    
                    <div className="space-y-6">
                        {/* Visuals for this scene */}
                        {scenes[num].visuals.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {scenes[num].visuals.map(key => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                            {key.replace(`_scene_${num}`, '').replace(/_/g, ' ')}
                                        </label>
                                        <input
                                            type="text"
                                            value={data[key]}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Voice Script for this scene */}
                        {scenes[num].voice && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Voice Script</label>
                                <textarea
                                    value={data[scenes[num].voice!]}
                                    onChange={(e) => handleChange(scenes[num].voice!, e.target.value)}
                                    className="w-full border border-gray-300 rounded p-3 h-32 text-sm font-mono bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                    placeholder="Enter script for this scene..."
                                />
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {globals.length === 0 && sortedSceneNums.length === 0 && (
                <div className="text-gray-500 italic p-4 text-center">No editable content found for this script.</div>
            )}
        </div>
    );
}
