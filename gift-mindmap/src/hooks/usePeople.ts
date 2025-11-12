import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  peopleService,
  type CreatePersonData,
  type UpdatePersonData,
} from '@/services/people.service';

export const peopleKeys = {
  all: ['people'] as const,
  lists: () => [...peopleKeys.all, 'list'] as const,
  list: (giftMapId: string) => [...peopleKeys.lists(), giftMapId] as const,
  details: () => [...peopleKeys.all, 'detail'] as const,
  detail: (id: string) => [...peopleKeys.details(), id] as const,
};

export function usePeople(giftMapId: string) {
  return useQuery({
    queryKey: peopleKeys.list(giftMapId),
    queryFn: () => peopleService.getPeople(giftMapId),
    enabled: !!giftMapId,
  });
}

export function usePerson(personId: string) {
  return useQuery({
    queryKey: peopleKeys.detail(personId),
    queryFn: () => peopleService.getPerson(personId),
    enabled: !!personId,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      giftMapId,
      data,
    }: {
      giftMapId: string;
      data: CreatePersonData;
    }) => peopleService.createPerson(giftMapId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: peopleKeys.list(variables.giftMapId),
      });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      data,
    }: {
      personId: string;
      data: UpdatePersonData;
    }) => peopleService.updatePerson(personId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: peopleKeys.detail(variables.personId),
      });
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) => peopleService.deletePerson(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
    },
  });
}
