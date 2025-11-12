import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Upload, Download, Plus, CheckCircle2, Pencil, Trash2, RefreshCcw, UserPlus, Send, MessageSquare, ChevronDown, ChevronUp, Users, Lock, Eye, EyeOff } from "lucide-react";

/*****************
 * Helper utils  *
 *****************/
// Robust unique-id generator
const uid: (prefix?: string) => string = (() => {
  let i = 0;
  return (prefix = "id") => `${prefix}_${++i}_${Math.random().toString(36).slice(2, 7)}`;
})();

// Simple deterministic color palette for profiles
const PROFILE_COLORS = [
  "#ef4444", // red-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#6b7280", // gray-500
];
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function colorForProfile(id?: string) {
  if (!id) return undefined;
  const idx = hashString(id) % PROFILE_COLORS.length;
  return PROFILE_COLORS[idx];
}

// Family seed (kept for tests; UI visibility now filtered by profile)
const family = [
  "Daniel Beierle",
  "Crystal Beierle",
  "Alyssa Beierle",
  "Bella Beierle",
  "Aleah Beierle",
  "Mike McInnerney",
  "Mike Jr",
  "Maggy",
];

/************************
 * Custom node components
 ************************/
function ColorDot({ color }: { color?: string }) {
  if (!color) return null;
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: color }} />;
}

function RootNode({ data }: any) {
  return (
    <div className="px-4 py-3 bg-white/90 backdrop-blur border rounded-2xl shadow-lg text-center">
      <div className="text-xl font-semibold">{data.label}</div>
      <div className="text-xs text-muted-foreground">Drag, zoom, add ideas. Click nodes to edit.</div>
    </div>
  );
}

function PersonNode({ data }: any) {
  const bought = (data.ideas || []).filter((it: any) => it.status === "purchased").length;
  const borderStyle = data.__color ? { borderLeft: `4px solid ${data.__color}` } : undefined;
  return (
    <div className="bg-white border rounded-2xl shadow p-3 w-64" style={borderStyle}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold truncate max-w-[11rem]" title={data.label}>
          <ColorDot color={data.__color} />{data.label}
        </div>
        {(data.ideas?.length ?? 0) > 0 && (
          <Badge variant={bought ? "default" : "secondary"}>
            {bought}/{(data.ideas || []).length} bought
          </Badge>
        )}
      </div>
      {data.interests && (
        <div className="text-xs text-muted-foreground mt-1 line-clamp-2" title={data.interests}>
          {data.interests}
        </div>
      )}
    </div>
  );
}

