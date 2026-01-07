import { useForm } from 'react-hook-form';
import { CreateCourseDto } from '@eduvideogen/shared-types';
import { useNavigate } from 'react-router-dom';

export function ScriptGenerator() {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<CreateCourseDto>();
    const navigate = useNavigate();

    const onSubmit = async (data: CreateCourseDto) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/courses/generate-script`, {
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
            navigate(`/editor/${result.scriptId}`);
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
        </div>
    );
}
