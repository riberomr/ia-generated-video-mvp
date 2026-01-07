import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SynthesiaTemplate, AnalyzeScriptDto, SmartScriptResponse, CreateScriptDto } from '@eduvideogen/shared-types';
import { TemplateSelector } from '../components/SmartScripting/TemplateSelector';
import { InputSection } from '../components/SmartScripting/InputSection';
import { ScriptEditor } from '../components/SmartScripting/ScriptEditor';
import { VisualsEditor } from '../components/SmartScripting/VisualsEditor';

export function SmartScriptingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<number>(1);
    const [selectedTemplate, setSelectedTemplate] = useState<SynthesiaTemplate | null>(null);
    const [topic, setTopic] = useState('');
    const [sourceText, setSourceText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [smartScript, setSmartScript] = useState<SmartScriptResponse | null>(null);

    const handleAnalyze = async () => {
        if (!selectedTemplate || !topic || !sourceText) return;

        setIsAnalyzing(true);
        try {
            const dto: AnalyzeScriptDto = {
                templateId: selectedTemplate.id,
                topic,
                sourceText
            };

            const response = await fetch(`http://localhost:3000/scripts/analyze-and-map`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });

            if (!response.ok) throw new Error('Analysis failed');

            const data: SmartScriptResponse = await response.json();
            setSmartScript(data);
            setStep(3); // Editor Step
        } catch (error) {
            console.error(error);
            alert('Failed to analyze script');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = async (updatedVisuals: Record<string, string>) => {
        if (!selectedTemplate) return;

        try {
            // 1. Reconstruct scenes array from template_data (Source of Truth)
            const sceneKeys = Object.keys(updatedVisuals)
                .filter(key => key.startsWith('scene_voice_text_'))
                .sort((a, b) => {
                    const numA = parseInt(a.replace('scene_voice_text_', ''), 10);
                    const numB = parseInt(b.replace('scene_voice_text_', ''), 10);
                    return numA - numB;
                });

            const scenes = sceneKeys.map(key => updatedVisuals[key]);

            // 2. Create a Generic Course first to house this script
            // Use the topic + content from the input section
            const courseDto: any = {
                topic: topic || "Untitled Smart Script",
                content: sourceText || "Smart Script Content"
            };

            const courseRes = await fetch('http://localhost:3000/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseDto)
            });

            if (!courseRes.ok) throw new Error('Failed to create course context');
            const course = await courseRes.json();


            // 3. Create the Script attached to this new Course
            const dto: CreateScriptDto = {
                courseId: course.id,
                isTemplated: true,
                templateId: selectedTemplate.id,
                templateData: updatedVisuals,
                scenes: scenes // Extracted from template_data keys
            };

            const response = await fetch('http://localhost:3000/scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });

            if (!response.ok) throw new Error('Failed to save script');

            alert('Script saved successfully!');
            navigate('/saved');
        } catch (error) {
            console.error(error);
            alert('Error saving script');
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-8">Template Scripting</h1>

            {/* Stepper Status */}
            <div className="flex mb-8 space-x-4">
                <div className={`px-4 py-2 rounded ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1. Select Template</div>
                <div className={`px-4 py-2 rounded ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2. Input Content</div>
                <div className={`px-4 py-2 rounded ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3. Edit & Finalize</div>
            </div>

            {step === 1 && (
                <TemplateSelector
                    onSelect={(t) => { setSelectedTemplate(t); setStep(2); }}
                />
            )}

            {step === 2 && (
                <InputSection
                    topic={topic}
                    setTopic={setTopic}
                    sourceText={sourceText}
                    setSourceText={setSourceText}
                    onNext={handleAnalyze}
                    isLoading={isAnalyzing}
                    onBack={() => setStep(1)}
                />
            )}

            {step === 3 && smartScript && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Visual Variables</h2>
                        <VisualsEditor
                            data={smartScript.template_data}
                            onChange={(newData) => setSmartScript({ ...smartScript, template_data: newData })}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-4">Voice Script</h2>
                        <ScriptEditor
                            data={smartScript.template_data}
                            onChange={(newData) => setSmartScript({ ...smartScript, template_data: newData })}
                        />
                    </div>
                    <div className="col-span-full mt-4 flex justify-end space-x-4">
                        <button onClick={() => setStep(2)} className="px-6 py-2 border rounded hover:bg-gray-50">Back</button>
                        <button onClick={() => handleSave(smartScript.template_data)} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Script</button>
                    </div>
                </div>
            )}
        </div>
    );
}
