import { useTranslation } from "react-i18next";

export interface ScriptMetadata {
  title: string;
  courseName: string;
  teacherName: string;
  teacherRole: string;
  teacherSpecialty: string;
  studentProfile: string;
  videoType: string;
  tone: string;
  style: string;
}

interface Props {
  metadata: ScriptMetadata;
  onChange: (key: keyof ScriptMetadata, value: string) => void;
}

export function ScriptMetadataEditor({ metadata, onChange }: Props) {
  const { t } = useTranslation();

  const fields: {
    key: keyof ScriptMetadata;
    label: string;
    type?: "text" | "textarea" | "select";
    options?: { label: string; value: string }[];
  }[] = [
    { key: "title", label: t("template_scripting.script_title") },
    { key: "courseName", label: t("template_scripting.course_name") },
    {
      key: "videoType",
      label: t("template_scripting.video_type"),
      type: "text",
    },
    { key: "teacherName", label: t("template_scripting.teacher_name") },
    { key: "teacherRole", label: t("template_scripting.teacher_role") },
    {
      key: "teacherSpecialty",
      label: t("template_scripting.teacher_specialty"),
    },
    {
      key: "studentProfile",
      label: t("template_scripting.student_profile"),
      type: "textarea",
    },
    {
      key: "tone",
      label: t("template_scripting.tone"),
      type: "select",
      options: [
        { label: t("template_scripting.tone_formal"), value: "Formal" },
        {
          label: t("template_scripting.tone_close"),
          value: "Close / Friendly",
        },
        {
          label: t("template_scripting.tone_inspirational"),
          value: "Inspirational",
        },
        {
          label: t("template_scripting.tone_motivational"),
          value: "Motivational",
        },
        {
          label: t("template_scripting.tone_innovative"),
          value: "Innovative",
        },
      ],
    },
    {
      key: "style",
      label: t("template_scripting.style"),
      type: "select",
      options: [
        {
          label: t("template_scripting.style_engage"),
          value: "Engage, Connect, Activate",
        },
        {
          label: t("template_scripting.style_direct"),
          value: "Direct & Informative",
        },
        {
          label: t("template_scripting.style_storytelling"),
          value: "Storytelling",
        },
      ],
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
        {t("metadata.title")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.key}
            className={field.type === "textarea" ? "md:col-span-2" : ""}
          >
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              {field.label}
            </label>
            {field.type === "select" ? (
              <select
                value={metadata[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t("metadata.select_placeholder")}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                value={metadata[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-20"
              />
            ) : (
              <input
                type="text"
                value={metadata[field.key] || ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
