import React, { useState } from 'react';
import { TemplateSelector } from '../components/SmartScripting/TemplateSelector';
import { SynthesiaTemplate } from '@eduvideogen/shared-types';
import { useNavigate } from 'react-router-dom';

export const TemplateScriptingPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedTemplate, setSelectedTemplate] = useState<SynthesiaTemplate | null>(null);
    const [files, setFiles] = useState<FileList | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Metadata Form State
    const [formData, setFormData] = useState({
        courseName: '',
        teacherName: '',
        teacherRole: '',
        teacherSpecialty: '',
        instructionalDesigner: '',
        tone: 'Formal',
        style: 'Engage, Connect, Activate',
        studentProfile: 'Postgraduate students, working adults',
    });

    const [generatedScript, setGeneratedScript] = useState<any>(null);

    const handleTemplateSelect = (template: SynthesiaTemplate) => {
        setSelectedTemplate(template);
        setStep(2);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files);
        }
    };

    const handleSubmit = async () => {
        if (!files || files.length === 0) {
            setError('Please upload at least one file (PDF or DOCX).');
            return;
        }

        setLoading(true);
        setError(null);

        const apiFormData = new FormData();
        Array.from(files).forEach(file => {
            apiFormData.append('files', file);
        });

        // Append all metadata
        Object.entries(formData).forEach(([key, value]) => {
            apiFormData.append(key, value);
        });
        
        if (selectedTemplate) {
             apiFormData.append('templateId', selectedTemplate.id);
        }
        apiFormData.append('title', formData.courseName || 'Untitled Course Video');

        try {
            const res = await fetch(`${import.meta.env.VITE_APP_BASE_URL}/videos/generate-from-files`, {
                method: 'POST',
                body: apiFormData,
            });

            if (!res.ok) throw new Error('Failed to generate script');

            const data = await res.json();
            
            if (data.type === 'SCRIPT') {
                // Redirect to the main script editor
                navigate(`/editor/${data.id}`);
            } else {
                setGeneratedScript(data);
                setStep(3); // Go to JSON preview
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error generating script');
        } finally {
            setLoading(false);
        }
    };

    if (step === 3 && generatedScript) {
        // Simple editor view for now, or redirect to a dedicated editor page
        return (
            <div className="p-8 max-w-7xl mx-auto">
                 <button onClick={() => setStep(2)} className="mb-4 text-blue-600 underline">Back to config</button>
                 <div className="bg-green-50 p-4 rounded mb-6 border border-green-200">
                    <h2 className="text-xl font-bold text-green-800">Script Generated Successfully!</h2>
                    <p className="text-sm text-green-700">ID: {generatedScript.id}</p>
                 </div>
                 {/* 
                     Ideally we would pass the data to FullScriptEditor 
                     But FullScriptEditor expects a different format (record string, string).
                     The API returns a JSON structure "input": [{ scriptText, ... }]
                     We might need to flatten it or just display it RAW for this MVP step.
                 */}
                  <div className="bg-white p-6 shadow rounded">
                    <h3 className="font-bold mb-4">Script Preview (JSON)</h3>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto h-96 text-xs">
                        {JSON.stringify(generatedScript, null, 2)}
                    </pre>
                  </div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Script Generation</h1>
            <p className="text-gray-600 mb-8">Generate a structured "Course Welcome" video from your syllabus files.</p>

            {step === 1 && (
                <div>
                     <h2 className="text-xl font-semibold mb-6">Step 1: Select a Template</h2>
                     <TemplateSelector onSelect={handleTemplateSelect} />
                </div>
            )}

            {step === 2 && selectedTemplate && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Metadata Form */}
                    <div className="bg-white p-6 shadow-sm rounded-lg border">
                        <h2 className="text-xl font-bold mb-6 text-indigo-700">Step 2: Technical Sheet</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                                <input name="courseName" value={formData.courseName} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="e.g. MDS608 Innovation Project" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teacher Name</label>
                                    <input name="teacherName" value={formData.teacherName} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="e.g. Francisca Contreras" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Teacher Role</label>
                                    <input name="teacherRole" value={formData.teacherRole} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="e.g. Director" />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Teacher Specialty</label>
                                <input name="teacherSpecialty" value={formData.teacherSpecialty} onChange={handleInputChange} className="w-full border rounded p-2" placeholder="e.g. Master in Education" />
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Student Profile</label>
                                <textarea name="studentProfile" value={formData.studentProfile} onChange={handleInputChange} className="w-full border rounded p-2 h-20" />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tone</label>
                                    <select name="tone" value={formData.tone} onChange={handleInputChange} className="w-full border rounded p-2 bg-white">
                                        <option>Formal</option>
                                        <option>Close / Friendly</option>
                                        <option>Inspirational</option>
                                        <option>Motivational</option>
                                        <option>Innovative</option>
                                        <option>Formal/Close</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Style</label>
                                    <select name="style" value={formData.style} onChange={handleInputChange} className="w-full border rounded p-2 bg-white">
                                        <option>Engage, Connect, Activate</option>
                                        <option>Direct & Informative</option>
                                        <option>Storytelling</option>
                                    </select>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Right: File Upload & Actions */}
                     <div className="space-y-6">
                        <div className="bg-white p-6 shadow-sm rounded-lg border">
                             <h2 className="text-xl font-bold mb-4 text-gray-800">Files</h2>
                             <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-white transition-colors">
                                <input type="file" multiple onChange={handleFileChange} accept=".pdf,.docx,.doc" className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100" />
                                <p className="text-xs text-gray-500 mt-2">Upload Syllabus (PDF) and Matrix (DOCX)</p>
                             </div>
                             {files && (
                                 <div className="mt-4 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                                     {Array.from(files).map(f => <div key={f.name}>📄 {f.name}</div>)}
                                 </div>
                             )}
                        </div>

                         <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                             <h3 className="font-bold text-indigo-900 mb-2">Ready to Generate?</h3>
                             <p className="text-sm text-indigo-700 mb-4">
                                 Selected Template: <strong>{selectedTemplate.title}</strong>
                             </p>
                             
                             {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

                             <div className="flex justify-between items-center">
                                 <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700">Change Template</button>
                                 <button 
                                    onClick={handleSubmit} 
                                    disabled={loading}
                                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 disabled:opacity-50 transition-all transform hover:scale-105"
                                 >
                                     {loading ? 'Generating Script...' : '✨ Generate Magic Script'}
                                 </button>
                             </div>
                         </div>
                     </div>
                </div>
            )}
        </div>
    );
};
