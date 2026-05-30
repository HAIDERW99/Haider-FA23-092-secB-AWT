export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
