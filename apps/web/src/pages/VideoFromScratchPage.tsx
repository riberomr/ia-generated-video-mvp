import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, SubmitHandler, useWatch, Control } from "react-hook-form";

// Tipos basados en la estructura proporcionada
type VideoSettings = {
    shortBackgroundContentMatchMode: "freeze" | "loop" | "slow_down";
    longBackgroundContentMatchMode: "trim" | "speed_up";
};

type BackgroundSettings = {
    videoSettings: VideoSettings;
};

type AvatarSettings = {
    voice?: string;
    horizontalAlign?: "left" | "center" | "right";
    scale?: number;
    style?: "rectangular" | "circular";
    backgroundColor?: string;
    seamless?: boolean;
};

type SceneInput = {
    inputType: "text" | "audio"; // Frontend only state
    scriptText?: string;
    scriptAudio?: string;
    scriptLanguage?: string;
    avatar: string; // default: anna_costume1_cameraA
    background: string; // default: green_screen
    avatarSettings?: AvatarSettings;
    backgroundSettings?: BackgroundSettings;
};

type CtaSettings = {
    label: string;
    url: string;
};

type VideoPayload = {
    title: string;
    description?: string;
    visibility: "private" | "public";
    aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "5:4";
    test: boolean;
    soundtrack?: "corporate" | "inspirational" | "modern" | "urban";
    callbackId?: string;
    ctaSettings?: CtaSettings;
    input: SceneInput[];
};

