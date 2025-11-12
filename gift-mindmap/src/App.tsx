import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { WorkspaceSelector } from '@/pages/WorkspaceSelector';
import GiftMindMap from '@/components/GiftMindMap.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, isLoading } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<{
    workspaceId: string;
    giftMapId: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!selectedWorkspace) {
    return (
      <WorkspaceSelector
        onSelectGiftMap={(workspaceId, giftMapId) => {
          setSelectedWorkspace({ workspaceId, giftMapId });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <button
          onClick={() => setSelectedWorkspace(null)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to Workspaces
        </button>
        <div className="text-sm text-gray-600">{user.displayName}</div>
      </div>
      <GiftMindMap
        workspaceId={selectedWorkspace.workspaceId}
        giftMapId={selectedWorkspace.giftMapId}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
