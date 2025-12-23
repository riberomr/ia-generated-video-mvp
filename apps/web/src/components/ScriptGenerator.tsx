import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreateCourseDto, Scene } from '@eduvideogen/shared-types';

export function ScriptGenerator() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<CreateCourseDto>();
    const [generatedScript, setGeneratedScript] = useState<Scene[] | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    const onSubmit = async (data: CreateCourseDto) => {
        try {
            const response = await fetch('http://localhost:3000/courses/generate-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to generate script');
            }

            const result = await response.json();
            setGeneratedScript(result.generatedScript);
            setJobId(result.videoJobId);
        } catch (error) {
            console.error(error);
            alert('Error generating script');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">EduVideoGen - AI Script Generator</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-12">
                <div>
                    <label className="block text-sm font-medium mb-2">Topic</label>
                    <input
                        {...register('topic', { required: true })}
                        className="w-full p-2 border rounded"
                        placeholder="e.g. Introduction to Quantum Physics"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Course Content / Syllabus</label>
                    <textarea
                        {...register('content', { required: true })}
                        className="w-full p-2 border rounded h-48"
                        placeholder="Paste your course content here..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Generating...' : 'Generate Script'}
                </button>
            </form>

            {generatedScript && (
                <div className="bg-gray-50 p-6 rounded-lg border">
                    <h2 className="text-2xl font-semibold mb-4">Generated Script Preview</h2>
                    {jobId && <div className="mb-4 text-green-600 text-sm">Job ID: {jobId}</div>}

                    <div className="space-y-6">
                        {generatedScript.map((scene, index) => (
                            <div key={index} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-gray-700">Scene {index + 1}</span>
                                    <span className="text-gray-500 text-sm">{scene.estimated_duration}s</span>
                                </div>
                                <div className="mb-2">
                                    <span className="font-semibold text-blue-600">Visual: </span>
                                    <span className="text-gray-800">{scene.visual_description}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-green-600">Audio: </span>
                                    <p className="text-gray-800 italic mt-1">{scene.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
