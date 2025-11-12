import { useState } from 'react';
import { useWorkspaces, useCreateWorkspace } from '@/hooks/useWorkspaces';
import { useGiftMaps, useCreateGiftMap } from '@/hooks/useGiftMaps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface WorkspaceSelectorProps {
  onSelectGiftMap: (workspaceId: string, giftMapId: string) => void;
}

export function WorkspaceSelector({ onSelectGiftMap }: WorkspaceSelectorProps) {
  const { user, logout } = useAuth();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>();
  const { data: giftMaps, isLoading: giftMapsLoading } = useGiftMaps(
    selectedWorkspaceId || '',
    undefined
  );

  const createWorkspace = useCreateWorkspace();
  const createGiftMap = useCreateGiftMap();

  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [showNewGiftMap, setShowNewGiftMap] = useState(false);
  const [giftMapTitle, setGiftMapTitle] = useState('');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const workspace = await createWorkspace.mutateAsync({
        name: workspaceName,
      });
      setWorkspaceName('');
      setShowNewWorkspace(false);
      setSelectedWorkspaceId(workspace.id);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleCreateGiftMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) return;

    try {
      const giftMap = await createGiftMap.mutateAsync({
        workspaceId: selectedWorkspaceId,
        data: {
          title: giftMapTitle,
          year: new Date().getFullYear(),
          occasion: 'christmas',
        },
      });
      setGiftMapTitle('');
      setShowNewGiftMap(false);
      onSelectGiftMap(selectedWorkspaceId, giftMap.id);
    } catch (error) {
      console.error('Failed to create gift map:', error);
    }
  };

  if (workspacesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎄 Gift Map</h1>
            <p className="text-gray-600">Welcome, {user?.displayName}!</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sign Out
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Workspaces */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Workspaces</h2>
              <Button
                size="sm"
                onClick={() => setShowNewWorkspace(true)}
                disabled={showNewWorkspace}
              >
                + New
              </Button>
            </div>

            {showNewWorkspace && (
              <Card className="p-4 mb-4">
                <form onSubmit={handleCreateWorkspace} className="space-y-3">
                  <Input
                    placeholder="Workspace name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={createWorkspace.isPending}
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewWorkspace(false);
                        setWorkspaceName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="space-y-2">
              {workspaces?.map((workspace) => (
                <Card
                  key={workspace.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedWorkspaceId === workspace.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                >
                  <h3 className="font-medium">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {workspace.description}
                    </p>
                  )}
                </Card>
              ))}
              {workspaces?.length === 0 && !showNewWorkspace && (
                <div className="text-center py-8 text-gray-500">
                  <p>No workspaces yet</p>
                  <p className="text-sm">Create one to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Gift Maps */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gift Maps</h2>
              <Button
                size="sm"
                onClick={() => setShowNewGiftMap(true)}
                disabled={!selectedWorkspaceId || showNewGiftMap}
              >
                + New
              </Button>
            </div>

            {!selectedWorkspaceId ? (
              <div className="text-center py-12 text-gray-500">
                <p>Select a workspace to view gift maps</p>
              </div>
            ) : (
              <>
                {showNewGiftMap && (
                  <Card className="p-4 mb-4">
                    <form onSubmit={handleCreateGiftMap} className="space-y-3">
                      <Input
                        placeholder="Gift map title (e.g., Christmas 2024)"
                        value={giftMapTitle}
                        onChange={(e) => setGiftMapTitle(e.target.value)}
                        required
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={createGiftMap.isPending}
                        >
                          Create
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowNewGiftMap(false);
                            setGiftMapTitle('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {giftMapsLoading ? (
                  <div className="text-center py-8">Loading gift maps...</div>
                ) : (
                  <div className="space-y-2">
                    {giftMaps?.map((giftMap) => (
                      <Card
                        key={giftMap.id}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          onSelectGiftMap(selectedWorkspaceId, giftMap.id)
                        }
                      >
                        <h3 className="font-medium">{giftMap.title}</h3>
                        <div className="flex gap-2 mt-1 text-sm text-gray-600">
                          {giftMap.year && <span>{giftMap.year}</span>}
                          {giftMap.occasion && (
                            <span className="capitalize">{giftMap.occasion}</span>
                          )}
                        </div>
                      </Card>
                    ))}
                    {giftMaps?.length === 0 && !showNewGiftMap && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No gift maps yet</p>
                        <p className="text-sm">Create one to start planning!</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
