// Mock Supabase client translating queries to FastAPI + MongoDB backend with WebSocket support
import { API_BASE, WS_DB_EVENTS } from "@/config";
const WS_BASE = WS_DB_EVENTS;

const getToken = () => localStorage.getItem("agri_token") || localStorage.getItem("access_token");

const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

const notifyDatabaseChange = (table: string, eventType: string, data?: any) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("supabase_db_change", { detail: { table, eventType, data } })
    );
  }
};

// WebSocket Client for Real-Time Event Synchronization
class RealtimeWebSocketClient {
  ws: WebSocket | null = null;
  reconnectTimeout: any = null;
  pingInterval: any = null;
  retryDelay: number = 3000;

  connect() {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      this.ws = new WebSocket(WS_BASE);

      this.ws.onopen = () => {
        this.retryDelay = 3000; // Reset backoff upon successful connection
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            try {
              this.ws.send(JSON.stringify({ type: "ping" }));
            } catch (e) {}
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.table) {
            notifyDatabaseChange(payload.table, payload.event || "UPDATE", payload.data);
          }
        } catch (e) {}
      };

      this.ws.onclose = () => {
        clearInterval(this.pingInterval);
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 1.5, 15000);
      };

      this.ws.onerror = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.close();
        }
      };
    } catch (e) {
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 1.5, 15000);
    }
  }
}

const wsClient = new RealtimeWebSocketClient();
wsClient.connect();

class QueryBuilder {
  table: string;
  _query: any = {};
  _select: string = "*";
  _isSingle: boolean = false;
  _maybeSingle: boolean = false;
  _count: boolean = false;
  _method: string = "GET";
  _body: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields = "*", options?: { count?: string, head?: boolean }) {
    this._select = fields;
    if (options?.count) this._count = true;
    return this;
  }

  eq(column: string, value: any) {
    this._query[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
    if (Array.isArray(values) && values.length > 0) {
      this._query[column] = values.join(",");
    }
    return this;
  }

  not(column: string, operator: string, value: any) {
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  order(column: string, options?: any) {
    this._query["order"] = column;
    return this;
  }
  
  limit(count: number) {
    this._query["limit"] = count;
    return this;
  }

  insert(data: any) {
    this._method = "POST";
    this._body = data;
    return this;
  }

  upsert(data: any, options?: any) {
    this._method = "UPSERT";
    this._body = data;
    (this as any)._upsertOptions = options;
    return this;
  }

  update(data: any) {
    this._method = "PUT";
    this._body = data;
    return this;
  }

  delete() {
    this._method = "DELETE";
    return this;
  }

  async _fetch() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      if (this._method === "UPSERT") {
        const upsertOpts = (this as any)._upsertOptions;
        const conflictKey = upsertOpts?.onConflict || "order_id";
        const conflictVal = this._body && typeof this._body === "object" ? this._body[conflictKey] : undefined;
        if (conflictVal !== undefined) {
          try {
            const putRes = await fetch(`${API_BASE}/${this.table}?${conflictKey}=${encodeURIComponent(conflictVal)}`, {
              method: "PUT",
              headers: getHeaders(),
              body: JSON.stringify(this._body),
              signal: controller.signal
            });
            if (putRes.ok) {
              const putData = await putRes.json();
              if (Array.isArray(putData) && putData.length > 0) {
                clearTimeout(timeoutId);
                notifyDatabaseChange(this.table, "UPDATE", putData[0]);
                return putData;
              }
            }
          } catch (e) {}
        }
        const postRes = await fetch(`${API_BASE}/${this.table}`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(this._body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!postRes.ok) return [];
        const postData = await postRes.json();
        notifyDatabaseChange(this.table, "INSERT", postData);
        return postData;
      }

      const url = new URL(`${API_BASE}/${this.table}`);
      if (Object.keys(this._query).length > 0) {
        url.search = new URLSearchParams(this._query).toString();
      }
      const res = await fetch(url.toString(), {
        method: this._method,
        headers: getHeaders(),
        body: this._body ? JSON.stringify(this._body) : undefined,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) return [];
      const data = await res.json();
      if (this._method !== "GET") {
        notifyDatabaseChange(this.table, this._method);
      }
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      return [];
    }
  }

  async then(resolve: any, reject: any) {
    try {
      let data = await this._fetch();
      if (this._method === "GET") {
        if (this._count) {
          resolve({ count: Array.isArray(data) ? data.length : 0, data: null, error: null });
          return;
        }
        if (this._isSingle) {
          data = Array.isArray(data) && data.length > 0 ? data[0] : (Array.isArray(data) ? null : data);
        } else if (this._maybeSingle) {
          data = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
        }
        resolve({ data: data || (this._isSingle || this._maybeSingle ? null : []), error: null });
      } else {
        resolve({ data: data, error: null });
      }
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  }
}

class SupabaseAuth {
  listeners: any[] = [];
  
  onAuthStateChange(callback: any) {
    this.listeners.push(callback);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  async getSession() {
    const token = getToken();
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      return { data: { session: { user: JSON.parse(userStr) } }, error: null };
    }
    return { data: { session: null }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      this.listeners.forEach(cb => cb("SIGNED_IN", { user: data.user }));
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async signUp({ email, password, options }: any) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: options?.data?.full_name || "",
          role: options?.data?.role || "farmer"
        })
      });
      if (!res.ok) throw new Error("Registration failed");
      const data = await res.json();
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      this.listeners.forEach(cb => cb("SIGNED_IN", { user: data.user }));
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  async signOut() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    this.listeners.forEach(cb => cb("SIGNED_OUT", null));
    return { error: null };
  }
}

