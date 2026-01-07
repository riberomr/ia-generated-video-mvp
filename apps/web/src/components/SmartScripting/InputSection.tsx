interface Props {
    topic: string;
    setTopic: (v: string) => void;
    sourceText: string;
    setSourceText: (v: string) => void;
    onNext: () => void;
    isLoading: boolean;
    onBack: () => void;
}

export function InputSection({ topic, setTopic, sourceText, setSourceText, onNext, isLoading, onBack }: Props) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video Topic</label>
                <input
                    type="text"
                    className="w-full border rounded-md p-2"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Quarterly Sales Report"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Source Text (Article, Notes)</label>
                <textarea
                    className="w-full border rounded-md p-2 h-64"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Paste your content here..."
                />
            </div>
            <div className="flex justify-between">
                <button onClick={onBack} disabled={isLoading} className="px-4 py-2 text-gray-600 hover:text-gray-900">Back</button>
                <button
                    onClick={onNext}
                    disabled={isLoading || !topic || !sourceText}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? 'Analyzing...' : 'Generate Script'}
                </button>
            </div>
        </div>
    );
}
