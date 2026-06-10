const BASE_URL = "http://localhost:5000/api";

// Helper to handle standard JSON requests and inject the JWT token automatically
async function request(endpoint: string, options: RequestInit = {}) {
  // Grab the live token that we'll store during login
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Named API exports matching our backend controller actions
export const api = {
  auth: {
    register: (data: any) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: any) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  },
  tickets: {
    create: (data: { title: string; description: string }) => 
      request("/tickets", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => request("/tickets", { method: "GET" }),
    update: (id: string, data: any) => 
      request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  comments: {
    add: (ticketId: string, content: string) => 
      request(`/tickets/${ticketId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  },
};