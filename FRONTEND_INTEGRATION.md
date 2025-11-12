# Frontend Integration Guide

Complete guide for connecting the React frontend to the backend API.

## ✅ Completed (Phase 4.1 & 4.2)

### Infrastructure Setup
- ✅ React Query (@tanstack/react-query) installed
- ✅ Axios installed and configured
- ✅ API client with token interceptors (`api-client.ts`)
- ✅ Automatic token refresh on 401 errors
- ✅ All API services created (auth, workspaces, gift-maps, people, gift-ideas)
- ✅ React Query hooks for all services
- ✅ Authentication context with user state management
- ✅ Login/Register pages
- ✅ Workspace selector UI

### Files Created

**API Layer:**
- `gift-mindmap/src/lib/api-client.ts` - Axios configuration with interceptors
- `gift-mindmap/src/services/auth.service.ts` - Authentication API
- `gift-mindmap/src/services/workspaces.service.ts` - Workspaces API
- `gift-mindmap/src/services/gift-maps.service.ts` - Gift Maps API
- `gift-mindmap/src/services/people.service.ts` - People API
- `gift-mindmap/src/services/gift-ideas.service.ts` - Gift Ideas API

**React Query Hooks:**
- `gift-mindmap/src/hooks/useWorkspaces.ts`
- `gift-mindmap/src/hooks/useGiftMaps.ts`
- `gift-mindmap/src/hooks/usePeople.ts`
- `gift-mindmap/src/hooks/useGiftIdeas.ts`

**Context & UI:**
- `gift-mindmap/src/contexts/AuthContext.tsx` - Authentication state
- `gift-mindmap/src/pages/LoginPage.tsx` - Login/register UI
- `gift-mindmap/src/pages/WorkspaceSelector.tsx` - Workspace/gift map selector
- `gift-mindmap/src/App.tsx` - Main app with providers

## 🔧 Configuration

### Environment Setup

Create `.env` file:

```bash
cd gift-mindmap
cp .env.example .env
```

Default configuration:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 🚀 Running the Full Stack

### Terminal 1: Backend API

```bash
cd api

# Install dependencies (first time only)
npm install

# Start database services
docker compose up -d postgres redis

# Setup database (first time only)
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Backend will run on http://localhost:3000

### Terminal 2: Frontend App

```bash
cd gift-mindmap

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

## 🎯 User Flow

1. **Open app** → http://localhost:5173
2. **Login page** appears
3. **Use demo account:**
   - Email: `alice@example.com`
   - Password: `Demo1234!`
4. **Workspace selector** shows workspaces and gift maps
5. **Select a gift map** to start planning
6. **Back to workspaces** button in header

## 📊 Current State

### ✅ Working Features

1. **Authentication Flow**
   - Registration with validation
   - Login with email/password
   - Token-based authentication
   - Automatic token refresh
   - Logout functionality

2. **Workspace Management**
   - List all workspaces
   - Create new workspace
   - View workspace details
   - RBAC (owner/editor/viewer)

3. **Gift Map Management**
   - List gift maps by workspace
   - Create new gift map
   - Filter by year/occasion
   - Gift map selection

4. **API Integration**
   - All 45+ endpoints available
   - React Query caching
   - Automatic cache invalidation
   - Optimistic updates ready
   - Error handling

### 🔨 Next Steps (Phase 4.3)

The following needs to be completed to fully connect the gift planning UI:

#### 1. Update GiftMindMap Component

The `GiftMindMap.tsx` component currently uses Zustand for local state. It needs to be updated to:

**Load data from backend:**
```typescript
interface GiftMindMapProps {
  workspaceId: string;
  giftMapId: string;
}

export default function GiftMindMap({ workspaceId, giftMapId }: GiftMindMapProps) {
  // Load people from backend
  const { data: people, isLoading: peopleLoading } = usePeople(giftMapId);

  // Transform to ReactFlow nodes
  const personNodes = useMemo(() => {
    if (!people) return [];
    return people.map(person => ({
      id: person.id,
      type: 'person',
      position: person.position || { x: 0, y: 0 },
      data: {
        label: person.name,
        ...person
      }
    }));
  }, [people]);

  // ... rest of component
}
```

