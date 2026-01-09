import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { SceneObjective, SceneComplexity, ScenePOV } from "@eduvideogen/shared-types";
// import { Loader2, Plus, Trash2, RefreshCw, Save } from "lucide-react"; // Removed: Lib not found

type SceneConfig = {
    // Input Config
    topic: string;
    duration: number;
    emotion: string;
    visual_context: string;
    objective: SceneObjective;
    complexity: SceneComplexity;
    pov: ScenePOV;
    keywords: string;

    // Generated Output
    scriptText?: string;
    avatar?: string;
    background?: string;
    // We keep metadata for reference if needed
    metadata?: any;
};

type FormValues = {
    title: string;
    sourceText: string;
    sceneCount: number;
    scenes: SceneConfig[];
};

export const GenerateScriptScreen = () => {
    const { id } = useParams<{ id: string }>(); // If ID exists, we are in Editor Mode
    const navigate = useNavigate();

    // UI States
    const [generatedJson, setGeneratedJson] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingScript, setLoadingScript] = useState(false);
    const [regeneratingSceneIndex, setRegeneratingSceneIndex] = useState<number | null>(null);

    // Regenerate Logic
    const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
    const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
    const [regenerateFeedback, setRegenerateFeedback] = useState("");

    const isEditMode = !!id;

    const { register, control, handleSubmit, watch,
        // setValue, 
        reset, getValues } = useForm<FormValues>({
            defaultValues: {
                title: "",
                sourceText: "",
                sceneCount: 3,
                scenes: [
                    { topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" },
                    { topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" },
                    { topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" }
                ]
            }
        });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "scenes"
    });

    const sceneCountValue = watch("sceneCount");

    // Fetch Script if ID exists
    useEffect(() => {
        if (!id) {
            // Reset to default on Create Mode
            reset({
                title: "",
                sourceText: "",
                sceneCount: 3,
                scenes: [
                    { topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" },
                    { topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" },
                    { topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" }
                ]
            });
            setGeneratedJson(null);
            return;
        }

        const fetchScript = async () => {
            setLoadingScript(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-scripts/${id}`);
                if (!res.ok) throw new Error("Failed to load script");
                const data = await res.json();

                // Map data to Form
                const mappedScenes = (data.scenes || []).map((s: any) => ({
                    topic: s.metadata?.topic || s.topic || "",
                    duration: s.metadata?.duration_sec || 10,
                    emotion: s.metadata?.emotion || "neutral",
                    visual_context: s.metadata?.visual_context || "",
                    objective: SceneObjective.EDUCATIONAL, // Defaults if not in metadata
                    complexity: SceneComplexity.GENERAL,
                    pov: ScenePOV.SECOND_PERSON,
                    keywords: s.metadata?.keywords || "", // Lost in transformation usually

                    scriptText: s.scriptText,
                    avatar: s.avatar,
                    background: s.background,
                    metadata: s.metadata
                }));

                reset({
                    title: data.title,
                    sourceText: data.sourceContent?.content || "", // Include sourceContent
                    sceneCount: mappedScenes.length,
                    scenes: mappedScenes
                });

                // If in edit mode, we can show the JSON of the loaded script
                setGeneratedJson(data);

            } catch (err) {
                console.error(err);
                alert("Error loading script");
            } finally {
                setLoadingScript(false);
            }
        };

        fetchScript();
    }, [id, reset]);

    // Sync sceneCount only in Creation Mode
    useEffect(() => {
        if (isEditMode) return;
        const count = parseInt(String(sceneCountValue)) || 0;
        if (count > 0 && count !== fields.length) {
            // Preserve existing, add new if needed
            if (count > fields.length) {
                const toAdd = count - fields.length;
                for (let i = 0; i < toAdd; i++) {
                    append({ topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" });
                }
            } else {
                // Remove from end
                for (let i = fields.length - 1; i >= count; i--) {
                    remove(i);
                }
            }
        }
    }, [sceneCountValue, isEditMode, append, remove]);

    const handleCreateScript: SubmitHandler<FormValues> = async (data) => {
        setIsGenerating(true);
        setGeneratedJson(null);
        try {
            const payload = {
                title: data.title,
                sourceText: data.sourceText,
                sceneCount: Number(fields.length), // Use actual fields length
                scenes: data.scenes.map(s => ({
                    ...s,
                    duration: Number(s.duration),
                    keywords: s.keywords ? s.keywords.split(',').map(k => k.trim()) : []
                }))
            };

            const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/generate-script`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to generate script');

            const json = await response.json();
            setGeneratedJson(json);

            // Redirect to editor (which is now THIS screen with ID)
            if (json.id) {
                navigate(`/generate-script/${json.id}`); // Wait, route is /script-editor/:id or we change route?
                // The user context maps /script-editor/:id to SynthesiaScriptEditorPage.
                // But we are refactoring GenerateScriptScreen to BE the editor.
                // The user didn't say "Delete SynthesiaScriptEditorPage". 
                // Maybe I should redirect to `/generate-script/${json.id}` if I add a route?
                // OR I just navigate to `/script-editor/${json.id}` AND Replace the component for that route?
                // For now, I'll stick to navigating to the route that renders THIS component.
                // Current route for this is /generate-script. It doesn't take ID param in route def yet?
                // Route definition: <Route path="/generate-script" element={<GenerateScriptScreen />} />
                // It does NOT have :id.
                // So I can't use useParams ID unless I change route!

                // CRITICAL FIX: I need to ask user or assume.
                // Since I cannot change routes easily without seeing App.tsx (I saw it), I should probably UPDATE APP.TSX too?
                // Or use Query Param ?id=...
                // useParams usually requires route config.
                // I'll use Query Parameter for now if I can't change App.tsx easily?
                // No, I can change App.tsx. I will change App.tsx to `/generate-script/:id?` or similar.
                // OR I will navigate to `/script-editor/${json.id}` and UPDATE SynthesiaScriptEditorPage to be THIS new code?
                // User said "File: GenerateScriptScreen.tsx".
                // So likely they want me to reuse this screen.

                // I will add a redirect to `?id=` query param if route doesn't support it, OR better, I will assume the User handles the Routing or I should update App.tsx. 
                // I'll update App.tsx to add `:id?` to generate-script?
                // Actually, let's use Query Param `?id=` for "Edit Mode" in GenerateScriptScreen to avoid breaking existing routes if not asked.
                // But the code above uses `useParams`.

                // Let's use `useSearchParams` or update App.tsx. Updating App.tsx is cleaner.
                // I will check App.tsx again.
                // Route path="/generate-script" element={<GenerateScriptScreen />}

                // I'll update App.tsx in a separate tool call if needed. For now I'll use logic that supports useParams if available.
                navigate(`/generate-script/${json.id}`); // Hypothetical, I'll use the existing route logic but maybe I need to change App.tsx.
            }

        } catch (error: any) {
            console.error(error);
            alert("Error generating script: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    // BUT WAIT: The current route is `/generate-script`.
    // I will assume I should update App.tsx to allow `/generate-script/:id` OR just use `script-editor/:id` and REPLACE the component there?
    // User task 4: "Refactor and make Editor Mode to support the new features... File: GenerateScriptScreen.tsx".
    // This implies GenerateScriptScreen should handle it.

    // I'll proceed with GenerateScriptScreen and I will update App.tsx to point `/generate-script/:id` to it OR just use Query Params?
    // useParams is cleaner. Use query params for now to avoid App.tsx drift? No, useParams is standard.
    // I'll use useParams. I will have to update App.tsx. 

    const handleUpdateScript = async () => {
        if (!id) return;
        setIsGenerating(true); // Reuse loading state
        try {
            const payload = {
                title: getValues("title"),
                scenes: getValues("scenes").map(s => ({
                    ...s,
                    duration: Number(s.duration),
                    keywords: s.keywords ? (typeof s.keywords === 'string' ? s.keywords.split(',').map(k => k.trim()) : s.keywords) : []
                }))
            };

            const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-scripts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update script');

            const json = await response.json();
            alert("Script updated successfully!");
            // Optionally refresh or just update state? The form is already up to date.

        } catch (error: any) {
            console.error(error);
            alert("Error updating script: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateScene = async () => {
        // Validation: Must select a scene, but Feedback is now OPTIONAL
        if (selectedSceneIndex === null) return;

        setRegeneratingSceneIndex(selectedSceneIndex);
        setRegenerateModalOpen(false); // Close modal

        try {
            // CRITICAL FIX: Use getValues() to get the LATEST edited data in the inputs. 
            // "fields" from useFieldArray might be stale if the user didn't trigger a field array update.
            const currentFormValues = getValues();
            const currentScene = currentFormValues.scenes[selectedSceneIndex] as SceneConfig;
            const contextScenes = currentFormValues.scenes;

            // Construct payload
            // "allScenes" context: we pass the current state of scenes
            // We need to map them to a simple structure for context
            const allScenesContext = contextScenes.map(f => ({
                topic: f.topic,
                scriptText: f.scriptText || ""
            }));

            // Current Scene Data (full)
            // We need to pass valid structure.
            // If it's a fresh scene (no scriptText), we pass what we have.

            const payload = {
                sourceContentText: getValues("sourceText"),
                allScenes: allScenesContext,
                targetSceneIndex: selectedSceneIndex,
                currentSceneData: currentScene, // This now contains the LATEST topic/keyboards typed by user
                userFeedback: regenerateFeedback || "" // Allow empty feedback
            };



            const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-scripts/regenerate-scene`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to regenerate");

            const newSceneData = await res.json();

            // Replace the scene in the form
            // Merge with existing config (topic etc) or take strictly what AI returned?
            // AI returns full scene object usually.
            // But we want to keep our Form Config (topic, duration etc) if AI didn't change them?
            // The AI returns { scriptText, metadata... }.
            // Let's merge carefully.

            const updatedScene = {
                ...currentScene,
                ...newSceneData, // Overwrites scriptText, metadata
                // Ensure topic/duration are synced if AI changed them in metadata
                topic: newSceneData.metadata?.topic || currentScene.topic,
                duration: newSceneData.metadata?.duration_sec || currentScene.duration,
            };

            update(selectedSceneIndex, updatedScene);

        } catch (e: any) {
            console.error(e);
            alert("Error regenerating scene: " + e.message);
        } finally {
            setRegeneratingSceneIndex(null);
            setRegenerateFeedback("");
            setSelectedSceneIndex(null);
        }
    };

    const openRegenerateModal = (index: number) => {
        setSelectedSceneIndex(index);
        setRegenerateFeedback("");
        setRegenerateModalOpen(true);
    };

    if (loadingScript) return <div className="p-10 text-center">Loading Script...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md my-8 h-[85vh] flex flex-col relative">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4 shrink-0 flex justify-between items-center">
                <span>{isEditMode ? "Advanced Script Editor" : "AI Script Generator"}</span>
                {isEditMode && <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">Read-Only Source Mode</span>}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">

                {/* LEFT COL: Global Settings + JSON Output */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                    <form id="script-form" onSubmit={handleSubmit(handleCreateScript)} className="space-y-4 bg-gray-50 p-4 rounded-lg border overflow-y-auto max-h-[100%]">
                        <h3 className="font-bold text-gray-700">Global Settings</h3>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Video Title</label>
                            <input
                                {...register("title", { required: true })}
                                className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Training Video 101"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Source Context</label>
                            <textarea
                                {...register("sourceText", { required: !isEditMode })}
                                rows={8}
                                disabled={isEditMode}
                                className={`mt-1 block w-full border rounded-md p-2 shadow-sm text-sm ${isEditMode ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
                                placeholder="Paste source material here..."
                            />
                        </div>

                        {!isEditMode && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Input Scene Count</label>
                                <input
                                    type="number"
                                    {...register("sceneCount", { min: 1, max: 20 })}
                                    className="mt-1 block w-full border rounded-md p-2 shadow-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Manual control available in list.</p>
                            </div>
                        )}

                        {/* Generate Button - Hidden in Edit Mode */}
                        {!isEditMode && (
                            <button
                                type="submit"
                                disabled={isGenerating}
                                className={`w-full py-3 px-4 rounded-md font-bold text-white shadow-lg transition duration-200 
                                ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Script'}
                            </button>
                        )}

                        {/* Update Button - Visible ONLY in Edit Mode */}
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleUpdateScript}
                                disabled={isGenerating}
                                className={`w-full py-3 px-4 rounded-md font-bold text-white shadow-lg transition duration-200 mb-2
                                ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isGenerating ? 'Saving...' : 'Update Script'}
                            </button>
                        )}

                        {isEditMode && (
                            <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                                Editing Mode Active. Use "Regenerate" to improve scenes or "Update Script" to save changes.
                            </div>
                        )}
                    </form>

                    {/* Result JSON Area */}
                    <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto border border-gray-700">
                        {generatedJson ? (
                            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-all">
                                {JSON.stringify(generatedJson, null, 2)}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                                <span>JSON Output will appear here</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: Scene Cards */}
                <div className="lg:col-span-8 flex flex-col bg-gray-50 rounded-lg border overflow-hidden">
                    <div className="p-4 bg-white border-b shadow-sm shrink-0 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-gray-800">Scene Configuration</h2>
                            <p className="text-xs text-gray-500">{fields.length} Scenes Total</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => append({ topic: "", duration: 10, emotion: "neutral", visual_context: "", objective: SceneObjective.EDUCATIONAL, complexity: SceneComplexity.GENERAL, pov: ScenePOV.SECOND_PERSON, keywords: "" })}
                            className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                            + Add Scene
                        </button>
                    </div>

                    <div className="overflow-y-auto p-4 space-y-4 pb-20">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Scene #{index + 1}</span>
                                    <div className="flex gap-2">
                                        {isEditMode && <button
                                            type="button"
                                            onClick={() => openRegenerateModal(index)}
                                            className="ml-2 flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                                            disabled={regeneratingSceneIndex === index}
                                        >
                                            {regeneratingSceneIndex === index ? "..." : "Ref"}
                                            {regeneratingSceneIndex === index ? "Regenerating..." : "Regenerate"}
                                        </button>}

                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                            title="Remove Scene"
                                        >
                                            Del
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {/* Generated Script Text Area (Visible if present) */}
                                    {(field as SceneConfig).scriptText && (
                                        <div className="mb-4">
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Script (AI Generated)</label>
                                            <textarea
                                                {...register(`scenes.${index}.scriptText` as const)}
                                                rows={3}
                                                className="block w-full border-blue-200 border-2 rounded p-2 text-sm bg-blue-50 focus:bg-white transition-colors"
                                                placeholder="Generated script will appear here..."
                                            />
                                        </div>
                                    )}

                                    {/* Row 1: Topic */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Topic / Narrative Goal *</label>
                                        <input
                                            {...register(`scenes.${index}.topic` as const, { required: true })}
                                            className="block w-full border rounded p-2 text-sm focus:border-blue-500 bg-gray-50 focus:bg-white"
                                            placeholder="What is this scene about?"
                                        />
                                    </div>

                                    {/* Row 2: Narrative Controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Objective</label>
                                            <select {...register(`scenes.${index}.objective` as const)} className="block w-full border rounded p-2 text-sm bg-gray-50">
                                                <option value={SceneObjective.EDUCATIONAL}>Educational</option>
                                                <option value={SceneObjective.HOOK}>Hook (Intro)</option>
                                                <option value={SceneObjective.CTA}>Call to Action</option>
                                                <option value={SceneObjective.TRANSITION}>Transition</option>
                                                <option value={SceneObjective.JOKE}>Humor/Joke</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Complexity</label>
                                            <select {...register(`scenes.${index}.complexity` as const)} className="block w-full border rounded p-2 text-sm bg-gray-50">
                                                <option value={SceneComplexity.GENERAL}>General Audience</option>
                                                <option value={SceneComplexity.CHILD}>Child / Simple</option>
                                                <option value={SceneComplexity.TECHNICAL}>Technical</option>
                                                <option value={SceneComplexity.ACADEMIC}>Academic</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">POV</label>
                                            <select {...register(`scenes.${index}.pov` as const)} className="block w-full border rounded p-2 text-sm bg-gray-50">
                                                <option value={ScenePOV.SECOND_PERSON}>You (Client/Student)</option>
                                                <option value={ScenePOV.FIRST_PERSON}>I/We (Instructor)</option>
                                                <option value={ScenePOV.THIRD_PERSON}>It/They (System)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Row 3: Styling */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Keywords (Comma separated)</label>
                                            <input
                                                {...register(`scenes.${index}.keywords` as const)}
                                                className="block w-full border rounded p-2 text-sm"
                                                placeholder="e.g. ROI, Growth, Sales"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Visual Context</label>
                                            <input
                                                {...register(`scenes.${index}.visual_context` as const)}
                                                className="block w-full border rounded p-2 text-sm"
                                                placeholder="e.g. Chart showing 50% growth"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 4: Emotion & Duration */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Emotion (Tone)</label>
                                            <select {...register(`scenes.${index}.emotion` as const)} className="block w-full border rounded p-2 text-sm bg-white">
                                                <option value="neutral">Neutral</option>
                                                <option value="excited">Excited / High Energy</option>
                                                <option value="serious">Serious / Professional</option>
                                                <option value="empathetic">Empathetic</option>
                                                <option value="sad">Sad / Melancholic</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Duration (sec)</label>
                                            <input
                                                type="number"
                                                {...register(`scenes.${index}.duration` as const)}
                                                className="block w-full border rounded p-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Regenerate Modal */}
            {regenerateModalOpen && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Regenerate Scene #{selectedSceneIndex! + 1}</h3>
                        <p className="text-sm text-gray-600 mb-4">How should we improve this scene?</p>
                        <textarea
                            value={regenerateFeedback}
                            onChange={(e) => setRegenerateFeedback(e.target.value)}
                            className="w-full border rounded p-2 text-sm mb-4 h-32"
                            placeholder="e.g. Make it more enthusiastic, mention the quarterly results explicitly..."
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setRegenerateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                            <button
                                onClick={handleRegenerateScene}
                                // disabled={!regenerateFeedback}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

