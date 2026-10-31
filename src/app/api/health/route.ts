import { NextResponse } from "next/server";
import { RESEARCH_VERSION } from "@/lib/research/analyze-market";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ok:true,version:RESEARCH_VERSION,app:"AçõesRadar"}); }
