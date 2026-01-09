const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
}

export type JwtClaims = {
  role?: string | string[];
  roles?: string[];
  [key: string]: unknown;
};

export function getTokenClaims(token: string | null): JwtClaims | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1];
    const decoded = atob(base64UrlToBase64(payload));
    return JSON.parse(decoded) as JwtClaims;
  } catch {
    return null;
  }
}

export function hasAdminRole(token: string | null) {
  const claims = getTokenClaims(token);
  if (!claims) {
    return false;
  }
  const roles = extractRoles(claims);
  return roles.some((role) => role.toLowerCase() === "admin");
}

function extractRoles(claims: JwtClaims) {
  const result: string[] = [];
  const claimRole = claims.role;
  const claimRoles = claims.roles;
  const schemaRole =
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  for (const value of [claimRole, claimRoles, schemaRole]) {
    if (!value) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === "string") {
          result.push(item);
        }
      });
    } else if (typeof value === "string") {
      result.push(value);
    }
  }

  return result;
}

function base64UrlToBase64(value: string) {
  let base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }
  return base64;
}