**Create person:**
```typescript
const createPerson = useCreatePerson();

const handleAddPerson = async (name: string) => {
  try {
    const person = await createPerson.mutateAsync({
      giftMapId,
      data: { name, position: { x: 0, y: 0 } }
    });
    // ReactFlow will re-render with new data from React Query cache
  } catch (error) {
    console.error('Failed to create person:', error);
  }
};
```

**Create gift idea:**
```typescript
const createGiftIdea = useCreateGiftIdea();

const handleAddIdea = async (personId: string, title: string) => {
  try {
    await createGiftIdea.mutateAsync({
      personId,
      data: { title }
    });
  } catch (error) {
    console.error('Failed to create gift idea:', error);
  }
};
```

**Update person position:**
```typescript
const updatePerson = useUpdatePerson();

const handleNodeDrag = (nodeId: string, position: { x: number; y: number }) => {
  // Optimistic update for smooth UX
  updatePerson.mutate({
    personId: nodeId,
    data: { position }
  });
};
```

**Mark as purchased:**
```typescript
const purchaseIdea = usePurchaseGiftIdea();

const handlePurchase = async (giftIdeaId: string) => {
  try {
    await purchaseIdea.mutateAsync(giftIdeaId);
  } catch (error) {
    console.error('Failed to mark as purchased:', error);
  }
};
```

#### 2. Data Transformation

Transform backend data to ReactFlow format:

```typescript
// Backend person → ReactFlow node
function personToNode(person: Person): GiftNode {
  return {
    id: person.id,
    type: 'person',
    position: person.position || { x: 0, y: 0 },
    data: {
      label: person.name,
      email: person.email,
      budgetMin: person.budgetMin,
      budgetMax: person.budgetMax,
      interests: person.interests,
      notes: person.notes,
      color: person.color,
    }
  };
}

// Backend gift idea → ReactFlow node
function giftIdeaToNode(idea: GiftIdea, personPosition: { x: number; y: number }): GiftNode {
  return {
    id: idea.id,
    type: 'idea',
    position: {
      x: personPosition.x + 150,
      y: personPosition.y
    },
    data: {
      title: idea.title,
      description: idea.description,
      price: idea.price,
      status: idea.status,
      url: idea.url,
      priority: idea.priority,
    }
  };
}
```

#### 3. Real-time Position Updates

Debounce position updates to avoid excessive API calls:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const updatePerson = useUpdatePerson();

const debouncedPositionUpdate = useDebouncedCallback(
  (personId: string, position: { x: number; y: number }) => {
    updatePerson.mutate({
      personId,
      data: { position }
    });
  },
  500 // Wait 500ms after last drag
);

const onNodeDragStop = (event: any, node: any) => {
  if (node.type === 'person') {
    debouncedPositionUpdate(node.id, node.position);
  }
};
```

## 🎨 UI Patterns

### Loading States

```typescript
function GiftMindMap({ giftMapId }: Props) {
  const { data: people, isLoading } = usePeople(giftMapId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>Loading gift map...</div>
      </div>
    );
  }

  // ... render component
}
```

### Error Handling

```typescript
const createPerson = useCreatePerson();

const handleCreate = async () => {
  try {
    await createPerson.mutateAsync({ giftMapId, data: { name } });
  } catch (error: any) {
    // Show user-friendly error
    const message = error.response?.data?.error || 'Failed to create person';
    toast.error(message);
  }
};
```

### Optimistic Updates

```typescript
const updatePerson = useUpdatePerson();
const queryClient = useQueryClient();

