import { isMockMode } from "@/lib/gemma";

export async function GET() {
  return Response.json({ mockMode: isMockMode() });
}
