/**
 * API client for the Trackmail dashboard
 */

export interface Application {
  id: string
  threadId: string
  lastEmailId: string
  company: string
  title: string
  jobUrl: string | null
  appliedAt: string | null
  status: string
  source: string
  confidence: string
  atsVendor: string | null
  companyDomain: string | null
  rawSubject: string | null
  rawSnippet: string | null
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  applicationId: string
  type: string
  status?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ApplicationsResponse {
  data: Application[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApplicationsFilters {
  status?: string
  source?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Applications API
  async getApplications(filters: ApplicationsFilters = {}): Promise<ApplicationsResponse> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const query = params.toString()
    return this.request<ApplicationsResponse>(
      `/applications${query ? `?${query}` : ''}`
    )
  }

  async getApplication(id: string): Promise<Application> {
    return this.request<Application>(`/applications/${id}`)
  }

  async updateApplicationStatus(
    id: string,
    status: string
  ): Promise<Application> {
    return this.request<Application>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // Events API
  async getApplicationEvents(applicationId: string): Promise<Event[]> {
    return this.request<Event[]>(`/events?applicationId=${applicationId}`)
  }

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health')
  }
}

export const api = new ApiClient()
