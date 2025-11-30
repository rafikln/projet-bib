const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

async function request(path, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  }

  if (options.body && typeof options.body !== "string") {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, config)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.message || "Erreur API")
    error.details = data
    error.status = response.status
    throw error
  }
  return data
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  listUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/utilisateurs${query ? `?${query}` : ""}`)
  },
  createUser: (payload) => request("/utilisateurs", { method: "POST", body: payload }),
  updateUser: (id, payload) => request(`/utilisateurs/${id}`, { method: "PUT", body: payload }),
  deleteUser: (id) => request(`/utilisateurs/${id}`, { method: "DELETE" }),

  listBooks: () => request("/livres"),
  createBook: (payload) => request("/livres", { method: "POST", body: payload }),
  updateBook: (id, payload) => request(`/livres/${id}`, { method: "PUT", body: payload }),
  deleteBook: (id) => request(`/livres/${id}`, { method: "DELETE" }),

  listLoans: () => request("/emprunts"),
  createLoan: (payload) => request("/emprunts", { method: "POST", body: payload }),
  updateLoan: (id, payload) => request(`/emprunts/${id}`, { method: "PUT", body: payload }),
  deleteLoan: (id) => request(`/emprunts/${id}`, { method: "DELETE" }),
}