// Component helper to watch input type per row
const SceneInputFields = ({
    control,
    index,
    register,
    errors
}: {
    control: Control<VideoPayload>,
    index: number,
    register: any,
    errors: any
}) => {
    const inputType = useWatch({
        control,
        name: `input.${index}.inputType`,
        defaultValue: "text"
    });

    return (
        <div className="lg:col-span-2 space-y-4">
            {/* Input Type Selector */}
            <div className="flex space-x-4 mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="radio"
                        value="text"
                        {...register(`input.${index}.inputType`)}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Text Script</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="radio"
                        value="audio"
                        {...register(`input.${index}.inputType`)}
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Audio Asset</span>
                </label>
            </div>

            {/* Conditional Inputs */}
            {inputType === 'text' ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Script Text *</label>
                        <textarea
                            {...register(`input.${index}.scriptText` as const, { required: "Script text is required" })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3"
                            rows={4}
                            placeholder="Enter the text for the avatar to speak..."
                        />
                        {errors.input?.[index]?.scriptText && <span className="text-red-500 text-xs">Required</span>}
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Audio Asset ID *</label>
                        <input
                            {...register(`input.${index}.scriptAudio` as const, { required: "Audio Asset ID is required" })}
                            className="mt-1 block w-full border rounded-md p-2 text-sm"
                            placeholder="e.g. 1234-5678-..."
                        />
                        {errors.input?.[index]?.scriptAudio && <span className="text-red-500 text-xs">Required</span>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Language (Optional)</label>
                        <input {...register(`input.${index}.scriptLanguage` as const)} placeholder="en-US" className="mt-1 block w-full border rounded-md p-2 text-sm" />
                    </div>
                </>
            )}
        </div>
    );
};

export const VideoFromScratchPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchParams] = useSearchParams();
    const scriptId = searchParams.get("scriptId");

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<VideoPayload>({
        defaultValues: {
            title: "My first Synthetic video",
            visibility: "private",
            aspectRatio: "16:9",
            test: false,
            input: [
                {
                    inputType: "text",
                    scriptText: "Hello, World! This is my first AI generated video.",
                    avatar: "anna_costume1_cameraA",
                    background: "green_screen",
                    avatarSettings: {
                        horizontalAlign: "center",
                        scale: 1.0,
                        style: "rectangular",
                        seamless: false,
                    },
                    backgroundSettings: {
                        videoSettings: {
                            shortBackgroundContentMatchMode: "freeze",
                            longBackgroundContentMatchMode: "trim",
                        },
                    },
                },
            ],
        },
    });

    const { fields, append, remove,
        // replace 
    } = useFieldArray({
        control,
        name: "input",
    });

    useEffect(() => {
        if (!scriptId) return;

        const fetchScript = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/synthesia-scripts/${scriptId}`);
                if (!res.ok) throw new Error("Failed to load script");
                const data = await res.json();

                // Map script data to form
                const mappedScenes = (data.scenes || []).map((s: any) => ({
                    inputType: "text",
                    scriptText: s.scriptText,
                    // Defaults for visual parts
                    avatar: "anna_costume1_cameraA",
                    background: "green_screen",
                    avatarSettings: {
                        horizontalAlign: "center",
                        scale: 1.0,
                        style: "rectangular",
                        seamless: false,
                    },
                    backgroundSettings: {
                        videoSettings: {
                            shortBackgroundContentMatchMode: "freeze",
                            longBackgroundContentMatchMode: "trim",
                        },
                    },
                }));

                reset({
                    title: data.title || "AI Generated Video",
                    description: '',
                    visibility: "private",
                    aspectRatio: "16:9",
                    test: false,
                    input: mappedScenes
                });

            } catch (error) {
                console.error("Error loading script:", error);
                alert("Failed to pre-fill script data.");
            }
        };

        fetchScript();
    }, [scriptId, reset]);

    const onSubmit: SubmitHandler<VideoPayload> = async (data) => {
        // Strict cleanup of payload
        const processedData = {
            ...data,
            input: data.input.map((scene) => {
                // Common cleanup
                const baseScene = {
                    ...scene,
                    avatarSettings: {
                        ...scene.avatarSettings,
                        scale: parseFloat(String(scene.avatarSettings?.scale || 1.0)),
                        voice: scene.avatarSettings?.voice?.trim() || undefined
                    },
                    // Remove frontend-only state
                    inputType: undefined
                };

                // Exclusive Logic
                if (scene.inputType === 'text') {
                    return {
                        ...baseScene,
                        scriptAudio: undefined,
                        scriptLanguage: undefined, // "Not applicable if scriptText is provided"
                        scriptText: scene.scriptText
                    };
                } else {
                    return {
                        ...baseScene,
                        scriptText: undefined,
                        scriptAudio: scene.scriptAudio,
                        scriptLanguage: scene.scriptLanguage?.trim() || undefined
                    };
                }
            }),
            callbackId: data.callbackId?.trim() || undefined,
            description: data.description?.trim() || undefined,
            soundtrack: data.soundtrack || undefined,
            ctaSettings: (data.ctaSettings?.label && data.ctaSettings?.url)
                ? data.ctaSettings
                : undefined,
            scriptId: scriptId || undefined
        };

        console.log("Submitting Payload:", JSON.stringify(processedData, null, 2));

        setIsSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(processedData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create video');
            }

            const result = await response.json();
            console.log('Server Response:', result);
            alert(`Video created successfully! ID: ${result.id}`);

        } catch (error: any) {
            console.error('Error creating video:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md my-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">
                Video From Scratch (Synthesia API)
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* === General Settings === */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700">General Settings</h2>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title *</label>
                            <input
                                {...register("title", { required: "Title is required" })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                placeholder="My Video Title"
                            />
                            {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                {...register("description")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                rows={2}
                            />
                        </div>

                        {/* Callback ID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Callback ID</label>
                            <input
                                {...register("callbackId")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700">Output Config</h2>

                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Visibility</label>
                            <select
                                {...register("visibility")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            >
                                <option value="private">Private</option>
                                <option value="public">Public</option>
                            </select>
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
                            <select
                                {...register("aspectRatio")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            >
                                <option value="16:9">16:9</option>
                                <option value="9:16">9:16 (Vertical)</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="4:5">4:5</option>
                                <option value="5:4">5:4</option>
                            </select>
                        </div>

                        {/* Soundtrack */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Soundtrack</label>
                            <select
                                {...register("soundtrack")}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            >
                                <option value="">None</option>
                                <option value="corporate">Corporate</option>
                                <option value="inspirational">Inspirational</option>
                                <option value="modern">Modern</option>
                                <option value="urban">Urban</option>
                            </select>
                        </div>

                        {/* Test Mode */}
                        <div className="flex items-center pt-4">
                            <input
                                type="checkbox"
                                {...register("test")}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                                Test Mode (Free/Draft)
                            </label>
                        </div>
                    </div>
                </div>

                {/* === CTA Settings === */}
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <h3 className="text-md font-medium text-gray-800 mb-3">CTA Settings (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">Label</label>
                            <input {...register("ctaSettings.label")} className="mt-1 block w-full rounded-md border-gray-300 border p-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase">URL</label>
                            <input {...register("ctaSettings.url")} className="mt-1 block w-full rounded-md border-gray-300 border p-2 text-sm" placeholder="https://..." />
                        </div>
                    </div>
                </div>


                {/* === Scenes (Input Array) === */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-2xl font-bold text-gray-800">Scenes (Input)</h2>
                        <button
                            type="button"
                            onClick={() => append({
                                inputType: "text",
                                scriptText: "",
                                avatar: "anna_costume1_cameraA",
                                background: "green_screen",
                                avatarSettings: { horizontalAlign: "center", scale: 1, style: "rectangular" },
                                backgroundSettings: { videoSettings: { shortBackgroundContentMatchMode: "freeze", longBackgroundContentMatchMode: "trim" } }
                            })}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-colors"
                        >
                            + Add Scene
                        </button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-300 rounded-lg p-6 bg-gray-50 relative animate-fadeIn">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-700">Scene #{index + 1}</h3>
                                <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove Scene</button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Column 1: Script Helper Component */}
                                <SceneInputFields
                                    control={control}
                                    index={index}
                                    register={register}
                                    errors={errors}
                                />

                                {/* Column 2: Visuals */}
                                <div className="space-y-4 bg-white p-4 rounded-md border">
                                    <h4 className="font-semibold text-gray-700 border-b pb-2">Visual Configuration</h4>

                                    {/* Avatar & Background */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Avatar ID</label>
                                        <input
                                            {...register(`input.${index}.avatar` as const)}
                                            className="mt-1 block w-full border rounded-md p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Background (ID or Color)</label>
                                        <input
                                            {...register(`input.${index}.background` as const)}
                                            className="mt-1 block w-full border rounded-md p-2 text-sm"
                                        />
                                    </div>

                                    {/* Avatar Settings */}
                                    <div className="pt-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Avatar Settings</p>
                                        <div className="mb-2">
                                            <label className="block text-xs font-medium text-gray-500">Voice ID</label>
                                            <input
                                                {...register(`input.${index}.avatarSettings.voice` as const)}
                                                placeholder="Voice ID (optional)"
                                                className="mt-1 block w-full border rounded-md p-2 text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select {...register(`input.${index}.avatarSettings.horizontalAlign` as const)} className="border rounded p-1 text-xs">
                                                <option value="center">Center</option>
                                                <option value="left">Left</option>
                                                <option value="right">Right</option>
                                            </select>
                                            <select {...register(`input.${index}.avatarSettings.style` as const)} className="border rounded p-1 text-xs">
                                                <option value="rectangular">Rectangular</option>
                                                <option value="circular">Circular</option>
                                            </select>
                                            <input
                                                type="number"
                                                step="0.1"
                                                {...register(`input.${index}.avatarSettings.scale` as const)}
                                                placeholder="Scale (1.0)"
                                                className="border rounded p-1 text-xs"
                                            />
                                            <div className="flex items-center">
                                                <label className="text-xs mr-2">Seamless</label>
                                                <input type="checkbox" {...register(`input.${index}.avatarSettings.seamless` as const)} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Settings */}
                                    <div className="pt-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Bg Video Settings</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <select {...register(`input.${index}.backgroundSettings.videoSettings.shortBackgroundContentMatchMode` as const)} className="border rounded p-1 text-xs">
                                                <option value="freeze">Short: Freeze</option>
                                                <option value="loop">Short: Loop</option>
                                                <option value="slow_down">Short: Slow Down</option>
                                            </select>
                                            <select {...register(`input.${index}.backgroundSettings.videoSettings.longBackgroundContentMatchMode` as const)} className="border rounded p-1 text-xs">
                                                <option value="trim">Long: Trim</option>
                                                <option value="speed_up">Long: Speed Up</option>
                                            </select>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full font-bold py-3 px-4 rounded-md shadow-lg transition duration-200 transform hover:scale-[1.01] ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isSubmitting ? 'Generating...' : 'Create Video'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-2">Payload will also be logged to console.</p>
                </div>

            </form>
        </div>
    );
};

