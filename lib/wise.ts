// Wise API Client
// Documentation: https://docs.wise.com/api-docs/api-reference

const WISE_API_BASE = process.env.WISE_ENV === 'production'
  ? 'https://api.wise.com'
  : 'https://api.sandbox.transferwise.tech';

export class WiseClient {
  private apiToken: string;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${WISE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Wise API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get user profiles
  async getProfiles() {
    return this.request('/v1/profiles');
  }

  // Get accounts for a profile
  async getAccounts(profileId: string) {
    return this.request(`/v1/borderless-accounts?profileId=${profileId}`);
  }

  // Get account balance
  async getBalance(profileId: string, accountId: string) {
    const accounts = await this.getAccounts(profileId);
    const account = accounts.find((acc: any) => acc.id === parseInt(accountId));
    return account?.balances || [];
  }

  // Get transactions (statement)
  async getTransactions(profileId: string, borderlessAccountId: string, currency: string, options: {
    intervalStart?: string;
    intervalEnd?: string;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams({
      currency,
      intervalStart: options.intervalStart || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      intervalEnd: options.intervalEnd || new Date().toISOString(),
      type: 'COMPACT',
    });

    return this.request(
      `/v3/profiles/${profileId}/borderless-accounts/${borderlessAccountId}/statement.json?${params}`
    );
  }

  // Verify API token is valid
  async verify() {
    try {
      const profiles = await this.getProfiles();
      return profiles.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export function createWiseClient(apiToken: string): WiseClient {
  return new WiseClient(apiToken);
}
