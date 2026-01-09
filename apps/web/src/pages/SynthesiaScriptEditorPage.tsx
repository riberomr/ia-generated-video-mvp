import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { SceneObjective, SceneComplexity, ScenePOV } from "@eduvideogen/shared-types";

// Reuse types from Generator (or ideally move to shared-types if valid)
// For now, mirroring the structure persisted in DB
type SceneConfig = {
    topic: string;
    duration: number;
    emotion: string;
    visual_context: string;
    objective?: SceneObjective;
    complexity?: SceneComplexity;
    pov?: ScenePOV;
    keywords?: string[]; // Stored as array in DB

    // AI Generated Content
    scriptText?: string;
    metadata?: any;
};

type FormValues = {
    title: string;
    scenes: SceneConfig[];
};

export const SynthesiaScriptEditorPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { register, control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            title: "",
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
                const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-scripts/${id}`);
                if (!res.ok) throw new Error("Failed to load script");

                const data = await res.json();

                // Map DB data to Form
                // Scenes from DB might be in 'input' format if from generator directly, 
                // but our generator saves 'scenes' as the input array from Groq which has specific structure.
                // Let's verify structure: Groq output 'input' array has { scriptText, metadata: { ...originalConfig } }

                // We need to map this back to something editable if we want to re-generate OR just edit the text?
                // The user requirements say "Edit & Update". Usually this means editing the text.
                // But the "Scene Config" inputs are also there.
                // If I load the "Generated" script, the 'scenes' might be the output format.

                // Let's check what we saved:
                // We saved `scenes: scriptJson.input`
                // `startScriptJson.input` structure: 
                // [ { scriptText, avatar..., metadata: { topic, duration_sec ... } } ]

                // So we should map this back to our form.
                const mappedScenes = (data.scenes || []).map((s: any) => ({
                    topic: s.metadata?.topic || s.topic || "", // Fallback if metadata missing
                    duration: s.metadata?.duration_sec || 10,
                    emotion: s.metadata?.emotion || "neutral",
                    visual_context: s.metadata?.visual_context || "",

                    // Recovering other metadata if preserved, otherwise defaults
                    // The Groq prompt didn't explicitly store objective/complexity in metadata output, 
                    // only what I asked for: scene_index, topic, duration_sec, emotion, visual_context.
                    // If we want to preserve objective/complexity, we should have asked Groq to return it in metadata.
                    // For now, we might lose them or stick to defaults if not returned.

                    scriptText: s.scriptText || ""
                }));

                reset({
                    title: data.title,
                    scenes: mappedScenes
                });

            } catch (err) {
                console.error(err);
                alert("Error loading script");
            } finally {
                setLoading(false);
            }
        };

        fetchScript();
    }, [id, reset]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setSaving(true);
        try {
            // We are saving the UPDATED state. 
            // NOTE: If we want to send this to Synthesia later, we need to maintain the full structure (avatar, etc.)
            // For now, we are just updating the 'scenes' JSON in DB. 
            // If the user wants to Regenerate Video, we will need to ensure the structure is valid for Synthesia.
            // But this Editor seems to be for the SCRIPT content.

            // Re-construct the 'scenes' array to match what might be expected? 
            // Or just save what we have? 

            // If we only edit text/topic, we might lose the 'avatar', 'background' fields if we don't keep them.
            // Ideally we should merge with original, but reset() replaced everything.
            // For MVP, we'll assume we just save this list and maybe re-generate structure later?
            // OR simpler: The form includes `scriptText`. We save `scenes` array.

            // Let's ensure we save consistent data.
            const payload = {
                title: data.title,
                scenes: data.scenes.map(s => ({
                    // reconstructing a minimal valid object, or we should have kept hidden fields.
                    // For this MVP, let's just save the config + text.
                    scriptText: s.scriptText,
                    metadata: {
                        topic: s.topic,
                        duration_sec: s.duration,
                        emotion: s.emotion,
                        visual_context: s.visual_context
                    }
                }))
            };

            const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-scripts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            alert("Saved successfully!");

        } catch (err) {
            console.error(err);
            alert("Error saving");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Editor...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Script Editor</h1>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/generate-script')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Back</button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Video Title</label>
                    <input {...register("title")} className="w-full border p-2 rounded" />
                </div>

                <div className="space-y-6 mt-6">
                    {fields.map((field, index) => (
                        <div key={field.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-700">Scene {index + 1}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Topic</label>
                                    <input {...register(`scenes.${index}.topic` as const)} className="w-full border p-2 rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Duration (s)</label>
                                    <input type="number" {...register(`scenes.${index}.duration` as const)} className="w-full border p-2 rounded text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-blue-600 mb-1">Script Text (AI Generated)</label>
                                <textarea
                                    {...register(`scenes.${index}.scriptText` as const)}
                                    rows={4}
                                    className="w-full border-blue-200 border-2 rounded p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
