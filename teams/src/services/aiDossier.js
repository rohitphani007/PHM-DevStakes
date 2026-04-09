const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE_URL =
  import.meta.env.VITE_GROQ_BASE_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "llama-3.1-8b-instant";

function splitIntoSentences(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function computeSeed(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function pickBySeed(options, seed, offset = 0) {
  if (!options.length) {
    return "";
  }
  return options[(seed + offset) % options.length];
}

function buildFactPack(summary, title) {
  const sentences = splitIntoSentences(summary);
  if (sentences.length === 0) {
    return { lead: "", facts: [], tail: "" };
  }

  const seed = computeSeed(`${title}|${summary}`);
  const lead = pickBySeed(sentences, seed);
  const tail = pickBySeed(sentences, seed, 2);
  const facts = sentences.filter((line) => line !== lead && line !== tail).slice(0, 3);

  return { lead, facts, tail };
}

function localRewrite(summary, title, mode) {
  if (!summary) {
    return "Insufficient archive material for narrative conversion.";
  }

  const seed = computeSeed(`${title}|${summary}|${mode}`);
  const { lead, facts, tail } = buildFactPack(summary, title);

  const dossierLabels = ["Archive", "Case", "Intel", "Field", "Chronicle"];
  const dossierStatus = ["Declassified", "Restricted", "Historical Recovery", "Cold Archive"];
  const dossierOpeners = [
    "Primary source confirms the following sequence:",
    "Recovered records indicate the following verified details:",
    "Analyst digest from local archives:",
  ];
  const storyOpeners = [
    "People here still retell this as if it happened yesterday:",
    "On quiet nights, locals repeat one version of this place:",
    "Travelers hear this version first, before the official plaque:",
  ];
  const storyClosers = [
    "Every retelling changes the tone, but the facts stay put.",
    "The mood may be folklore, but the record behind it is real.",
    "The story sounds haunted, yet it follows the documented history.",
  ];

  if (mode === "classified") {
    const header = `${pickBySeed(dossierLabels, seed)} File: ${title.toUpperCase()}`;
    const status = `Status: ${pickBySeed(dossierStatus, seed, 1)}`;
    const bodyLines = [lead, ...facts, tail].filter(Boolean).slice(0, 4);
    return `${header}\n${status}\n\n${pickBySeed(dossierOpeners, seed, 2)}\n- ${bodyLines.join("\n- ")}\n\nAnalyst note: Narrative styling applied. Facts remain source-bound.`;
  }

  const storyLines = [lead, ...facts, tail].filter(Boolean).slice(0, 3).join(" ");
  return `${pickBySeed(storyOpeners, seed, 3)}\n\n${storyLines}\n\n${pickBySeed(storyClosers, seed, 4)}`;
}

function chooseAdaptiveTone(title, summary) {
  const source = `${title} ${summary}`.toLowerCase();
  if (/(university|college|school|academy|student|library|institute)/i.test(source)) {
    return "student-friendly";
  }
  if (/(garden|park|lake|palace|love|queen|king|poet|bridge)/i.test(source)) {
    return "romantic";
  }
  if (/(war|fort|battle|siege|revolt|empire|colonial|military)/i.test(source)) {
    return "dramatic";
  }
  if (/(temple|church|mosque|shrine|monastery|ancient|ruins)/i.test(source)) {
    return "reverent";
  }
  return "cinematic";
}

export async function rewriteLoreWithAI({ title, summary, mode }) {
  if (!mode || mode === "off") {
    return summary;
  }

  if (!GROQ_API_KEY) {
    return "AI narrative is disabled. Add VITE_GROQ_API_KEY in your .env to generate unique factual stories.";
  }

  const adaptiveTone = chooseAdaptiveTone(title, summary);
  const styleInstruction =
    mode === "classified"
      ? "Rewrite as a concise top-secret government dossier with cinematic tone."
      : `Rewrite as a ${adaptiveTone} story. It must feel human, clear, and emotionally engaging for general audiences.`;

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are a fact-preserving narrative rewriter. Use ONLY the provided text. Never invent facts, places, dates, people, causes, timelines, or claims. If information is missing, omit it. Keep output under 130 words. Keep every script unique in phrasing and cadence.",
          },
          {
            role: "user",
            content:
              `${styleInstruction}\n\n` +
              `Title: ${title}\n` +
              `Source facts: ${summary}\n\n` +
              "Constraints:\n" +
              "- Keep all factual details faithful to source.\n" +
              "- Do not repeat stock lines or generic endings.\n" +
              "- Mention the place title naturally.\n" +
              "- Write one compact paragraph only.",
          },
        ],
      }),
    });

    if (!response.ok) {
      let detail = "";
      try {
        const errorPayload = await response.json();
        detail = errorPayload?.error?.message || "";
      } catch {
        detail = "";
      }

      if (response.status === 429) {
        return "AI rewrite failed: quota/rate-limit reached (429). Check Groq usage limits, then try again.";
      }
      if (response.status === 401) {
        return "AI rewrite failed: invalid API key (401). Verify VITE_GROQ_API_KEY and restart dev server.";
      }
      return `AI rewrite failed (${response.status}). ${detail}`.trim();
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();
    return text || `AI rewrite returned empty text for ${title}.`;
  } catch {
    return "AI rewrite failed due to a network/config issue. Please verify API access.";
  }
}
