import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGiftMapData } from '@/hooks/useGiftMapData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, Trash2, Pencil, CheckCircle2 } from 'lucide-react';

interface GiftMapCanvasProps {
  giftMapId: string;
}

export default function GiftMapCanvas({ giftMapId }: GiftMapCanvasProps) {
  const { data, mutations } = useGiftMapData(giftMapId);
  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Form state
  const [personName, setPersonName] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaNotes, setIdeaNotes] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Sync backend data to local state
  useEffect(() => {
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [data.nodes, data.edges, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setEditMode(false);

    if (node.type === 'idea') {
      setIdeaTitle(node.data.title || '');
      setIdeaNotes(node.data.notes || '');
    }
  }, []);

  // Handle node drag end (update position in backend)
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    if (node.type === 'person') {
      mutations.updatePersonPosition(node.id, node.position);
    }
  }, [mutations]);

  // Handle connection
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  // Add person
  const handleAddPerson = async () => {
    if (!personName.trim()) return;

    try {
      // Calculate position in a circle
      const angle = (nodes.filter(n => n.type === 'person').length / 8) * Math.PI * 2;
      const radius = 300;
      const position = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };

      await mutations.createPerson(personName, { position });
      setPersonName('');
    } catch (error) {
      console.error('Failed to create person:', error);
      alert('Failed to create person. Please try again.');
    }
  };

  // Add gift idea
  const handleAddIdea = async () => {
    if (!selectedNode || selectedNode.type !== 'person') {
      alert('Please select a person first');
      return;
    }

    if (!ideaTitle.trim()) return;

    try {
      await mutations.createGiftIdea(selectedNode.id, ideaTitle, {
        description: ideaNotes || undefined
      });
      setIdeaTitle('');
      setIdeaNotes('');
    } catch (error) {
      console.error('Failed to create gift idea:', error);
      alert('Failed to create gift idea. Please try again.');
    }
  };

  // Update gift idea
  const handleUpdateIdea = async () => {
    if (!selectedNode || selectedNode.type !== 'idea') return;

    try {
      await mutations.updateGiftIdea(selectedNode.id, {
        title: ideaTitle,
        description: ideaNotes || undefined
      });
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update gift idea:', error);
      alert('Failed to update gift idea. Please try again.');
    }
  };

  // Toggle purchased status
  const handleTogglePurchased = async () => {
    if (!selectedNode || selectedNode.type !== 'idea') return;

    try {
      const isPurchased = selectedNode.data.status === 'purchased';
      if (isPurchased) {
        await mutations.unpurchaseGiftIdea(selectedNode.id);
      } else {
        await mutations.purchaseGiftIdea(selectedNode.id);
      }
    } catch (error) {
      console.error('Failed to toggle purchase status:', error);
      alert('Failed to update purchase status. Please try again.');
    }
  };

  // Delete node
  const handleDelete = async () => {
    if (!selectedNode || selectedNode.id === 'root') return;

    if (!confirm(`Are you sure you want to delete this ${selectedNode.type}?`)) {
      return;
    }

    try {
      if (selectedNode.type === 'person') {
        await mutations.deletePerson(selectedNode.id);
      } else if (selectedNode.type === 'idea') {
        await mutations.deleteGiftIdea(selectedNode.id);
      }
      setSelectedNode(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  // Loading state
  if (data.isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-lg">Loading gift map...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex">
      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Sidebar */}
      <div className="w-80 border-l bg-white overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Add Person */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Add Person</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Person name"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                />
                <Button onClick={handleAddPerson} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Person
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selected Node */}
          {selectedNode && selectedNode.id !== 'root' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold capitalize">{selectedNode.type}</h3>
                  <div className="flex gap-1">
                    {selectedNode.type === 'idea' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleTogglePurchased}
                      >
                        {selectedNode.data.status === 'purchased' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    {selectedNode.type === 'idea' && !editMode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditMode(true)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDelete}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {selectedNode.type === 'person' && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-lg">{selectedNode.data.label}</div>
                    </div>
                    {selectedNode.data.interests && (
                      <div>
                        <div className="text-sm font-medium">Interests</div>
                        <div className="text-sm text-gray-600">
                          {selectedNode.data.interests}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === 'idea' && (
                  <div className="space-y-2">
                    {editMode ? (
                      <>
                        <Input
                          placeholder="Idea title"
                          value={ideaTitle}
                          onChange={(e) => setIdeaTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="Notes"
                          value={ideaNotes}
                          onChange={(e) => setIdeaNotes(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateIdea} size="sm">
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditMode(false)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-lg font-medium">
                            {selectedNode.data.title}
                          </div>
                          {selectedNode.data.status === 'purchased' && (
                            <Badge className="mt-1 bg-green-600">
                              Purchased
                            </Badge>
                          )}
                        </div>
                        {selectedNode.data.notes && (
                          <div className="text-sm text-gray-600">
                            {selectedNode.data.notes}
                          </div>
                        )}
                        {selectedNode.data.price && (
                          <div className="text-sm font-medium">
                            ${selectedNode.data.price}
                          </div>
                        )}
                        {selectedNode.data.url && (
                          <a
                            href={selectedNode.data.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Product →
                          </a>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add Gift Idea */}
          {selectedNode && selectedNode.type === 'person' && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3">
                  Add Gift Idea for {selectedNode.data.label}
                </h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Gift idea title"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Notes (optional)"
                    value={ideaNotes}
                    onChange={(e) => setIdeaNotes(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddIdea} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Gift Idea
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>People:</span>
                  <span className="font-medium">
                    {nodes.filter(n => n.type === 'person').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Gift Ideas:</span>
                  <span className="font-medium">
                    {nodes.filter(n => n.type === 'idea').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Purchased:</span>
                  <span className="font-medium text-green-600">
                    {nodes.filter(n => n.type === 'idea' && n.data.status === 'purchased').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
