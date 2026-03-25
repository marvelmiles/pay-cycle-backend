type HeadersInit = any;

type TokenType = "interswitch" | "generic";

interface RequestConfig extends RequestInit {
  useToken?: boolean;
  tokenType?: TokenType;
  params?: Record<string, any>;
}

interface ServerRequestConfig {
  baseURL: string;
  getGenericToken?: () => string | null;
  getInterswitchToken?: () => string | null;
}

class ServerRequest {
  private baseURL: string;
  private getGenericToken?: () => string | null;
  private getInterswitchToken?: () => string | null;

  constructor(config: ServerRequestConfig) {
    this.baseURL = config.baseURL;
    this.getGenericToken = config.getGenericToken;
    this.getInterswitchToken = config.getInterswitchToken;
  }

  private buildURL(url: string, params?: Record<string, any>) {
    const isFullUrl = /^https?:\/\//i.test(url);

    const fullUrl = isFullUrl ? new URL(url) : new URL(this.baseURL + url);

    if (params) {
      Object.keys(params).forEach((key) =>
        fullUrl.searchParams.append(key, params[key]),
      );
    }

    return fullUrl.toString();
  }

  private getToken(type?: TokenType) {
    if (type === "interswitch") {
      return this.getInterswitchToken?.();
    }
    return this.getGenericToken?.();
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    const {
      useToken = true,
      tokenType = "generic",
      params,
      headers,
      ...rest
    } = config || {};

    const finalHeaders: HeadersInit = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (useToken) {
      const token = this.getToken(tokenType);
      if (token) {
        finalHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(this.buildURL(url, params), {
      method,
      headers: finalHeaders,
      body: data ? JSON.stringify(data) : undefined,
      ...rest,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Request failed");
    }

    return response.json();
  }

  get<T>(url: string, config?: RequestConfig) {
    return this.request<T>("GET", url, undefined, config);
  }

  post<T>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>("POST", url, data, config);
  }

  put<T>(url: string, data?: any, config?: RequestConfig) {
    return this.request<T>("PUT", url, data, config);
  }

  delete<T>(url: string, config?: RequestConfig) {
    return this.request<T>("DELETE", url, undefined, config);
  }
}

export const serverRequest = new ServerRequest({
  baseURL: "http://localhost:5000/api",

  getGenericToken: () => {
    return "";
  },

  getInterswitchToken: () => {
    return "";
  },
});

export default ServerRequest;
