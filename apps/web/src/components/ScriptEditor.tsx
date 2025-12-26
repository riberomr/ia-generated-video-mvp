
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Scene, UpdateScriptDto } from '@eduvideogen/shared-types';

interface ScriptEditorForm {
    scenes: Scene[];
}

export function ScriptEditor() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { control, register, handleSubmit, reset } = useForm<ScriptEditorForm>({
        defaultValues: {
            scenes: []
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "scenes"
    });

    useEffect(() => {
        if (!id) return;

        const fetchScript = async () => {
            try {
                const response = await fetch(`http://localhost:3000/courses/scripts/${id}`);
                if (!response.ok) throw new Error('Failed to load script');
                const data = await response.json();

                // data.scenes might be Prisma Json, ensure it's mapped correctly
                reset({ scenes: data.scenes as Scene[] });
            } catch (error) {
                console.error(error);
                alert('Error loading script');
            } finally {
                setLoading(false);
            }
        };

        fetchScript();
    }, [id, reset]);

    const onSubmit = async (data: ScriptEditorForm) => {
        if (!id) return;
        setSaving(true);
        try {
            const updateDto: UpdateScriptDto = {
                scenes: data.scenes
            };

            const response = await fetch(`http://localhost:3000/courses/scripts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateDto)
            });

            if (!response.ok) throw new Error('Failed to save script');

            alert('Script published successfully!');
            navigate('/saved');
        } catch (error) {
            console.error(error);
            alert('Error saving script');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading script...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Edit Script</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
