import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  giftMapsService,
  type CreateGiftMapData,
  type UpdateGiftMapData,
  type GiftMapFilters,
} from '@/services/gift-maps.service';

export const giftMapKeys = {
  all: ['giftMaps'] as const,
  lists: () => [...giftMapKeys.all, 'list'] as const,
  list: (workspaceId: string, filters?: GiftMapFilters) =>
    [...giftMapKeys.lists(), workspaceId, filters] as const,
  details: () => [...giftMapKeys.all, 'detail'] as const,
  detail: (id: string) => [...giftMapKeys.details(), id] as const,
};

export function useGiftMaps(workspaceId: string, filters?: GiftMapFilters) {
  return useQuery({
    queryKey: giftMapKeys.list(workspaceId, filters),
    queryFn: () => giftMapsService.getGiftMaps(workspaceId, filters),
    enabled: !!workspaceId,
  });
}

export function useGiftMap(giftMapId: string) {
  return useQuery({
    queryKey: giftMapKeys.detail(giftMapId),
    queryFn: () => giftMapsService.getGiftMap(giftMapId),
    enabled: !!giftMapId,
  });
}

export function useCreateGiftMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateGiftMapData;
    }) => giftMapsService.createGiftMap(workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: giftMapKeys.list(variables.workspaceId),
      });
    },
  });
}

export function useUpdateGiftMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      giftMapId,
      data,
    }: {
      giftMapId: string;
      data: UpdateGiftMapData;
    }) => giftMapsService.updateGiftMap(giftMapId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: giftMapKeys.detail(variables.giftMapId),
      });
    },
  });
}

export function useDeleteGiftMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (giftMapId: string) => giftMapsService.deleteGiftMap(giftMapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftMapKeys.lists() });
    },
  });
}

export function useDuplicateGiftMap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (giftMapId: string) =>
      giftMapsService.duplicateGiftMap(giftMapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftMapKeys.lists() });
    },
  });
}
