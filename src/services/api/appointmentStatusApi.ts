import { apiService } from '../api';
import { clinicCookies } from '@/utils/cookies';

export interface AppointmentStatus {
  _id?: string;
  code: string;
  name_ar: string;
  name_en: string;
  color: string;
  icon?: string;
  order: number;
  show_in_calendar: boolean;
  is_active: boolean;
  is_default: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAppointmentStatusRequest {
  code: string;
  name_ar: string;
  name_en: string;
  color: string;
  icon?: string;
  order?: number;
  show_in_calendar?: boolean;
  is_default?: boolean;
  description?: string;
}

export interface UpdateAppointmentStatusRequest {
  name_ar?: string;
  name_en?: string;
  color?: string;
  icon?: string;
  order?: number;
  show_in_calendar?: boolean;
  is_default?: boolean;
  is_active?: boolean;
  description?: string;
}

export interface BatchUpdateRequest {
  updates: Array<{
    id: string;
    order?: number;
    is_active?: boolean;
    show_in_calendar?: boolean;
  }>;
}

class AppointmentStatusApi {
  private getAuthHeaders() {
    const token = clinicCookies.getClinicToken();
    const clinicId = clinicCookies.getClinicId();
    
    if (!token || !clinicId) {
      throw new Error('Authentication required');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-Clinic-Id': clinicId,
      'Content-Type': 'application/json'
    };
  }

  async getStatuses(includeInactive: boolean = false): Promise<AppointmentStatus[]> {
    try {
      const headers = this.getAuthHeaders();
      // Use params object for axios - it will be converted to query string automatically
      const params = includeInactive ? { includeInactive: 'true' } : {};
      
      console.log('🔍 Fetching appointment statuses:', {
        includeInactive,
        params,
        hasHeaders: !!headers,
        clinicId: headers['X-Clinic-Id']
      });
      
      // apiService.get returns response.data directly, so we need to handle the structure
      const response = await apiService.get('/appointment-statuses', { 
        headers,
        params 
      });
      
      console.log('✅ Appointment statuses response:', {
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        dataLength: response?.data?.length || (Array.isArray(response) ? response.length : 0),
        fullResponse: response
      });
      
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response?.data) {
        return Array.isArray(response.data) ? response.data : [];
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('❌ Get appointment statuses error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        params: error.config?.params
      });
      throw error;
    }
  }

  async getStatusById(id: string): Promise<AppointmentStatus> {
    try {
      const headers = this.getAuthHeaders();
      const response = await apiService.get(`/appointment-statuses/${id}`, { headers });
      return response.data.data;
    } catch (error: any) {
      console.error('Get appointment status error:', error);
      throw error;
    }
  }

  async createStatus(data: CreateAppointmentStatusRequest): Promise<AppointmentStatus> {
    try {
      const headers = this.getAuthHeaders();
      
      console.log('📤 Creating appointment status:', {
        code: data.code,
        name_en: data.name_en,
        name_ar: data.name_ar,
        color: data.color
      });
      
      const response = await apiService.post('/appointment-statuses', data, { headers });
      
      console.log('✅ Create status response:', {
        responseType: typeof response,
        responseKeys: Object.keys(response || {}),
        fullResponse: response
      });
      
      // apiService.post returns response.data directly (from axios)
      // Backend returns: { success: true, data: status }
      // So response is: { success: true, data: status }
      if (response?.success && response?.data) {
        return response.data;
      } else if (response?.data) {
        // Fallback: if response.data exists directly
        return response.data;
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response structure from server');
      }
    } catch (error: any) {
      console.error('❌ Create appointment status error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async updateStatus(id: string, data: UpdateAppointmentStatusRequest): Promise<AppointmentStatus> {
    try {
      const headers = this.getAuthHeaders();
      const response = await apiService.put(`/appointment-statuses/${id}`, data, { headers });
      return response.data.data;
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      throw error;
    }
  }

  async deleteStatus(id: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await apiService.delete(`/appointment-statuses/${id}`, { headers });
    } catch (error: any) {
      console.error('Delete appointment status error:', error);
      throw error;
    }
  }

  async batchUpdate(data: BatchUpdateRequest): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await apiService.post('/appointment-statuses/batch', data, { headers });
    } catch (error: any) {
      console.error('Batch update appointment statuses error:', error);
      throw error;
    }
  }
}

const appointmentStatusApi = new AppointmentStatusApi();
export default appointmentStatusApi;

