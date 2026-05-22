import { getLlmConfig } from "@/lib/gemma";

export async function GET() {
  const { mockMode, provider, model } = getLlmConfig();
  return Response.json({ mockMode, provider, model });
}
