import { BASE_URL } from "./constants";

export const api = {
  async request(method, path = "", body = null) {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body !== null) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const json = await response.json();

    if (!response.ok || !json.success) {
      const message =
        typeof json.data === "object" && json.data !== null
          ? Object.values(json.data).join(", ")
          : json.message || "Request failed";
      throw new Error(message);
    }

    return json.data;
  },
  getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.subject) params.set("subject", filters.subject);
    if (filters.search) params.set("search", filters.search);
    const query = params.toString();
    return this.request("GET", query ? `?${query}` : "");
  },
  getStats() {
    return this.request("GET", "/stats");
  },
  create(body) {
    return this.request("POST", "", body);
  },
  update(id, body) {
    return this.request("PUT", `/${id}`, body);
  },
  remove(id) {
    return this.request("DELETE", `/${id}`);
  },
};
