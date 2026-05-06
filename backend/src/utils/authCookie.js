const REFRESH_COOKIE_NAME = "refreshToken";

const getRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
};

module.exports = { REFRESH_COOKIE_NAME, getRefreshCookieOptions };
