type SessionUser = {
  id: string;
  name: string;
  email: string;
  company?: string;
};

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=604800; samesite=lax`;
}

// Store the auth session in both local storage and cookies so the browser and server can read it.
export function persistSession(token: string, user: SessionUser) {
  window.localStorage.setItem("crm_token", token);
  window.localStorage.setItem("crm_user", JSON.stringify(user)); //Store login data in browser.
  writeCookie("crm_token", token); //Cookies can help with protected routes/server access.
  writeCookie("crm_user", JSON.stringify(user));
}//After successful login, the JWT token and user information are stored in localStorage and cookies to maintain authenticated sessions.

export function clearSession() {
  window.localStorage.removeItem("crm_token");
  window.localStorage.removeItem("crm_user"); //Clear session data from localStorage to log out the user.
  document.cookie = "crm_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "crm_user=; path=/; max-age=0; samesite=lax";
}