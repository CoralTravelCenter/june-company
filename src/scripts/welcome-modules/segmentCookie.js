const COOKIE_NAME = "june_26_segment";
const SEGMENTS = new Set(["solo", "family", "couple"]);

function getCookiesApi() {
  return window.Cookies && typeof window.Cookies.get === "function" && typeof window.Cookies.set === "function"
    ? window.Cookies
    : null;
}

export function setSegmentCookie(segment) {
  if (!SEGMENTS.has(segment)) return;

  const cookies = getCookiesApi();
  if (!cookies) return;
  if (cookies.get(COOKIE_NAME)) return;

  cookies.set(COOKIE_NAME, segment);
}