interface SubscriptionHandler {
  event: string;
  filter: any;
  callback: (payload: any) => void;
}

class RealtimeChannel {
  name: string;
  handlers: SubscriptionHandler[] = [];
  listener: any = null;

  constructor(name: string) {
    this.name = name;
  }

  on(event: string, filter: any, callback: (payload: any) => void) {
    if (typeof callback === "function") {
      this.handlers.push({ event, filter, callback });
    }
    return this;
  }

  subscribe() {
    this.listener = (e: CustomEvent) => {
      const detail = e.detail;
      if (!detail) return;

      this.handlers.forEach(({ event, filter, callback }) => {
        // Table filter check
        if (filter?.table && filter.table !== detail.table) {
          return;
        }

        // Event filter check
        if (event && event !== "*" && event !== "postgres_changes") {
          if (filter?.event && filter.event !== "*" && filter.event !== detail.eventType) {
            return;
          }
        } else if (filter?.event && filter.event !== "*" && filter.event !== detail.eventType) {
          return;
        }

        const payload = {
          schema: "public",
          table: detail.table,
          commit_timestamp: new Date().toISOString(),
          eventType: detail.eventType,
          new: detail.data || {},
          old: {}
        };

        try {
          callback(payload);
        } catch (err) {
          console.error(`[RealtimeChannel:${this.name}] callback error:`, err);
        }
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("supabase_db_change", this.listener as EventListener);
    }
    return this;
  }

  unsubscribe() {
    if (typeof window !== "undefined" && this.listener) {
      window.removeEventListener("supabase_db_change", this.listener as EventListener);
      this.listener = null;
    }
  }
}

export const supabase = {
  auth: new SupabaseAuth(),
  from: (table: string) => new QueryBuilder(table),
  rpc: async (func: string, params?: any) => {
    try {
      const res = await fetch(`${API_BASE}/rpc/${func}`, {
        method: "POST",
        headers: getHeaders(),
        body: params ? JSON.stringify(params) : undefined
      });
      const data = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: [], error: null };
    }
  },
  functions: {
    invoke: async (funcName: string, options?: any) => {
      // Direct call to Supabase Edge Function strictly for Crop Scanner
      if (funcName === "crop-disease-scan") {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://njpapswbdnvbtxituwfa.supabase.co";
          const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
          const targetUrl = `${supabaseUrl}/functions/v1/crop-disease-scan`;

          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (publishableKey) {
            headers["apikey"] = publishableKey;
            headers["Authorization"] = `Bearer ${publishableKey}`;
          }

          const res = await fetch(targetUrl, {
            method: "POST",
            headers,
            body: options?.body ? JSON.stringify(options.body) : undefined,
          });

          if (!res.ok) {
            console.warn(`Supabase Edge Function 'crop-disease-scan' returned status ${res.status}. Falling back to local AI engine.`);
            // Fallback to local FastAPI AI engine
            const localRes = await fetch(`${API_BASE}/crop-disease-scan`, {
              method: "POST",
              headers: getHeaders(),
              body: options?.body ? JSON.stringify(options.body) : undefined,
            });
            if (localRes.ok) {
              const localData = await localRes.json();
              return { data: localData, error: null };
            }
            const errText = await res.text();
            let errMsg = `Edge function returned status ${res.status}`;
            try {
              const parsed = JSON.parse(errText);
              if (parsed.error) errMsg = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
            } catch {}
            return { data: null, error: new Error(errMsg) };
          }

          const data = await res.json();
          return { data, error: null };
        } catch (err: any) {
          console.warn("Supabase Edge Function request error, falling back to local AI engine:", err);
          try {
            const localRes = await fetch(`${API_BASE}/crop-disease-scan`, {
              method: "POST",
              headers: getHeaders(),
              body: options?.body ? JSON.stringify(options.body) : undefined,
            });
            if (localRes.ok) {
              const localData = await localRes.json();
              return { data: localData, error: null };
            }
          } catch (localErr) {}
          return { data: null, error: err };
        }
      }

      // Keep existing FastAPI behavior for all other functions
      try {
        const res = await fetch(`${API_BASE}/${funcName}`, {
          method: "POST",
          headers: getHeaders(),
          body: options?.body ? JSON.stringify(options.body) : undefined
        });
        const data = await res.json();
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60` } })
    })
  },
  channel: (name: string) => new RealtimeChannel(name),
  removeChannel: (channel: any) => {
    if (channel && typeof channel.unsubscribe === "function") {
      channel.unsubscribe();
    }
  }
};