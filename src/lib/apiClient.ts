"use client";

import { clearToken, getToken } from "@/lib/auth";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

export type ApiErrorDetails = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetails;

  constructor(message: string, status: number, details?: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const shouldAttachAuth = options.auth !== false;
  const token = shouldAttachAuth ? getToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const rawText = await response.text();
  const parsed = rawText && isJson ? safeJsonParse(rawText) : null;

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      clearToken();
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    const { message, details } = extractError(parsed, rawText);
    throw new ApiError(message, response.status, details);
  }

  if (!rawText) {
    return {} as T;
  }

  if (isJson) {
    return safeJsonParse(rawText) as T;
  }

  return rawText as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractError(parsed: unknown, fallbackText: string) {
  let message = fallbackText || "Request failed";
  let details: ApiErrorDetails | undefined;

  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    const errorRecord = (record.error as Record<string, unknown>) || record;

    const candidateMessage =
      (errorRecord.message as string) ||
      (record.message as string) ||
      (record.title as string);

    if (candidateMessage) {
      message = candidateMessage;
    }

    const candidateDetails =
      (errorRecord.details as ApiErrorDetails) ||
      (record.errors as ApiErrorDetails);

    if (candidateDetails && typeof candidateDetails === "object") {
      details = candidateDetails;
    }
  }

  return { message, details };
}
