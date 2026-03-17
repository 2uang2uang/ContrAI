// API client for backend services
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface LeaderboardEntry {
  address: string;
  total_score: number;
  rank: string;
  level: string;
  badges: string[];
  trend: 'up' | 'down' | 'neutral';
  position: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get leaderboard from backend API
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await this.request<ApiResponse<LeaderboardEntry[]>>(
      `/api/reputation/leaderboard?limit=${limit}`
    );
    return response.data;
  }

  // Calculate reputation score
  async calculateReputation(address: string) {
    return this.request(`/api/reputation/calculate`, {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  // Get on-chain data
  async getOnChainData(address: string) {
    return this.request(`/api/reputation/${address}`);
  }

  // Request mint signature
  async requestMintSignature(address: string, score: number, tier: string) {
    return this.request(`/api/reputation/request-mint`, {
      method: 'POST',
      body: JSON.stringify({ address, score, tier }),
    });
  }
}

export const apiClient = new ApiClient();

// Export individual functions for backward compatibility
export const getLeaderboard = (limit?: number) => apiClient.getLeaderboard(limit);
export const calculateReputation = (address: string) => apiClient.calculateReputation(address);
export const getOnChainData = (address: string) => apiClient.getOnChainData(address);
export const requestMintSignature = (address: string, score: number, tier: string) => 
  apiClient.requestMintSignature(address, score, tier);