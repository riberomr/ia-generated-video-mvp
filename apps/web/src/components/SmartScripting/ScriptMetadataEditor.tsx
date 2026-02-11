
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
  const fields: {
    key: keyof ScriptMetadata;
    label: string;
    type?: "text" | "textarea" | "select";
    options?: string[];
  }[] = [
    { key: "title", label: "Script Title" },
    { key: "courseName", label: "Course Name" },
    { key: "videoType", label: "Video Type", type: "text" },
    { key: "teacherName", label: "Teacher Name" },
    { key: "teacherRole", label: "Teacher Role" },
    { key: "teacherSpecialty", label: "Teacher Specialty" },
    { key: "studentProfile", label: "Student Profile", type: "textarea" },
    {
      key: "tone",
      label: "Tone",
      type: "select",
      options: [
        "Formal",
        "Close / Friendly",
        "Inspirational",
        "Motivational",
        "Innovative",
      ],
    },
    {
      key: "style",
      label: "Style",
      type: "select",
      options: [
        "Engage, Connect, Activate",
        "Direct & Informative",
        "Storytelling",
      ],
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
        Metadata
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
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
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
