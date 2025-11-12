import { useMemo, useState } from 'react';
import { usePeople, useCreatePerson, useUpdatePerson, useDeletePerson } from '@/hooks/usePeople';
import { useCreateGiftIdea, useUpdateGiftIdea, useDeleteGiftIdea, usePurchaseGiftIdea, useUnpurchaseGiftIdea } from '@/hooks/useGiftIdeas';
import { useQueryClient } from '@tanstack/react-query';
import { giftIdeaKeys } from '@/hooks/useGiftIdeas';
import type { Person } from '@/services/people.service';
import type { GiftIdea } from '@/services/gift-ideas.service';
import type { GiftNode, GiftEdge } from '@/types/gift';
import { useDebouncedCallback } from 'use-debounce';

export interface BackendData {
  nodes: GiftNode[];
  edges: GiftEdge[];
  isLoading: boolean;
}

export interface BackendMutations {
  createPerson: (name: string, data?: Partial<Person>) => Promise<void>;
  updatePerson: (personId: string, data: Partial<Person>) => Promise<void>;
  deletePerson: (personId: string) => Promise<void>;
  createGiftIdea: (personId: string, title: string, data?: Partial<GiftIdea>) => Promise<void>;
  updateGiftIdea: (ideaId: string, data: Partial<GiftIdea>) => Promise<void>;
  deleteGiftIdea: (ideaId: string) => Promise<void>;
  purchaseGiftIdea: (ideaId: string) => Promise<void>;
  unpurchaseGiftIdea: (ideaId: string) => Promise<void>;
  updatePersonPosition: (personId: string, position: { x: number; y: number }) => void;
}

/**
 * Hook to manage backend data and provide mutations for GiftMindMap
 */
export function useGiftMapData(giftMapId: string): {
  data: BackendData;
  mutations: BackendMutations;
} {
  const queryClient = useQueryClient();

  // Fetch people
  const { data: people = [], isLoading: peopleLoading } = usePeople(giftMapId);

  // Cache for gift ideas - loaded on demand
  const [ideasCache] = useState<Map<string, GiftIdea[]>>(new Map());

  // Mutation hooks
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const deletePersonMutation = useDeletePerson();
  const createIdeaMutation = useCreateGiftIdea();
  const updateIdeaMutation = useUpdateGiftIdea();
  const deleteIdeaMutation = useDeleteGiftIdea();
  const purchaseIdeaMutation = usePurchaseGiftIdea();
  const unpurchaseIdeaMutation = useUnpurchaseGiftIdea();

  // Transform backend data to ReactFlow format
  const { nodes, edges } = useMemo(() => {
    const nodes: GiftNode[] = [
      {
        id: 'root',
        type: 'root',
        position: { x: 0, y: 0 },
        data: { label: '🎄 Gift Planning Map' }
      }
    ];

    const edges: GiftEdge[] = [];

    // Add person nodes
    people.forEach((person) => {
      const personNode: GiftNode = {
        id: person.id,
        type: 'person',
        position: person.position || { x: 0, y: 0 },
        data: {
          label: person.name,
          email: person.email,
          interests: Array.isArray(person.interests)
            ? person.interests.join(', ')
            : person.interests || '',
          notes: person.notes,
          budgetMin: person.budgetMin,
          budgetMax: person.budgetMax,
          __color: person.color,
        }
      };

      nodes.push(personNode);

      // Add edge from root to person
      edges.push({
        id: `e-root-${person.id}`,
        source: 'root',
        target: person.id,
        animated: true,
      });

      // Get cached ideas for this person from React Query cache
      const cachedIdeas = queryClient.getQueryData(
        giftIdeaKeys.list(person.id)
      ) as GiftIdea[] | undefined;

      if (cachedIdeas) {
        cachedIdeas.forEach((idea, index) => {
          const ideaNode: GiftNode = {
            id: idea.id,
            type: 'idea',
            position: {
              x: (person.position?.x || 0) + 160 + (index * 20),
              y: (person.position?.y || 0) + (index * 120)
            },
            data: {
              title: idea.title,
              notes: idea.description,
              price: idea.price,
              url: idea.url,
              status: idea.status === 'purchased' ? 'purchased' : 'pending',
              priority: idea.priority,
            }
          };

          nodes.push(ideaNode);

          // Add edge from person to idea
          edges.push({
            id: `e-${person.id}-${idea.id}`,
            source: person.id,
            target: idea.id,
          });
        });
      }
    });

    return { nodes, edges };
  }, [people, queryClient]);

  // Debounced position update to avoid too many API calls
  const debouncedPositionUpdate = useDebouncedCallback(
    (personId: string, position: { x: number; y: number }) => {
      updatePersonMutation.mutate({
        personId,
        data: { position }
      });
    },
    1000 // Wait 1 second after last position change
  );

  // Mutations
  const mutations: BackendMutations = {
    createPerson: async (name: string, data?: Partial<Person>) => {
      await createPersonMutation.mutateAsync({
        giftMapId,
        data: {
          name,
          ...data,
          position: data?.position || { x: 0, y: 0 }
        }
      });
    },

    updatePerson: async (personId: string, data: Partial<Person>) => {
      await updatePersonMutation.mutateAsync({
        personId,
        data
      });
    },

    deletePerson: async (personId: string) => {
      await deletePersonMutation.mutateAsync(personId);
    },

    createGiftIdea: async (personId: string, title: string, data?: Partial<GiftIdea>) => {
      await createIdeaMutation.mutateAsync({
        personId,
        data: {
          title,
          ...data
        }
      });
    },

    updateGiftIdea: async (ideaId: string, data: Partial<GiftIdea>) => {
      await updateIdeaMutation.mutateAsync({
        giftIdeaId: ideaId,
        data
      });
    },

    deleteGiftIdea: async (ideaId: string) => {
      await deleteIdeaMutation.mutateAsync(ideaId);
    },

    purchaseGiftIdea: async (ideaId: string) => {
      await purchaseIdeaMutation.mutateAsync(ideaId);
    },

    unpurchaseGiftIdea: async (ideaId: string) => {
      await unpurchaseIdeaMutation.mutateAsync(ideaId);
    },

    updatePersonPosition: (personId: string, position: { x: number; y: number }) => {
      // Use debounced update for position changes
      debouncedPositionUpdate(personId, position);
    },
  };

  return {
    data: {
      nodes,
      edges,
      isLoading: peopleLoading,
    },
    mutations,
  };
}
