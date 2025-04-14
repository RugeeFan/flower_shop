import axios, { AxiosInstance } from "axios";
import { getAuthToken } from "./auth";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.STRAPI_API_URL || "http://localhost:1337/api",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 请求拦截器：自动添加 Token
    this.api.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        // 客户端获取 Token
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // 响应拦截器：统一错误处理
    this.api.interceptors.response.use(
      (response) => response.data, // 只返回 `data` 部分
      (error) => {
        console.error("API Error:", error);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: object, request?: Request): Promise<T> {
    const token = getAuthToken(request); // 服务器端获取 Token
    return this.api.get(url, { params, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  }

  async post<T>(url: string, data?: object): Promise<T> {
    return this.api.post(url, data);
  }

  async put<T>(url: string, data?: object): Promise<T> {
    return this.api.put(url, data);
  }

  async delete<T>(url: string): Promise<T> {
    return this.api.delete(url);
  }
}

// 创建全局实例
export const apiService = new ApiService();
