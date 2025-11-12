import { apiClient } from '@/lib/api-client';

export interface Person {
  id: string;
  giftMapId: string;
  name: string;
  email?: string;
  budgetMin?: number;
  budgetMax?: number;
  ageGroup?: 'child' | 'teen' | 'adult' | 'senior';
  interests?: string[];
  notes?: string;
  color?: string;
  position?: { x: number; y: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonData {
  name: string;
  email?: string;
  budgetMin?: number;
  budgetMax?: number;
  ageGroup?: 'child' | 'teen' | 'adult' | 'senior';
  interests?: string[];
  notes?: string;
  color?: string;
  position?: { x: number; y: number };
}

export interface UpdatePersonData {
  name?: string;
  email?: string;
  budgetMin?: number;
  budgetMax?: number;
  ageGroup?: string;
  interests?: string[];
  notes?: string;
  color?: string;
  position?: { x: number; y: number };
}

export const peopleService = {
  /**
   * Get all people in a gift map
   */
  async getPeople(giftMapId: string): Promise<Person[]> {
    const response = await apiClient.get(`/gift-maps/${giftMapId}/people`);
    return response.data.data.people;
  },

  /**
   * Get person by ID
   */
  async getPerson(personId: string): Promise<Person> {
    const response = await apiClient.get(`/people/${personId}`);
    return response.data.data.person;
  },

  /**
   * Create a new person
   */
  async createPerson(
    giftMapId: string,
    data: CreatePersonData
  ): Promise<Person> {
    const response = await apiClient.post(
      `/gift-maps/${giftMapId}/people`,
      data
    );
    return response.data.data.person;
  },

  /**
   * Update person
   */
  async updatePerson(
    personId: string,
    data: UpdatePersonData
  ): Promise<Person> {
    const response = await apiClient.patch(`/people/${personId}`, data);
    return response.data.data.person;
  },

  /**
   * Delete person
   */
  async deletePerson(personId: string): Promise<void> {
    await apiClient.delete(`/people/${personId}`);
  },
};
