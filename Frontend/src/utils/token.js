export const setToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");
export const removeToken = () => localStorage.removeItem("token");
// utils/token.js
export function getUsername() {
  const token = getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    return decodedPayload.sub;
  } catch (error) {
    console.error("Failed to decode token", error);
    return null;
  }
}
