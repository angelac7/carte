import { z } from "zod";
import { createMessage, parseJsonReply } from "@/lib/ai/client";
import { jsonReply, list, object, string } from "@/lib/ai/json-schema";

const TermsSchema = z.object({ terms: z.array(z.string()).catch([]) });
const TERMS_SCHEMA = object({ terms: list(string) });

/** Keeps only short, plain search words, so AI output can't produce odd queries. */
export function cleanTerms(terms: string[]): string[] {
  const cleaned = terms
    .map((term) => term.toLowerCase().trim())
    .filter((term) => /^[a-z][a-z -]{1,24}$/.test(term));
  return [...new Set(cleaned)].slice(0, 8);
}

/** Turns a craving like "something warm and cozy" into dish search words. */
export async function cravingToTerms(craving: string): Promise<string[]> {
  const reply = await createMessage({
    // Thinking counts toward max_tokens, so leave room beyond the short answer.
    max_tokens: 2000,
    output_config: jsonReply(TERMS_SCHEMA, "medium"),
    messages: [
      {
        role: "user",
        content: `A diner searching restaurant menus typed: ${JSON.stringify(craving)}
Turn this into 3 to 8 short English search words for dishes or ingredients that fit. For example, "something warm and cozy" might become soup, stew, ramen, broth, curry. Use lowercase single words or two-word phrases.
Return ONLY valid JSON, no other text: {"terms":[]}`,
      },
    ],
  });
  return cleanTerms(TermsSchema.parse(parseJsonReply(reply)).terms);
}
