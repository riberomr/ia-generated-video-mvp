import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
// import { ScriptGenerator } from './components/ScriptGenerator';
import { SavedScripts } from './components/SavedScripts';
import { ScriptEditor } from './components/ScriptEditor';
import { SmartScriptingPage } from './pages/SmartScriptingPage';

function NavBar() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700';
    };

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-6 h-16 flex items-center space-x-8">
                {/* <Link
                    to="/"
                    className={`h-full flex items-center border-b-2 px-2 font-medium ${isActive('/')}`}
                >
                    Generate Script
                </Link> */}
                <Link
                    to="/"
                    className={`h-full flex items-center border-b-2 px-2 font-medium ${isActive('/')}`}
                >
                    Template based Scripting
                </Link>
                <Link
                    to="/saved"
                    className={`h-full flex items-center border-b-2 px-2 font-medium ${isActive('/saved')}`}
                >
                    Saved Scripts
                </Link>

            </div>
        </nav>
    );
}

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-100">
                <NavBar />
                <main className="py-6">
                    <Routes>
                        <Route path="/" element={<SmartScriptingPage />} />
                        <Route path="/saved" element={<SavedScripts />} />
                        <Route path="/editor/:id" element={<ScriptEditor />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
