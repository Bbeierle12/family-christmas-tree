import { apiClient } from '@/lib/api-client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'active' | 'declined';
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
}

export interface InviteMemberData {
  email: string;
  role: 'editor' | 'viewer';
}

export const workspacesService = {
  /**
   * Get all workspaces for current user
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await apiClient.get('/workspaces');
    return response.data.data.workspaces;
  },

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const response = await apiClient.get(`/workspaces/${workspaceId}`);
    return response.data.data.workspace;
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    const response = await apiClient.post('/workspaces', data);
    return response.data.data.workspace;
  },

  /**
   * Update workspace
   */
  async updateWorkspace(
    workspaceId: string,
    data: UpdateWorkspaceData
  ): Promise<Workspace> {
    const response = await apiClient.patch(`/workspaces/${workspaceId}`, data);
    return response.data.data.workspace;
  },

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}`);
  },

  /**
   * Get workspace members
   */
  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const response = await apiClient.get(`/workspaces/${workspaceId}/members`);
    return response.data.data.members;
  },

  /**
   * Invite member to workspace
   */
  async inviteMember(
    workspaceId: string,
    data: InviteMemberData
  ): Promise<void> {
    await apiClient.post(`/workspaces/${workspaceId}/members`, data);
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: 'editor' | 'viewer'
  ): Promise<void> {
    await apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}`, {
      role,
    });
  },

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },
};
