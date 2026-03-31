
/// <reference types="vite/client" />
/**
 * Helper to fetch with retry logic
 */
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            // If not OK, we might want to retry depending on status, but for now we retry any non-OK
        } catch (e) {
            if (i === retries - 1) throw e;
        }
        // Small delay between retries
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return fetch(url, options);
};

/**
 * Builds the OpenAI-compatible request body
 */
const buildRequestBody = (systemPrompt: string, userMessage: string, isJSON: boolean, model: string) => {
    return {
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        ...(isJSON ? { response_format: { type: 'json_object' } } : {})
    };
};

/**
 * Calls an OpenAI-compatible API (like Ollama)
 */
export async function callAI(
    apiKey: string | null,
    systemPrompt: string,
    userMessage: string,
    isJSON = false,
    modelOverride: string | null = null
): Promise<string> {
    const baseUrl = import.meta.env.VITE_MODAL_BASE_URL || 'http://localhost:11434/v1/';
    const model = modelOverride || import.meta.env.VITE_MODAL_MODEL || 'nemotron-3-super:cloud';
    const url = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}chat/completions`;

    const body = buildRequestBody(systemPrompt, userMessage, isJSON, model);

    const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey && apiKey !== 'ollama' ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`OpenAI-compatible API Error: ${res.status}`);
    const data = await res.json();
    const rawResponse = data?.choices?.[0]?.message?.content || '';

    return rawResponse;
}
