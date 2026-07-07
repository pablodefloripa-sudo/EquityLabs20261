const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const getBasePath = () => {
  const rawBase = import.meta.env.BASE_URL || "/";
  return rawBase === "/" ? "/" : `${trimTrailingSlash(rawBase)}/`;
};

const getBaseOrigin = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  const configuredOrigin = import.meta.env.VITE_AUTH_REDIRECT_ORIGIN?.trim();
  return configuredOrigin ? trimTrailingSlash(configuredOrigin) : "http://localhost:8080";
};

export const buildAppUrl = (path: string) => {
  const baseOrigin = getBaseOrigin();
  const basePath = getBasePath();
  const normalizedPath = ensureLeadingSlash(path).replace(/^\//, "");

  return new URL(normalizedPath, `${baseOrigin}${basePath}`).toString();
};

export const buildAuthRedirectUrl = (path: string) => buildAppUrl(path);
