import { getLlmStatus } from "@/lib/llm-config";

export async function GET() {
  return Response.json(getLlmStatus());
}
