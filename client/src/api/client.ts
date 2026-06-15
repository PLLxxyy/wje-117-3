const BASE_URL = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(username: string, email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Plans
  async createPlan(input: any) {
    return this.request<any>('/plans', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getActivePlan() {
    return this.request<any>('/plans/active');
  }

  async getPlans() {
    return this.request<any[]>('/plans');
  }

  async getPlan(id: number) {
    return this.request<any>(`/plans/${id}`);
  }

  async completePlan(id: number) {
    return this.request<any>(`/plans/${id}/complete`, { method: 'PATCH' });
  }

  // Checkins
  async createCheckin(data: any) {
    return this.request<any>('/checkins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCheckins(planId: number) {
    return this.request<any[]>(`/checkins/plan/${planId}`);
  }

  async getStats(planId: number) {
    return this.request<any>(`/checkins/stats/${planId}`);
  }

  async getRecentCheckins() {
    return this.request<any[]>('/checkins/recent');
  }

  // Shoes
  async getShoes() {
    return this.request<any[]>('/shoes');
  }

  async getShoe(id: number) {
    return this.request<any>(`/shoes/${id}`);
  }

  async createShoe(data: any) {
    return this.request<any>('/shoes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShoe(id: number, data: any) {
    return this.request<any>(`/shoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateShoeStatus(id: number, status: string) {
    return this.request<any>(`/shoes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteShoe(id: number) {
    return this.request<any>(`/shoes/${id}`, {
      method: 'DELETE',
    });
  }

  // Coach
  async getStudents() {
    return this.request<any[]>('/coach/students');
  }

  async addStudent(username: string) {
    return this.request<any>('/coach/students', {
      method: 'POST',
      body: JSON.stringify({ student_username: username }),
    });
  }

  async removeStudent(studentId: number) {
    return this.request<any>(`/coach/students/${studentId}`, { method: 'DELETE' });
  }

  async getStudentPlan(studentId: number) {
    return this.request<any>(`/coach/students/${studentId}/plan`);
  }

  async getStudentStats(studentId: number) {
    return this.request<any>(`/coach/students/${studentId}/stats`);
  }

  async addNote(studentId: number, planId: number, content: string) {
    return this.request<any>('/coach/notes', {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, plan_id: planId, content }),
    });
  }

  async getNotes(studentId: number) {
    return this.request<any[]>(`/coach/notes/${studentId}`);
  }

  async getReceivedNotes() {
    return this.request<any[]>('/coach/received-notes');
  }

  // Admin
  async getUsers() {
    return this.request<any[]>('/admin/users');
  }

  async updateUserRole(userId: number, role: string) {
    return this.request<any>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: number) {
    return this.request<any>(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  async getTemplates() {
    return this.request<any[]>('/admin/templates');
  }

  async createTemplate(data: any) {
    return this.request<any>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: number, data: any) {
    return this.request<any>(`/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: number) {
    return this.request<any>(`/admin/templates/${id}`, { method: 'DELETE' });
  }

  async getEvents() {
    return this.request<any[]>('/admin/events');
  }

  async createEvent(data: any) {
    return this.request<any>('/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: number, data: any) {
    return this.request<any>(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: number) {
    return this.request<any>(`/admin/events/${id}`, { method: 'DELETE' });
  }

  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }
}

export const api = new ApiClient();
