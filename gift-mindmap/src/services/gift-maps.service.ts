import { apiClient } from '@/lib/api-client';

export interface GiftMap {
  id: string;
  workspaceId: string;
  title: string;
  year?: number;
  occasion?: string;
  description?: string;
  color?: string;
  createdBy: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGiftMapData {
  title: string;
  year?: number;
  occasion?: 'christmas' | 'birthday' | 'anniversary' | 'wedding' | 'graduation' | 'other';
  description?: string;
  color?: string;
}

export interface UpdateGiftMapData {
  title?: string;
  year?: number;
  occasion?: string;
  description?: string;
  color?: string;
}

export interface GiftMapFilters {
  year?: number;
  occasion?: string;
}

export const giftMapsService = {
  /**
   * Get all gift maps in a workspace
   */
  async getGiftMaps(
    workspaceId: string,
    filters?: GiftMapFilters
  ): Promise<GiftMap[]> {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.occasion) params.append('occasion', filters.occasion);

    const response = await apiClient.get(
      `/workspaces/${workspaceId}/gift-maps${params.toString() ? `?${params}` : ''}`
    );
    return response.data.data.giftMaps;
  },

  /**
   * Get gift map by ID
   */
  async getGiftMap(giftMapId: string): Promise<GiftMap> {
    const response = await apiClient.get(`/gift-maps/${giftMapId}`);
    return response.data.data.giftMap;
  },

  /**
   * Create a new gift map
   */
  async createGiftMap(
    workspaceId: string,
    data: CreateGiftMapData
  ): Promise<GiftMap> {
    const response = await apiClient.post(
      `/workspaces/${workspaceId}/gift-maps`,
      data
    );
    return response.data.data.giftMap;
  },

  /**
   * Update gift map
   */
  async updateGiftMap(
    giftMapId: string,
    data: UpdateGiftMapData
  ): Promise<GiftMap> {
    const response = await apiClient.patch(`/gift-maps/${giftMapId}`, data);
    return response.data.data.giftMap;
  },

  /**
   * Delete gift map
   */
  async deleteGiftMap(giftMapId: string): Promise<void> {
    await apiClient.delete(`/gift-maps/${giftMapId}`);
  },

  /**
   * Duplicate gift map
   */
  async duplicateGiftMap(giftMapId: string): Promise<GiftMap> {
    const response = await apiClient.post(`/gift-maps/${giftMapId}/duplicate`);
    return response.data.data.giftMap;
  },

  /**
   * Archive gift map
   */
  async archiveGiftMap(giftMapId: string): Promise<void> {
    await apiClient.post(`/gift-maps/${giftMapId}/archive`);
  },

  /**
   * Restore archived gift map
   */
  async restoreGiftMap(giftMapId: string): Promise<void> {
    await apiClient.post(`/gift-maps/${giftMapId}/restore`);
  },
};
