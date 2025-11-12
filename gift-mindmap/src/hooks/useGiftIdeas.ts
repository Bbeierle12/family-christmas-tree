import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  giftIdeasService,
  type CreateGiftIdeaData,
  type UpdateGiftIdeaData,
  type GiftIdeaFilters,
} from '@/services/gift-ideas.service';

export const giftIdeaKeys = {
  all: ['giftIdeas'] as const,
  lists: () => [...giftIdeaKeys.all, 'list'] as const,
  list: (personId: string, filters?: GiftIdeaFilters) =>
    [...giftIdeaKeys.lists(), personId, filters] as const,
  details: () => [...giftIdeaKeys.all, 'detail'] as const,
  detail: (id: string) => [...giftIdeaKeys.details(), id] as const,
};

export function useGiftIdeas(personId: string, filters?: GiftIdeaFilters) {
  return useQuery({
    queryKey: giftIdeaKeys.list(personId, filters),
    queryFn: () => giftIdeasService.getGiftIdeas(personId, filters),
    enabled: !!personId,
  });
}

export function useGiftIdea(giftIdeaId: string) {
  return useQuery({
    queryKey: giftIdeaKeys.detail(giftIdeaId),
    queryFn: () => giftIdeasService.getGiftIdea(giftIdeaId),
    enabled: !!giftIdeaId,
  });
}

export function useCreateGiftIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      data,
    }: {
      personId: string;
      data: CreateGiftIdeaData;
    }) => giftIdeasService.createGiftIdea(personId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: giftIdeaKeys.list(variables.personId),
      });
    },
  });
}

export function useUpdateGiftIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      giftIdeaId,
      data,
    }: {
      giftIdeaId: string;
      data: UpdateGiftIdeaData;
    }) => giftIdeasService.updateGiftIdea(giftIdeaId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: giftIdeaKeys.detail(variables.giftIdeaId),
      });
      queryClient.invalidateQueries({ queryKey: giftIdeaKeys.lists() });
    },
  });
}

export function useDeleteGiftIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (giftIdeaId: string) =>
      giftIdeasService.deleteGiftIdea(giftIdeaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: giftIdeaKeys.lists() });
    },
  });
}

export function usePurchaseGiftIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (giftIdeaId: string) =>
      giftIdeasService.purchaseGiftIdea(giftIdeaId),
    onSuccess: (_, giftIdeaId) => {
      queryClient.invalidateQueries({
        queryKey: giftIdeaKeys.detail(giftIdeaId),
      });
      queryClient.invalidateQueries({ queryKey: giftIdeaKeys.lists() });
    },
  });
}

export function useUnpurchaseGiftIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (giftIdeaId: string) =>
      giftIdeasService.unpurchaseGiftIdea(giftIdeaId),
    onSuccess: (_, giftIdeaId) => {
      queryClient.invalidateQueries({
        queryKey: giftIdeaKeys.detail(giftIdeaId),
      });
      queryClient.invalidateQueries({ queryKey: giftIdeaKeys.lists() });
    },
  });
}