const handleUpdate = async (personId: string, data: UpdatePersonData) => {
  // Optimistically update UI
  queryClient.setQueryData(
    peopleKeys.detail(personId),
    (old: Person) => ({ ...old, ...data })
  );

  try {
    await updatePerson.mutateAsync({ personId, data });
  } catch (error) {
    // Revert on error
    queryClient.invalidateQueries({ queryKey: peopleKeys.detail(personId) });
    toast.error('Failed to update');
  }
};
```

## 🔐 Permissions

The backend enforces role-based permissions:

| Role | Permissions |
|------|-------------|
| Owner | Full access - can delete workspace/gift maps, manage members |
| Editor | Can create/edit/delete people and gift ideas |
| Viewer | Read-only access, can view but not modify |

Check permissions before showing edit UI:

```typescript
function GiftMapEditor() {
  const { data: workspace } = useWorkspace(workspaceId);
  const { user } = useAuth();

  const canEdit = workspace?.members.some(m =>
    m.userId === user?.id && ['owner', 'editor'].includes(m.role)
  );

  return (
    <div>
      {canEdit ? (
        <Button onClick={handleEdit}>Edit</Button>
      ) : (
        <Badge>Read Only</Badge>
      )}
    </div>
  );
}
```

## 📖 API Reference

### Workspaces

```typescript
// Get all workspaces
const { data: workspaces } = useWorkspaces();

// Create workspace
const create = useCreateWorkspace();
await create.mutateAsync({ name: 'Family Christmas' });

// Invite member
await workspacesService.inviteMember(workspaceId, {
  email: 'friend@example.com',
  role: 'editor'
});
```

### Gift Maps

```typescript
// Get gift maps in workspace
const { data: giftMaps } = useGiftMaps(workspaceId);

// Create gift map
const create = useCreateGiftMap();
await create.mutateAsync({
  workspaceId,
  data: {
    title: 'Christmas 2024',
    year: 2024,
    occasion: 'christmas'
  }
});

// Duplicate gift map
const duplicate = useDuplicateGiftMap();
await duplicate.mutateAsync(giftMapId);
```

### People

```typescript
// Get all people in gift map
const { data: people } = usePeople(giftMapId);

// Create person
const create = useCreatePerson();
await create.mutateAsync({
  giftMapId,
  data: {
    name: 'Mom',
    budgetMin: 50,
    budgetMax: 150,
    interests: ['reading', 'gardening'],
    color: '#f472b6',
    position: { x: 100, y: 100 }
  }
});

// Update person
const update = useUpdatePerson();
await update.mutateAsync({
  personId,
  data: { position: { x: 200, y: 200 } }
});
```

### Gift Ideas

```typescript
// Get gift ideas for person
const { data: ideas } = useGiftIdeas(personId);

// Create gift idea
const create = useCreateGiftIdea();
await create.mutateAsync({
  personId,
  data: {
    title: 'Book',
    price: 29.99,
    url: 'https://example.com/book',
    priority: 1
  }
});

// Mark as purchased
const purchase = usePurchaseGiftIdea();
await purchase.mutateAsync(giftIdeaId);

// Undo purchase
const unpurchase = useUnpurchaseGiftIdea();
await unpurchase.mutateAsync(giftIdeaId);
```

## 🧪 Testing the Integration

1. **Start both servers** (API + Frontend)
2. **Open DevTools** → Network tab
3. **Login** and watch the API calls
4. **Select a gift map** - should load people and ideas
5. **Create a person** - should POST to `/api/v1/gift-maps/:id/people`
6. **Drag a person** - should PATCH to `/api/v1/people/:id`
7. **Mark as purchased** - should POST to `/api/v1/gift-ideas/:id/purchase`

## 🐛 Troubleshooting

### CORS Errors

Backend `.env` should have:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 401 Unauthorized

- Check access token in localStorage
- Token might be expired - try logout/login
- Automatic refresh should handle this

### Network Errors

- Ensure backend is running on port 3000
- Check `VITE_API_URL` in frontend `.env`
- Verify Docker services are running: `docker compose ps`

### Cache Issues

Clear React Query cache:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.clear(); // Clear all caches
```

---

## 🎯 Summary

**Phase 4 Status: 80% Complete**

✅ **Completed:**
- Full API client infrastructure
- All service functions
- React Query hooks
- Authentication flow
- Workspace/gift map selection

🔨 **Remaining:**
- Connect GiftMindMap component to backend hooks
- Transform backend data to ReactFlow format
- Implement real-time position updates

**Estimated time to complete:** 1-2 hours

The hardest part (API infrastructure) is done. The remaining work is primarily connecting the existing UI components to use the React Query hooks instead of the Zustand store.
