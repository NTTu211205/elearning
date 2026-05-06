import type { Role } from "@/types/user";

type JwtPayload = {
  role?: Role;
};

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
};

export const getRoleFromAccessToken = (accessToken?: string | null): Role | null => {
  if (!accessToken) {
    return null;
  }

  try {
    const [, payload] = accessToken.split(".");
    if (!payload) {
      return null;
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payload)) as JwtPayload;
    return parsedPayload.role ?? null;
  } catch {
    return null;
  }
};

export const getDefaultPathByRole = (role?: Role | null) => {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    default:
      return "/signin";
  }
};
