const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE_URL =
  import.meta.env.VITE_GROQ_BASE_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.1-8b-instant";

export async function getAISearchVariants(rawQuery) {
  const query = (rawQuery || "").trim();
  if (!query || !GROQ_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You normalize messy location queries for geocoding. Return strict JSON only. Never hallucinate unknown places; instead provide cleaned variants of the same user intent.",
          },
          {
            role: "user",
            content:
              `Input query: "${query}"\n\n` +
              "Return JSON in this shape:\n" +
              '{ "normalized_query": "string", "variants": ["v1","v2","v3","v4","v5","v6"] }\n' +
              "Rules:\n" +
              "- Keep place meaning same.\n" +
              "- Expand short city aliases when obvious (hyd->hyderabad).\n" +
              "- Fix likely spellings where high confidence.\n" +
              "- Try different segment ordering.\n" +
              "- Include at most 6 variants.\n" +
              "- No explanations.",
          },
        ],
      }),
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      return [];
    }
    const parsed = JSON.parse(content);
    const normalized = typeof parsed?.normalized_query === "string" ? parsed.normalized_query : "";
    const variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
    return [normalized, ...variants]
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .slice(0, 7);
  } catch {
    return [];
  }
}
