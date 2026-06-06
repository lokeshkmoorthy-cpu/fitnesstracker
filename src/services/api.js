const API = import.meta.env.VITE_API_URL || "";
let authToken = "";
const setAuthToken = (token) => {
  authToken = token;
};
async function fetchJson(url, init) {
  const headers = new Headers(init?.headers);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  const response = await fetch(`${API}${url}`, { ...init, headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response.json();
}
const fitnessApi = {
  signup: (payload) => fetchJson("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  login: (payload) => fetchJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  logout: () => fetchJson("/api/auth/logout", {
    method: "POST"
  }),
  me: () => fetchJson("/api/auth/me"),
  getAdminUsers: () => fetchJson("/api/admin/users"),
  updateAdminUser: (userId, payload) => fetchJson(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  getWorkouts: () => fetchJson("/api/workouts"),
  getDailyActivity: (params) => {
    const query = new URLSearchParams();
    if (params.user) query.set("user", params.user);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return fetchJson(`/api/activity/daily?${query.toString()}`);
  },
  getAttendance: (params) => {
    const query = new URLSearchParams();
    if (params.user) query.set("user", params.user);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    return fetchJson(`/api/attendance?${query.toString()}`);
  },
  getGoals: (user) => fetchJson(`/api/goals?user=${encodeURIComponent(user)}`),
  createGoal: (payload) => fetchJson("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  updateGoal: (goalId, payload) => fetchJson(`/api/goals/${encodeURIComponent(goalId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }),
  deleteGoal: (goalId) => fetchJson(`/api/goals/${encodeURIComponent(goalId)}`, {
    method: "DELETE"
  }),
  getStreaks: (user) => fetchJson(`/api/streaks?user=${encodeURIComponent(user)}`),
  getMotivationQuotes: () => fetchJson("/api/motivation-quotes"),
  getBotCommands: () => fetchJson("/api/bot-commands"),
  updateBotCommand: (command, response) => fetchJson(`/api/bot-commands/${encodeURIComponent(command)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response })
  })
};
export {
  fitnessApi,
  setAuthToken
};
