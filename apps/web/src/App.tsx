import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { SavedScripts } from "./components/SavedScripts";
import { TemplateScriptingPage } from "./pages/TemplateScriptingPage";
import { ScriptEditor } from "./components/ScriptEditor";
import { SettingsProvider, useSettings } from "./context/SettingsContext";

function NavBar() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { aiProvider, setAiProvider } = useSettings();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  const isActive = (path: string) => {
    return location.pathname === path
      ? "border-indigo-600 text-indigo-600"
      : "border-transparent text-gray-500 hover:text-gray-700";
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="font-bold text-xl text-indigo-600">
                {t('nav.app_title')}
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive("/")}`}
              >
                {t('nav.saved_scripts')}
              </Link>
              <Link
                to="/template-scripting"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive("/template-scripting")}`}
              >
              {t('nav.new_script')}
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* AI Provider Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 hidden sm:inline">AI Model:</span>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as 'groq' | 'bedrock')}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-1 pl-2 pr-8 bg-gray-50"
              >
                <option value="groq">Groq (Llama 3)</option>
                <option value="bedrock">Bedrock (Claude 3.5)</option>
              </select>
            </div>

            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-indigo-600 border border-gray-300 rounded-md hover:border-indigo-600 transition-colors"
              title={t("actions.change_language")}
            >
              {i18n.language === 'en' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: "#dcfce7",
                color: "#166534",
                border: "1px solid #86efac",
              },
              iconTheme: {
                primary: "#166534",
                secondary: "#dcfce7",
              },
            },
            error: {
              style: {
                background: "#fee2e2",
                color: "#991b1b",
                border: "1px solid #fca5a5",
              },
              iconTheme: {
                primary: "#991b1b",
                secondary: "#fee2e2",
              },
            },
          }}
        />
        <div className="min-h-screen bg-gray-50">
          <NavBar />

          <main className="py-10">
            <Routes>
              <Route path="/" element={<SavedScripts />} />
              <Route
                path="/template-scripting"
                element={<TemplateScriptingPage />}
              />
              <Route path="/editor/:id" element={<ScriptEditor />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
