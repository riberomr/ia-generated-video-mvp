import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';
import { ScriptGenerator } from './components/ScriptGenerator';
import { SavedScripts } from './components/SavedScripts';

function App() {
    const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100">
                <nav className="bg-white shadow-sm border-b">
                    <div className="max-w-4xl mx-auto px-6 h-16 flex items-center space-x-8">
                        <button
                            onClick={() => setActiveTab('generate')}
                            className={`h-full border-b-2 px-2 font-medium ${activeTab === 'generate'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Generate Script
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`h-full border-b-2 px-2 font-medium ${activeTab === 'saved'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Saved Scripts
                        </button>
                    </div>
                </nav>

                <main className="py-6">
                    {activeTab === 'generate' ? <ScriptGenerator /> : <SavedScripts />}
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
