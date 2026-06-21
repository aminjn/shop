/** Curated list of models available through GapGPT (OpenAI-compatible).
 *  The admin can also type a custom model name. */
export const AI_MODELS: { group: string; models: string[] }[] = [
  {
    group: "OpenAI (GPT)",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "o3",
      "o4-mini",
      "gpt-5",
      "gpt-5-mini",
      "gpt-3.5-turbo",
    ],
  },
  {
    group: "Anthropic (Claude)",
    models: [
      "claude-3-5-haiku",
      "claude-3-5-sonnet",
      "claude-3-7-sonnet",
      "claude-sonnet-4",
      "claude-opus-4",
    ],
  },
  {
    group: "Google (Gemini)",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
  },
];

export const AI_MODELS_FLAT = AI_MODELS.flatMap((g) => g.models);
