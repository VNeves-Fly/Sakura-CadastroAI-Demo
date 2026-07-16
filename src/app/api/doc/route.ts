import { NextResponse } from "next/server";
import { getApiDocSpec } from "@/modules/shared/infrastructure/swagger/swagger-spec";

export async function GET() {
  return NextResponse.json(getApiDocSpec());
}