function IdeaNode({ data }: any) {
  const borderStyle = data.__color ? { borderLeft: `4px solid ${data.__color}` } : undefined;
  return (
    <div className={`rounded-xl border shadow px-3 py-2 bg-white w-56 ${data.status === "purchased" ? "opacity-70" : ""}`} style={borderStyle}>
      <div className="text-sm font-medium flex items-center gap-2">
        <ColorDot color={data.__color} />
        {data.status === "purchased" ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {data.title || "Idea"}
      </div>
      {data.notes && <div className="text-xs mt-1 text-muted-foreground line-clamp-2">{data.notes}</div>}
    </div>
  );
}

const nodeTypes = { root: RootNode, person: PersonNode, idea: IdeaNode } as const;

/**********************
 * Graph initialization
 **********************/
const initialNodes = ([
  { id: "root", position: { x: 0, y: 0 }, data: { label: "🎄 Christmas 2025 – Gift Map" }, type: "root" },
] as const).concat(
  family.map((name, idx) => ({
    id: `p_${idx}`,
    position: {
      x: Math.cos((idx / family.length) * Math.PI * 2) * 450,
      y: Math.sin((idx / family.length) * Math.PI * 2) * 280,
    },
    data: { label: name, ideas: [] },
    type: "person",
  })) as any
);

const initialEdges = family.map((_, idx) => ({ id: uid("e"), source: "root", target: `p_${idx}`, animated: true }));

function buildSeedGraph() {
  // No pre-seeded gift ideas: start with only root and person nodes
  const nodes: any[] = JSON.parse(JSON.stringify(initialNodes));
  const edges: any[] = JSON.parse(JSON.stringify(initialEdges));
  return { nodes, edges };
}

/*******************
 * Security model (front-end simulated)  *
 *******************/
type Profile = { id: string; name: string; shareWith: string[] };
const LS_KEY = "giftmindmap_profiles_v1";
const LS_PROFILE = "giftmindmap_current_profile_v1";

function loadProfiles(): Profile[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveProfiles(p: Profile[]) { localStorage.setItem(LS_KEY, JSON.stringify(p)); }
function loadCurrentProfile(): string | null { return localStorage.getItem(LS_PROFILE); }
function saveCurrentProfile(id: string) { localStorage.setItem(LS_PROFILE, id); }

/*******************
 * Main component  *
 *******************/
export default function GiftMindMap() {
  const { nodes: seedNodes, edges: seedEdges } = useMemo(buildSeedGraph, []);

  // Core graph state (global list of nodes/edges; visibility filtered per-profile below)
  const [nodes, setNodes, onNodesChange] = useNodesState(seedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seedEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasCollapsed, setCanvasCollapsed] = useState(false);
  const rfRef = useRef<any>(null);

  // Profiles + permissions
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [treeMode, setTreeMode] = useState(false);
  const [treeProfiles, setTreeProfiles] = useState<string[]>([]); // selected profile ids for family tree view

  // ---- FORM STATE FIRST (fix TDZ)
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [personInterests, setPersonInterests] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberInterests, setNewMemberInterests] = useState("");

  // Edit fields (for selected node)
  const [editPersonName, setEditPersonName] = useState("");
  const [editPersonInterests, setEditPersonInterests] = useState("");
  const [editIdeaTitle, setEditIdeaTitle] = useState("");
  const [editIdeaNotes, setEditIdeaNotes] = useState("");

  // Organizer state
  const [peopleQuery, setPeopleQuery] = useState("");
  const [peopleSort, setPeopleSort] = useState<"name" | "ideas" | "purchased">("name");

  // AI Chat state (UI only)
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; text: string }>>([
    { id: uid("m"), role: "assistant", text: "Hi! Profiles are now isolated. Use the Profiles tab to create/switch and share." },
  ]);

  // Boot: ensure at least one profile exists
  useEffect(() => {
    const stored = loadProfiles();
    let cur = loadCurrentProfile();
    if (stored.length === 0) {
      const first: Profile = { id: uid("prof"), name: "Owner", shareWith: [] };
      saveProfiles([first]);
      setProfiles([first]);
      setCurrentProfileId(first.id);
      saveCurrentProfile(first.id);
    } else {
      setProfiles(stored);
      if (cur && stored.some((p) => p.id === cur)) {
        setCurrentProfileId(cur);
      } else {
        setCurrentProfileId(stored[0].id);
        saveCurrentProfile(stored[0].id);
      }
    }
  }, []);

  // Persist profile changes
  useEffect(() => { saveProfiles(profiles); }, [profiles]);
  useEffect(() => { if (currentProfileId) saveCurrentProfile(currentProfileId); }, [currentProfileId]);

  // Derived: which profile IDs are allowed to show
  const allowedProfileIds = useMemo(() => {
    if (!currentProfileId) return new Set<string>();
    if (!treeMode) return new Set<string>([currentProfileId]);
    const mine = new Set<string>([currentProfileId]);
    const curId = currentProfileId;
    for (const pid of treeProfiles) {
      if (pid === curId) { mine.add(pid); continue; }
      const prof = profiles.find((p) => p.id === pid);
      if (prof && prof.shareWith.includes(curId)) mine.add(pid);
    }
    return mine;
  }, [currentProfileId, treeMode, treeProfiles, profiles]);

  // Derived selections
  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedId), [nodes, selectedId]);

  // Filter visibility by allowedProfileIds (root is global) and decorate with colors
  const visibleNodes = useMemo(() => {
    return nodes
      .filter((n) => n.id === "root" || allowedProfileIds.has(n.data?.owner))
      .map((n) => ({ ...n, data: { ...n.data, __color: colorForProfile(n.data?.owner) } }));
  }, [nodes, allowedProfileIds]);

  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    return edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, visibleNodes]);

  // Sync edit inputs when selection changes
  useEffect(() => {
    if (!selectedNode) return;
    if (selectedNode.type === "person") {
      setEditPersonName(selectedNode.data?.label || "");
      setEditPersonInterests(selectedNode.data?.interests || "");
    } else if (selectedNode.type === "idea") {
      setEditIdeaTitle(selectedNode.data?.title || "");
      setEditIdeaNotes(selectedNode.data?.notes || "");
    }
  }, [selectedNode]);

  // ---- Graph mutations ----
  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const addIdeaTo = useCallback(
    (personId: string, idea: any) => {
      const person = nodes.find((n) => n.id === personId);
      if (!person) return;
      // view-only enforcement: only allow adding if the person belongs to current profile
      if (person.data?.owner && person.data.owner !== currentProfileId) return;
      const id = uid("idea");
      const pos = { x: person.position.x + 220 + Math.random() * 100, y: person.position.y + Math.random() * 120 - 60 };
      setNodes((nds) => nds.concat({ id, type: "idea", position: pos, data: { ...idea, status: "planned", owner: currentProfileId } }));
      setEdges((eds) => eds.concat({ id: uid("e"), source: personId, target: id }));
      // store summary on person (optional UI stat)
      setNodes((nds) => nds.map((n) => (n.id === personId ? { ...n, data: { ...n.data, ideas: [...(n.data.ideas || []), { ...idea, status: "planned" }] } } : n)));
    },
    [nodes, setNodes, setEdges, currentProfileId]
  );

  const updateIdea = useCallback((id: string, patch: any) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, []);

  const updatePerson = useCallback((id: string, patch: any) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, []);

  const deleteNode = useCallback((id: string) => {
    const victim = nodes.find((n) => n.id === id);
    if (!victim) return;
    // view-only enforcement: cannot delete nodes you don't own
    if (victim.data?.owner && victim.data.owner !== currentProfileId) return;
    // Remove node and any connected idea nodes if deleting a person
    const toDelete = new Set<string>([id]);
    const isPerson = victim.type === "person";
    if (isPerson) {
      const ideaIds = edges.filter((e) => e.source === id).map((e) => e.target);
      ideaIds.forEach((i) => toDelete.add(i));
    }
    setEdges((eds) => eds.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)));
    setNodes((nds) => nds.filter((n) => !toDelete.has(n.id)));
    setSelectedId(null);
  }, [nodes, edges, currentProfileId]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedId(node.id);
  }, []);

  const exportJSON = useCallback(() => {
    const payload = {
      nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
      edges: edges.map(({ id, source, target }) => ({ id, source, target })),
      updatedAt: new Date().toISOString(),
      profiles,
      currentProfileId,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gift-mindmap-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, profiles, currentProfileId]);

  const importJSON = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(String(reader.result));
          setNodes(payload.nodes || []);
          setEdges(payload.edges || []);
          if (Array.isArray(payload.profiles)) setProfiles(payload.profiles);
          if (payload.currentProfileId) setCurrentProfileId(payload.currentProfileId);
          setSelectedId(null);
        } catch (e) {
          alert("Invalid file");
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges]
  );

  // Profiles helpers
  const createProfile = useCallback(() => {
    const name = newProfileName.trim();
    if (!name) return;
    const p: Profile = { id: uid("prof"), name, shareWith: [] };
    setProfiles((ps) => ps.concat(p));
    setCurrentProfileId(p.id);
    setNewProfileName("");
  }, [newProfileName]);

  const shareWithToggle = useCallback((targetId: string) => {
    if (!currentProfileId) return;
    setProfiles((ps) => ps.map((p) => p.id === currentProfileId
      ? { ...p, shareWith: p.shareWith.includes(targetId) ? p.shareWith.filter((x) => x !== targetId) : p.shareWith.concat(targetId) }
      : p));
  }, [currentProfileId]);

  // ---- Add member (owned by current profile) ----
  const addMember = useCallback(
    (name: string, interests?: string) => {
      if (!name.trim() || !currentProfileId) return;
      const people = nodes.filter((n) => n.type === "person" && allowedProfileIds.has(n.data?.owner));
      const index = people.length;
      const angle = (index / Math.max(people.length + 1, 1)) * Math.PI * 2;
      const pos = { x: Math.cos(angle) * 450, y: Math.sin(angle) * 280 };
      const id = uid("p");
      const personNode = { id, type: "person", position: pos, data: { label: name.trim(), interests: interests || "", ideas: [], owner: currentProfileId } } as any;
      setNodes((nds) => nds.concat(personNode));
      setEdges((eds) => eds.concat({ id: uid("e"), source: "root", target: id, animated: true } as any));
    },
    [nodes, setNodes, setEdges, currentProfileId, allowedProfileIds]
  );

  const handleAddMember = useCallback(() => {
    addMember(newMemberName, newMemberInterests);
    setNewMemberName("");
    setNewMemberInterests("");
  }, [addMember, newMemberName, newMemberInterests]);

  const resetLayout = useCallback(() => {
    const g = buildSeedGraph();
    setNodes(g.nodes);
    setEdges(g.edges);
    setSelectedId(null);
  }, [setNodes, setEdges]);

  const addIdeaFromForm = useCallback(() => {
    if (!selectedNode) return;
    const personId = selectedNode.type === "person" ? selectedNode.id : edges.find((e) => e.target === selectedNode.id)?.source;
    if (!personId) return;
    const parent = nodes.find((n) => n.id === personId);
    if (!parent || (parent.data?.owner && parent.data.owner !== currentProfileId)) return; // view-only enforcement
    const idea = { title: ideaTitle || "New idea", notes: ideaNotes };
    addIdeaTo(personId, idea);
    setIdeaTitle("");
    setIdeaNotes("");
  }, [selectedNode, edges, ideaTitle, ideaNotes, addIdeaTo, nodes, currentProfileId]);

  const togglePurchased = useCallback(() => {
    if (!selectedNode || selectedNode.type !== "idea") return;
    if (selectedNode.data?.owner && selectedNode.data.owner !== currentProfileId) return; // view-only enforcement
    const next = selectedNode.data?.status === "purchased" ? "planned" : "purchased";
    updateIdea(selectedNode.id, { status: next });
  }, [selectedNode, updateIdea, currentProfileId]);

  // Save edits for selected node (view-only enforced)
  const saveEdits = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.data?.owner && selectedNode.data.owner !== currentProfileId) return; // view-only enforcement
    if (selectedNode.type === "person") {
      updatePerson(selectedNode.id, { label: editPersonName, interests: editPersonInterests });
    } else if (selectedNode.type === "idea") {
      updateIdea(selectedNode.id, { title: editIdeaTitle, notes: editIdeaNotes });
    }
  }, [selectedNode, editPersonName, editPersonInterests, editIdeaTitle, editIdeaNotes, updateIdea, updatePerson, currentProfileId]);

  // --- Simple local AI chat handler (no backend) ---
  const [chatHelpCollapsed, setChatHelpCollapsed] = useState(false);
  const sendMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { id: uid("m"), role: "user" as const, text };
    setMessages((m) => m.concat(userMsg));
    setChatInput("");

    // naive command parser: "add idea for <name>: <title> - <notes?>"
    const match = text.match(/^add idea for\s+(.+?):\s*(.+?)(?:\s*-\s*(.+))?$/i);
    if (match) {
      const [, who, title, notes] = match;
      const person = visibleNodes.find((n) => n.type === "person" && String(n.data?.label).toLowerCase() === who.toLowerCase());
      if (person) {
        // view-only enforcement: person must be owned by current profile
        if (person.data?.owner && person.data.owner !== currentProfileId) {
          setMessages((m) => m.concat({ id: uid("m"), role: "assistant", text: `"${who}" is view-only. Switch to their profile to edit.` }));
          return;
        }
        addIdeaTo(person.id, { title, notes });
        setMessages((m) => m.concat({ id: uid("m"), role: "assistant", text: `Added idea for ${who}: ${title}${notes ? ` — ${notes}` : ""}.` }));
        return;
      }
      setMessages((m) => m.concat({ id: uid("m"), role: "assistant", text: `I couldn't find ${who} in the current view. Switch profiles or enable tree mode.` }));
      return;
    }

    // default assistant response
    setMessages((m) => m.concat({ id: uid("m"), role: "assistant", text: "(Demo) I can add ideas if you say: add idea for Bella: cozy socks - ankle length." }));
  }, [chatInput, visibleNodes, addIdeaTo, currentProfileId]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) importJSON(file);
    },
    [importJSON]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Derived: visible people list for organizer
  const visiblePeople = useMemo(() => visibleNodes.filter((n) => n.type === "person"), [visibleNodes]);
  const peopleList = useMemo(() => {
    const q = peopleQuery.trim().toLowerCase();
    let list = visiblePeople.filter((p: any) => !q || String(p.data?.label).toLowerCase().includes(q));
    list = list.map((p: any) => {
      const allIdeas = (p.data?.ideas || []) as any[];
      const purchased = allIdeas.filter((i) => i.status === "purchased").length;
      return { ...p, _stats: { ideas: allIdeas.length, purchased } };
    });
    list.sort((a: any, b: any) => {
      if (peopleSort === "name") return String(a.data?.label).localeCompare(String(b.data?.label));
      if (peopleSort === "ideas") return b._stats.ideas - a._stats.ideas;
      return b._stats.purchased - a._stats.purchased;
    });
    return list;
  }, [visiblePeople, peopleQuery, peopleSort]);

  // Legend profiles (in view)
  const legendProfiles = useMemo(() => {
    const ids = new Set<string>();
    for (const n of visibleNodes) if (n.data?.owner) ids.add(n.data.owner);
    return profiles.filter((p) => ids.has(p.id));
  }, [visibleNodes, profiles]);

  return (
    <TooltipProvider>
      <div className="w-full h-screen flex flex-col gap-3 p-4 bg-gradient-to-br from-emerald-50 to-sky-50" onDrop={onDrop} onDragOver={onDragOver}>
        {/* Main area: permanent sidebar + collapsible canvas */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Canvas column */}
          <div className={`col-span-8 transition-all duration-200 ${canvasCollapsed ? "hidden" : "block"}`}>
            <Card className="h-full overflow-hidden">
              <div className="flex items-center justify-between px-3 pt-3">
                <div className="text-sm text-muted-foreground">Infinity canvas</div>
                <div className="flex items-center gap-3">
                  {/* Profile legend */}
                  <div className="hidden md:flex items-center gap-2">
                    {legendProfiles.map((p) => (
                      <span key={p.id} className="inline-flex items-center text-xs px-2 py-1 rounded-full border bg-white/80" style={{ borderColor: colorForProfile(p.id) }}>
                        <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: colorForProfile(p.id) }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                  <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={resetLayout}><RefreshCcw className="w-4 h-4 mr-1" /> Reset</Button></TooltipTrigger><TooltipContent>Rebuild the default layout</TooltipContent></Tooltip>
                  <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={exportJSON}><Download className="w-4 h-4 mr-1" /> Export</Button></TooltipTrigger><TooltipContent>Export JSON</TooltipContent></Tooltip>
                  <label className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 cursor-pointer text-sm">
                    <Upload className="w-4 h-4 mr-1" /> Import
                    <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importJSON(e.target.files[0])} />
                  </label>
                  <Button size="sm" variant="secondary" onClick={() => setCanvasCollapsed(true)}><ChevronDown className="w-4 h-4 mr-1" /> Hide</Button>
                </div>
              </div>
              <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                <div className="h-full">
                  <ReactFlow
                    ref={rfRef}
                    nodeTypes={nodeTypes}
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={(_, n) => setSelectedId(n.id)}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.2}
                    maxZoom={2}
                    onMoveEnd={(_: any, vp: any) => setZoom(vp.zoom)}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
                    <MiniMap pannable zoomable />
                    <Controls position="bottom-left" />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder when canvas is hidden */}
          {canvasCollapsed && (
            <div className="col-span-8">
              <Card className="h-full">
                <CardContent className="h-full p-6 flex items-center justify-center text-sm text-muted-foreground">
                  Canvas hidden. <Button variant="link" className="ml-2 p-0" onClick={() => setCanvasCollapsed(false)}><ChevronUp className="w-4 h-4 mr-1" /> Show canvas</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sidebar column (permanent) */}
          <div className="col-span-4 h-full overflow-hidden">
            <Card className="h-full overflow-y-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Planner</div>
                  <div className="text-xs text-muted-foreground">Zoom {Math.round(zoom * 100)}%</div>
                </div>

                <Tabs defaultValue="edit">
                  <TabsList className="grid grid-cols-7 gap-1">
                    <TabsTrigger value="profiles"><Users className="w-4 h-4 mr-1" />Profiles</TabsTrigger>
                    <TabsTrigger value="people">People</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="ideas">Add Idea</TabsTrigger>
                    <TabsTrigger value="person">Person</TabsTrigger>
                    <TabsTrigger value="family">Family</TabsTrigger>
                    <TabsTrigger value="map">Map</TabsTrigger>
                  </TabsList>

                  {/* PROFILES TAB: security + permissions + family tree */}
                  <TabsContent value="profiles" className="space-y-3 mt-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Profiles & Permissions</div>
                      <div className="flex gap-2">
                        <Input placeholder="New profile name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
                        <Button onClick={createProfile}>Create</Button>
                      </div>
                      <div className="text-xs text-muted-foreground">Each profile is isolated. Only the owner sees their planning unless sharing is enabled. Sharing is <strong>view-only</strong>.</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Current profile</div>
                      <div className="flex flex-wrap gap-2">
                        {profiles.map((p) => (
                          <Button key={p.id} size="sm" variant={p.id === currentProfileId ? "default" : "outline"} onClick={() => setCurrentProfileId(p.id)}>
                            {p.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> Share current profile with… (view-only)</div>
                      <div className="flex flex-wrap gap-2">
                        {profiles.filter((p) => p.id !== currentProfileId).map((p) => {
                          const shared = profiles.find((x) => x.id === currentProfileId)?.shareWith.includes(p.id);
                          return (
                            <Button key={p.id} size="sm" variant={shared ? "default" : "outline"} onClick={() => shareWithToggle(p.id)}>
                              {p.name} {shared ? <Eye className="w-3 h-3 ml-1" /> : <EyeOff className="w-3 h-3 ml-1" />}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">People you allow here can include your profile in their family tree view.</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">Family Tree on Canvas</div>
                      <div className="flex items-center gap-2">
                        <input id="treeToggle" type="checkbox" className="scale-110" checked={treeMode} onChange={(e) => setTreeMode(e.target.checked)} />
                        <label htmlFor="treeToggle" className="text-sm">Enable family tree view</label>
                      </div>
                      {treeMode && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Select profiles to include (only those that shared with you are selectable).</div>
                          <div className="flex flex-wrap gap-2">
                            {profiles.map((p) => {
                              const canInclude = p.id === currentProfileId || p.shareWith.includes(currentProfileId || "");
                              const active = treeProfiles.includes(p.id);
                              return (
                                <Button key={p.id} size="sm" disabled={!canInclude} variant={active ? "default" : "outline"} onClick={() => setTreeProfiles((s) => active ? s.filter((x) => x !== p.id) : s.concat(p.id))}>
                                  {p.name} {!canInclude && <Lock className="w-3 h-3 ml-1" />}
                                </Button>
                              );
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Canvas now shows the union of selected profiles' people and ideas.</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* EDIT TAB */}
                  <TabsContent value="edit" className="space-y-3 mt-3">
                    {!selectedNode && (
                      <div className="text-sm text-muted-foreground">Click any node on the map to edit.</div>
                    )}

                    {selectedNode?.type === "person" && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Edit Person</div>
                        <Input placeholder="Name" value={editPersonName} onChange={(e) => setEditPersonName(e.target.value)} />
                        <Textarea placeholder="Interests / notes" value={editPersonInterests} onChange={(e) => setEditPersonInterests(e.target.value)} />
                        <div className="flex gap-2">
                          <Button onClick={saveEdits}><Pencil className="w-4 h-4 mr-1" /> Save</Button>
                          <Button variant="destructive" onClick={() => deleteNode(selectedNode.id)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                        </div>
                      </div>
                    )}

                    {selectedNode?.type === "idea" && (
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Edit Idea</div>
                        <Input placeholder="Title" value={editIdeaTitle} onChange={(e) => setEditIdeaTitle(e.target.value)} />
                        <Textarea placeholder="Notes" value={editIdeaNotes} onChange={(e) => setEditIdeaNotes(e.target.value)} />
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={saveEdits}><Pencil className="w-4 h-4 mr-1" /> Save</Button>
                          <Button variant="secondary" onClick={togglePurchased}><CheckCircle2 className="w-4 h-4 mr-1" /> {selectedNode?.data?.status === "purchased" ? "Mark unbought" : "Mark purchased"}</Button>
                          <Button variant="destructive" onClick={() => deleteNode(selectedNode.id)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ADD IDEA TAB */}
                  <TabsContent value="ideas" className="space-y-3 mt-3">
                    <div className="text-sm text-muted-foreground">Select a person (or an idea) on the map, then add a new idea below.</div>
                    <Input placeholder="Idea title" value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} />
                    <Textarea placeholder="Notes / details" value={ideaNotes} onChange={(e) => setIdeaNotes(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={addIdeaFromForm}><Plus className="w-4 h-4 mr-1" /> Add Idea</Button>
                      {selectedNode?.type === "idea" && (
                        <Button variant="secondary" onClick={togglePurchased}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {selectedNode?.data?.status === "purchased" ? "Mark unbought" : "Mark purchased"}
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  {/* PERSON TAB */}
                  <TabsContent value="person" className="space-y-3 mt-3">
                    {selectedNode?.type === "person" ? (
                      <>
                        <div className="text-sm font-medium">{selectedNode?.data?.label}</div>
                        <Textarea placeholder="Interests, sizes, wish list, notes" value={personInterests} onChange={(e) => setPersonInterests(e.target.value)} />
                        <Button onClick={() => updatePerson(selectedNode.id, { interests: personInterests })}><Pencil className="w-4 h-4 mr-1" /> Save details</Button>
                        <div className="text-xs text-muted-foreground">Tip: You can always add ideas from the Ideas tab.</div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Select a person node to edit their interests and notes.</div>
                    )}
                  </TabsContent>

                  {/* FAMILY TAB */}
                  <TabsContent value="family" className="space-y-3 mt-3">
                    <div className="text-sm text-muted-foreground">Add a new family member node connected to the center.</div>
                    <Input placeholder="Full name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                    <Textarea placeholder="Interests / notes (optional)" value={newMemberInterests} onChange={(e) => setNewMemberInterests(e.target.value)} />
                    <Button onClick={handleAddMember}><UserPlus className="w-4 h-4 mr-1" /> Add family member</Button>
                    <div className="text-xs text-muted-foreground">After adding, click their node to start adding ideas.</div>
                  </TabsContent>

                  {/* MAP TAB */}
                  <TabsContent value="map" className="space-y-3 mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={exportJSON}><Download className="w-4 h-4 mr-1" /> Export JSON</Button>
                        </TooltipTrigger>
                        <TooltipContent>Save the whole map to a file.</TooltipContent>
                      </Tooltip>

                      <label className="inline-flex items-center justify-center rounded-md border px-3 py-2 cursor-pointer hover:bg-secondary">
                        <Upload className="w-4 h-4 mr-1" /> Import JSON
                        <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importJSON(e.target.files[0])} />
                      </label>

                      <Button variant="secondary" onClick={resetLayout}><RefreshCcw className="w-4 h-4 mr-1" /> Reset</Button>
                      {selectedNode && <Button variant="destructive" onClick={() => deleteNode(selectedId!)}><Trash2 className="w-4 h-4 mr-1" /> Delete selected</Button>}
                    </div>

                    <div>
                      <div className="text-xs mb-1">Background density</div>
                      <Slider defaultValue={[18]} min={8} max={36} step={1} onValueChange={(v) => {
                        const style = document.documentElement.style;
                        style.setProperty("--rfbg-gap", String(v[0]));
                      }} />
                      <div className="text-xs text-muted-foreground mt-1">Drag & drop a saved JSON file onto the canvas to import.</div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Card className="mt-4">
                  <CardContent className="p-4 space-y-2">
                    <div className="text-sm font-medium">Quick tips</div>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      <li>Profiles are isolated. Use the Profiles tab to switch or share.</li>
                      <li>Enable Family Tree view to see selected, permitted profiles on the canvas.</li>
                      <li>Export includes profiles and current selection.</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom AI Chat */}
        <Card className="border shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" /> AI chat (demo)
              <Button size="sm" variant="link" className="ml-1 p-0" onClick={() => setChatHelpCollapsed((s) => !s)}>{chatHelpCollapsed ? "Show help" : "Hide help"}</Button>
            </div>
            {!chatHelpCollapsed && (
              <div className="text-xs text-muted-foreground mb-2">Try: <code>add idea for Bella: cozy socks - ankle length</code>. Chat operates within the currently visible profiles.</div>
            )}
            <div className="h-36 overflow-y-auto border rounded-lg p-3 bg-white/70">
              {messages.map((m) => (
                <div key={m.id} className={`text-sm mb-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block px-3 py-2 rounded-2xl ${m.role === 'user' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    {m.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input placeholder="Type a message… (e.g., add idea for Bella: cozy socks - ankle length)" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} />
              <Button onClick={sendMessage}><Send className="w-4 h-4 mr-1" /> Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}