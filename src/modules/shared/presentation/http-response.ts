import { NextResponse } from "next/server";

export function httpOk<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function httpCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function httpError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
