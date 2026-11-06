
import { GoogleGenAI } from "@google/genai";

// Read both API keys from the backend environment.
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2
].filter((key) => typeof key === "string" && key.trim());

// Check whether an error is related to Gemini quota limits.
function isQuotaError(error) {
  const message = String(error?.message || "").toUpperCase();

  return (
    error?.status === 429 ||
    error?.code === 429 ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("QUOTA_EXCEEDED") ||
    message.includes("RATE_LIMIT_EXCEEDED")
  );
}

// Check whether at least one key is configured.
export function hasGeminiKeys() {
  return API_KEYS.length > 0;
}

// Send a request using the primary key and automatically
// switch to the backup key if a quota error occurs.
export async function generateWithFallback({
  model,
  contents,
  config,
  onChunk
}) {
  if (API_KEYS.length === 0) {
    throw new Error("NO_GEMINI_API_KEYS_CONFIGURED");
  }

  let lastQuotaError = null;

  for (let index = 0; index < API_KEYS.length; index++) {
    const keyNumber = index + 1;
    let receivedText = false;

    try {
      console.log(`Trying Gemini API Key ${keyNumber}`);

      const ai = new GoogleGenAI({
        apiKey: API_KEYS[index]
      });

      const stream = await ai.models.generateContentStream({
        model,
        contents,
        config
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          receivedText = true;
          onChunk(chunk.text);
        }
      }

      console.log(`Gemini API Key ${keyNumber} completed successfully`);

      return {
        success: true,
        usedKey: keyNumber
      };

    } catch (error) {

      // Switch keys only for quota-related errors.
      if (isQuotaError(error)) {
        lastQuotaError = error;

        // Once text has reached the frontend, restarting the
        // request could duplicate the response.
        if (receivedText) {
          throw error;
        }

        console.warn(
          `Gemini API Key ${keyNumber} quota exhausted.`
        );

        if (index < API_KEYS.length - 1) {
          console.log("Switching to the backup API key...");
          continue;
        }

        break;
      }

      // Authentication, permission, and other errors
      // should not be silently treated as quota errors.
      throw error;
    }
  }

  const error = new Error(
    "ALL_GEMINI_API_KEYS_QUOTA_EXHAUSTED"
  );

  error.cause = lastQuotaError;
  throw error;
}
