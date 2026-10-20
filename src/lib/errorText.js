// Error payloads do not always arrive as text. The platform and X1 both send
// structured errors — { code, message } — and an object dropped straight into JSX
// crashes the render with "Objects are not valid as a React child".
// Everything that reaches a text node goes through here first.
export const errorText = (error, fallback = "") => {
  if (error === null || error === undefined || error === false) return "";
  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean") return String(error);
  if (typeof error === "object") {
    if (typeof error.message === "string" && error.message) {
      return error.code ? `${error.message} (${error.code})` : error.message;
    }
    try {
      const text = JSON.stringify(error);
      return text && text !== "{}" ? text : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback || String(error);
};

export default errorText;