
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Scene, UpdateScriptDto, Script } from '@eduvideogen/shared-types';
import { VisualsEditor } from './SmartScripting/VisualsEditor';
import { ScriptEditor as SmartScriptEditor } from './SmartScripting/ScriptEditor';

interface ScriptEditorForm {
    scenes: Scene[];
}

export function ScriptEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [script, setScript] = useState<Script | null>(null);

    // Legacy Form
    const { control, register, handleSubmit, reset } = useForm<ScriptEditorForm>({
        defaultValues: {
            scenes: []
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "scenes"
    });

    // Smart Script State
    const [smartTemplateData, setSmartTemplateData] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!id) return;

        const fetchScript = async () => {
            try {
                const response = await fetch(`http://localhost:3000/courses/scripts/${id}`);
                if (!response.ok) throw new Error('Failed to load script');
                const data: Script = await response.json();
                setScript(data);

                if (data.isTemplated) {
                    // Load templateData directly.
                    setSmartTemplateData((data.templateData as Record<string, string>) || {});
                } else {
                    reset({ scenes: data.scenes as Scene[] });
                }
            } catch (error) {
                console.error(error);
                alert('Error loading script');
            } finally {
                setLoading(false);
            }
        };

        fetchScript();
    }, [id, reset]);

    const handleLegacySubmit = async (data: ScriptEditorForm) => {
        if (!id) return;
        setSaving(true);
        try {
            const updateDto: UpdateScriptDto = {
                scenes: data.scenes
            };

            await saveScript(updateDto);
        } catch (error) {
            console.error(error);
            alert('Error saving script');
        } finally {
            setSaving(false);
        }
    };

    const handleSmartSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            // We just send the unified templateData.
            // We also reconstruct 'scenes' array for the backend schema requirement (Optional but good practice if logic depends on it)
            // But main data is templateData.

            const sceneKeys = Object.keys(smartTemplateData)
                .filter(key => key.startsWith('script_voice_text_'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace('script_voice_text_', ''), 10);
                    const numB = parseInt(b.replace('script_voice_text_', ''), 10);
                    return numA - numB;
                });
            const scenes = sceneKeys.map(key => smartTemplateData[key]);

            const updateDto: any = {
                isTemplated: true,
                templateData: smartTemplateData,
                scenes: scenes
            };

            await saveScript(updateDto);
        } catch (error) {
            console.error(error);
            alert('Error saving smart script');
        } finally {
            setSaving(false);
        }
    }

    const saveScript = async (dto: any) => {
        const response = await fetch(`http://localhost:3000/courses/scripts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });

        if (!response.ok) throw new Error('Failed to save script');

        alert('Script updated successfully!');
        navigate('/saved');
    }

    if (loading) return <div className="p-8 text-center">Loading script...</div>;

    console.log(smartTemplateData);
    if (script?.isTemplated) {
        return (
            <div className="max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Edit Smart Script</h1>
                    <button
                        onClick={handleSmartSave}
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Visual Variables</h2>
                        <VisualsEditor
                            data={smartTemplateData}
                            onChange={(newData) => setSmartTemplateData(newData)}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-4">Voice Script</h2>
                        <SmartScriptEditor
                            data={smartTemplateData}
                            onChange={(newData) => setSmartTemplateData(newData)}
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => navigate('/saved')}
                        className="text-gray-600 hover:text-gray-900 underline"
                    >
                        Back to Saved Scripts
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Edit Script</h1>
            <form onSubmit={handleSubmit(handleLegacySubmit)} className="space-y-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-gray-700">Scene {index + 1}</span>
                            <span className="text-gray-500 text-sm">
                                <input
                                    type="number"
                                    {...register(`scenes.${index}.estimated_duration`, { valueAsNumber: true })}
                                    className="w-16 p-1 border rounded text-right"
                                /> s
                            </span>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-blue-600 mb-1">Visual Description</label>
                            <textarea
                                {...register(`scenes.${index}.visual_description`)}
                                className="w-full p-2 border rounded"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-green-600 mb-1">Audio Text</label>
                            <textarea
                                {...register(`scenes.${index}.text`)}
                                className="w-full p-2 border rounded"
                                rows={3}
                            />
                        </div>
                    </div>
                ))}

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/saved')}
                        className="px-6 py-2 border rounded text-gray-600 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? 'Publishing...' : 'Save & Publish'}
                    </button>
                </div>
            </form>
        </div>
    );
}
