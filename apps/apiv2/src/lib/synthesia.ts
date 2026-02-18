const BASE_URL = "https://api.synthesia.io/v2";

async function fetchFromSynthesia(endpoint: string, options: RequestInit = {}): Promise<any> {
  const apiKey = process.env.SYNTHESIA_API_KEY;
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `${apiKey}`,
      Accept: "application/json",
      ...(options.method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Synthesia API returned invalid format: ${res.status} ${res.statusText}`);
  }

  if (!res.ok) {
    throw new Error(`Synthesia API error: ${data.message || res.statusText}`);
  }

  return data;
}

export async function listTemplates(source?: string) {
  const queryParams = source ? `?source=${source}` : "";
  const response = await fetchFromSynthesia(`/templates${queryParams}`);
  return response.templates || response || [];
}

export async function getTemplate(id: string) {
  return fetchFromSynthesia(`/templates/${id}`);
}

export async function createVideoFromTemplate(payload: {
  test: boolean;
  title: string;
  description: string;
  templateId: string;
  templateData: Record<string, any>;
}) {
  return fetchFromSynthesia("/videos/fromTemplate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getVideoStatus(externalId: string) {
  return fetchFromSynthesia(`/videos/${externalId}`);
}
