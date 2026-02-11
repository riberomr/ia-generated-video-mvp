import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { TemplateSelector } from "../components/SmartScripting/TemplateSelector";
import { SynthesiaTemplate } from "@eduvideogen/shared-types";
import { useNavigate } from "react-router-dom";

export const TemplateScriptingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] =
    useState<SynthesiaTemplate | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>("workspace");

  // Updated Metadata Form State based on new schema
  const [formData, setFormData] = useState({
    title: "",
    courseName: "",
    teacherName: "",
    teacherRole: "",
    teacherSpecialty: "",
    studentProfile: "University students",
    videoType: "Course Welcome",
    tone: "Formal",
    style: "Direct & Informative",
  });

  const handleTemplateSelect = (template: SynthesiaTemplate) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async () => {
    // Files are optional? User said "upload syllabus and matrix", usually implies required.
    // But let's allow generation with just text inputs if files not present?
    // Logic in backend iterates files. If no files, it might fail or produce empty content.
    // Let's require files for now as per previous logic.
    if (!files || files.length === 0) {
      toast.error(t("toast.upload_file"));
      return;
    }

    setLoading(true);
    setError(null);

    const apiFormData = new FormData();
    Array.from(files).forEach((file) => {
      apiFormData.append("files", file);
    });

    // Append all metadata
    Object.entries(formData).forEach(([key, value]) => {
      // Exclude title as it's handled explicitly below
      if (key !== "title") {
        apiFormData.append(key, value);
      }
    });

    if (selectedTemplate) {
      apiFormData.append("templateId", selectedTemplate.id);
    }
    apiFormData.append(
      "title",
      formData.title || formData.courseName || "Untitled Course Video",
    );

    try {
      // Updated endpoint: POST /ai-scripts/generate-from-files
      const res = await fetch(
        `${import.meta.env.VITE_APP_BASE_URL}/ai-scripts/generate-from-files`,
        {
          method: "POST",
          body: apiFormData,
        },
      );

      if (!res.ok) throw new Error("Failed to create script");

      const data = await res.json();

      toast.success(t("toast.script_created"));
      navigate(`/editor/${data.id}`);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || t("toast.error_generating_script");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header con título y selector */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-3">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("template_scripting.page_title")}
        </h1>

        {/* Selector de fuente de templates */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            {t("template_selector.filter_label")}
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2 bg-white min-w-[180px]"
          >
            <option value="workspace">
              {t("template_selector.workspace")}
            </option>
            <option value="synthesia">
              {t("template_selector.synthesia_examples")}
            </option>
            <option value="">{t("template_selector.all")}</option>
          </select>
        </div>
      </div>

      <p className="text-gray-600 mb-8">
        {t("template_scripting.page_subtitle")}
      </p>

      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6">
            {t("template_scripting.step1_title")}
          </h2>
          <TemplateSelector source={source} onSelect={handleTemplateSelect} />
        </div>
      )}

      {step === 2 && selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Metadata Form */}
          <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-indigo-700">
                {t("template_scripting.step2_title")}
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                {t("template_scripting.change_template")}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("template_scripting.script_title")}
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={t("template_scripting.script_title_placeholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("template_scripting.video_type")}
                  </label>
                  <input
                    name="videoType"
                    value={formData.videoType}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder={t("template_scripting.video_type_placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("template_scripting.course_name")}
                  </label>
                  <input
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={t(
                      "template_scripting.course_name_placeholder",
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("template_scripting.teacher_name")}
                  </label>
                  <input
                    name="teacherName"
                    value={formData.teacherName}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder={t(
                      "template_scripting.teacher_name_placeholder",
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("template_scripting.teacher_role")}
                  </label>
                  <input
                    name="teacherRole"
                    value={formData.teacherRole}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder={t(
                      "template_scripting.teacher_role_placeholder",
                    )}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("template_scripting.teacher_specialty")}
                </label>
                <input
                  name="teacherSpecialty"
                  value={formData.teacherSpecialty}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2"
                  placeholder={t(
                    "template_scripting.teacher_specialty_placeholder",
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("template_scripting.student_profile")}
                </label>
                <textarea
                  name="studentProfile"
                  value={formData.studentProfile}
                  onChange={handleInputChange}
                  className="w-full border rounded p-2 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("template_scripting.tone")}
                  </label>
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white"
                  >
                    <option>{t("template_scripting.tone_formal")}</option>
                    <option>{t("template_scripting.tone_close")}</option>
                    <option>
                      {t("template_scripting.tone_inspirational")}
                    </option>
                    <option>{t("template_scripting.tone_motivational")}</option>
                    <option>{t("template_scripting.tone_innovative")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("template_scripting.style")}
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white"
                  >
                    <option>{t("template_scripting.style_engage")}</option>
                    <option>{t("template_scripting.style_direct")}</option>
                    <option>
                      {t("template_scripting.style_storytelling")}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right: File Upload & Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {t("template_scripting.knowledge_base")}
              </h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-white transition-colors cursor-pointer relative">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-1 text-sm text-gray-600">
                    {t("template_scripting.upload_prompt")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {t("template_scripting.upload_hint")}
                  </p>
                </div>
              </div>
              {files && (
                <div className="mt-4 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                  <p className="font-semibold mb-1">
                    {t("template_scripting.selected_files")}
                  </p>
                  <ul className="list-disc pl-5">
                    {Array.from(files).map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-2">
                {t("template_scripting.summary")}
              </h3>
              <p className="text-sm text-indigo-700 mb-4">
                {t("template_scripting.template")}{" "}
                <strong>{selectedTemplate.title}</strong>
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4 border border-red-200">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded shadow hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed transition-all flex justify-center items-center"
              >
                {loading ? (
                  <span>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("loading.generating_script")}
                  </span>
                ) : (
                  t("template_scripting.create_script")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
