import { apiClient } from '@/lib/api-client';

export type IdeaStatus =
  | 'idea'
  | 'considering'
  | 'decided'
  | 'purchased'
  | 'wrapped'
  | 'given';

export interface GiftIdea {
  id: string;
  personId: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  priority: number;
  url?: string;
  imageUrl?: string;
  status: IdeaStatus;
  createdBy: string;
  purchasedBy?: string;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGiftIdeaData {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  priority?: number;
  url?: string;
  imageUrl?: string;
}

export interface UpdateGiftIdeaData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  priority?: number;
  url?: string;
  imageUrl?: string;
  status?: IdeaStatus;
}

export interface GiftIdeaFilters {
  status?: IdeaStatus;
  priority?: number;
  minPrice?: number;
  maxPrice?: number;
}

export const giftIdeasService = {
  /**
   * Get all gift ideas for a person
   */
  async getGiftIdeas(
    personId: string,
    filters?: GiftIdeaFilters
  ): Promise<GiftIdea[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority !== undefined)
      params.append('priority', filters.priority.toString());
    if (filters?.minPrice !== undefined)
      params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined)
      params.append('maxPrice', filters.maxPrice.toString());

    const response = await apiClient.get(
      `/people/${personId}/gift-ideas${params.toString() ? `?${params}` : ''}`
    );
    return response.data.data.giftIdeas;
  },

  /**
   * Get gift idea by ID
   */
  async getGiftIdea(giftIdeaId: string): Promise<GiftIdea> {
    const response = await apiClient.get(`/gift-ideas/${giftIdeaId}`);
    return response.data.data.giftIdea;
  },

  /**
   * Create a new gift idea
   */
  async createGiftIdea(
    personId: string,
    data: CreateGiftIdeaData
  ): Promise<GiftIdea> {
    const response = await apiClient.post(
      `/people/${personId}/gift-ideas`,
      data
    );
    return response.data.data.giftIdea;
  },

  /**
   * Update gift idea
   */
  async updateGiftIdea(
    giftIdeaId: string,
    data: UpdateGiftIdeaData
  ): Promise<GiftIdea> {
    const response = await apiClient.patch(`/gift-ideas/${giftIdeaId}`, data);
    return response.data.data.giftIdea;
  },

  /**
   * Delete gift idea
   */
  async deleteGiftIdea(giftIdeaId: string): Promise<void> {
    await apiClient.delete(`/gift-ideas/${giftIdeaId}`);
  },

  /**
   * Mark gift idea as purchased
   */
  async purchaseGiftIdea(giftIdeaId: string): Promise<GiftIdea> {
    const response = await apiClient.post(
      `/gift-ideas/${giftIdeaId}/purchase`
    );
    return response.data.data.giftIdea;
  },

  /**
   * Unmark gift idea as purchased
   */
  async unpurchaseGiftIdea(giftIdeaId: string): Promise<GiftIdea> {
    const response = await apiClient.post(
      `/gift-ideas/${giftIdeaId}/unpurchase`
    );
    return response.data.data.giftIdea;
  },
};
