import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow from "reactflow";
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
import { useGiftStore } from "@/store/giftStore";
import { parseExportJSON } from "@/lib/schema";
import { colorForProfile } from "@/lib/colors";
import GraphCanvas from '@/features/canvas/GraphCanvas'
import ChatPanel from '@/features/panels/ChatPanel'
import SideTabs from '@/features/panels/SideTabs'
import TopBar from '@/features/panels/TopBar'

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

/**********************
 * Custom node components
 ************************/
const nodeTypes = undefined as any;

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
  
  // ReactFlow ref
  const rfRef = useRef<any>(null);

  // Graph state now provided by the store
  const nodes = useGiftStore((s) => s.nodes);
  const edges = useGiftStore((s) => s.edges);
  const onNodesChange = useGiftStore((s) => s.onNodesChange);
  const onEdgesChange = useGiftStore((s) => s.onEdgesChange);
  const onConnectStore = useGiftStore((s) => s.onConnect);
  const selectedId = useGiftStore((s) => s.selectedId);
  const selectNodeStore = useGiftStore((s) => s.selectNode);
  const [zoom, setZoom] = useState(1);
  const [canvasCollapsed, setCanvasCollapsed] = useState(false);
  

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      if (!isMod) return
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        useGiftStore.getState().undo()
      } else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || (e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        useGiftStore.getState().redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Profiles + permissions (store-backed)
  const profiles = useGiftStore((s) => s.profiles);
  const currentProfileId = useGiftStore((s) => s.currentProfileId);
  const setCurrentProfile = useGiftStore((s) => s.setCurrentProfile);
  const addProfileStore = useGiftStore((s) => s.addProfile);
  const shareWithToggleStore = useGiftStore((s) => s.shareWithToggle);
  const treeMode = useGiftStore((s) => s.treeMode);
  const setTreeMode = useGiftStore((s) => s.setTreeMode);
  const treeProfiles = useGiftStore((s) => s.treeProfiles);
  const setTreeProfiles = useGiftStore((s) => s.setTreeProfiles);
  const importState = useGiftStore((s) => s.importState);
  const [newProfileName, setNewProfileName] = useState("");

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

  // Profiles are now initialized and persisted via the central store (no local boot/persist effects)

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
  // Store actions
  const addIdeaStore = useGiftStore((s) => s.addIdea);
  const updateIdeaStore = useGiftStore((s) => s.updateIdea);
  const updatePersonStore = useGiftStore((s) => s.updatePerson);
  const deleteNodeStore = useGiftStore((s) => s.deleteNode);
  const addPersonStore = useGiftStore((s) => s.addPerson);

  const onConnect = useCallback((params: any) => onConnectStore(params), [onConnectStore]);

  const addIdeaTo = useCallback((personId: string, idea: any) => {
  const person = nodes.find((n) => n.id === personId);
  if (!person) return;
  if (person.data?.owner && person.data.owner !== currentProfileId) return;
  addIdeaStore(currentProfileId || undefined, personId, idea.title || "Idea", idea.notes || undefined);
}, [nodes, currentProfileId, addIdeaStore]);

const updateIdea = useCallback((id: string, patch: any) => {
  updateIdeaStore(id, patch);
}, [updateIdeaStore]);

const updatePerson = useCallback((id: string, patch: any) => {
  updatePersonStore(id, patch);
}, [updatePersonStore]);

const deleteNode = useCallback((id: string) => {
  const victim = nodes.find((n) => n.id === id);
  if (!victim) return;
  if (victim.data?.owner && victim.data.owner !== currentProfileId) return;
  deleteNodeStore(id);
  selectNodeStore(undefined as any);
}, [nodes, currentProfileId, deleteNodeStore, selectNodeStore]);
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
          const json = String(reader.result)
          const res = parseExportJSON(json)
          if (res.ok) {
            importState(res.data)
            selectNodeStore(undefined as any)
          } else {
            alert("Invalid file: " + res.error)
          }
        } catch (e) {
          alert("Invalid file")
        }
      };
      reader.readAsText(file);
    },
    [importState, selectNodeStore]
  );

  // Profiles helpers
  const createProfile = useCallback(() => {
    const name = newProfileName.trim();
    if (!name) return;
    const id = addProfileStore(name);
    setCurrentProfile(id);
    setNewProfileName("");
  }, [newProfileName, addProfileStore, setCurrentProfile]);

  const shareWithToggle = useCallback((targetId: string) => {
    if (!currentProfileId) return;
    shareWithToggleStore(targetId);
  }, [currentProfileId, shareWithToggleStore]);

  // ---- Add member (owned by current profile) ----
  const addMember = useCallback(
    (name: string, interests?: string) => {
      if (!name.trim() || !currentProfileId) return;
      addPersonStore(currentProfileId, name.trim(), interests || "");
    },
    [currentProfileId, addPersonStore]
  );

  const handleAddMember = useCallback(() => {
    addMember(newMemberName, newMemberInterests);
    setNewMemberName("");
    setNewMemberInterests("");
  }, [addMember, newMemberName, newMemberInterests]);

  const resetLayout = useCallback(() => {
    // store handles radial layout
    useGiftStore.getState().resetLayout();
    selectNodeStore(undefined as any);
  }, [selectNodeStore]);

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
    const next = selectedNode.data?.status === "purchased" ? "pending" : "purchased";
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
      <div className="w-full h-[86vh] flex flex-col gap-3 p-4 bg-gradient-to-br from-emerald-50 to-sky-50" onDrop={onDrop} onDragOver={onDragOver}>
        {/* Main area: permanent sidebar + collapsible canvas */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Canvas column */}
          <div className={`col-span-8 transition-all duration-200 ${canvasCollapsed ? "hidden" : "block"}`}>
            <Card className="h-full overflow-hidden">
              <div className="flex items-center justify-between px-3 pt-3">
              <TopBar
                legend={legendProfiles.map((p) => ({ id: p.id, name: p.name, color: colorForProfile(p.id) || '#6b7280' }))}
                onReset={resetLayout}
                onExport={exportJSON}
                onImport={importJSON}
                onUndo={useGiftStore.getState().undo}
                onRedo={useGiftStore.getState().redo}
                canUndo={useGiftStore((s)=>s.past.length>0)}
                canRedo={useGiftStore((s)=>s.future.length>0)}
                onHideCanvas={() => setCanvasCollapsed(true)}
              />
              </div>
              <CardContent className="p-0 h-[calc(100%-2.75rem)]">
                <div className="h-full">
                  <GraphCanvas rfRef={rfRef} nodes={visibleNodes} edges={visibleEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, n) => selectNodeStore(n.id)} onMoveEnd={(_: any, vp: any) => setZoom(vp.zoom)} />
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

                <SideTabs
                  profiles={profiles as any}
                  currentProfileId={currentProfileId as any}
                  newProfileName={newProfileName}
                  setNewProfileName={setNewProfileName}
                  createProfile={createProfile}
                  shareWithToggle={shareWithToggle}
                  treeMode={treeMode}
                  setTreeMode={setTreeMode}
                  treeProfiles={treeProfiles}
                  setTreeProfiles={setTreeProfiles}
                  selectedNode={selectedNode as any}
                  selectedId={selectedId as any}
                  editPersonName={editPersonName}
                  setEditPersonName={setEditPersonName}
                  editPersonInterests={editPersonInterests}
                  setEditPersonInterests={setEditPersonInterests}
                  editIdeaTitle={editIdeaTitle}
                  setEditIdeaTitle={setEditIdeaTitle}
                  editIdeaNotes={editIdeaNotes}
                  setEditIdeaNotes={setEditIdeaNotes}
                  saveEdits={saveEdits}
                  deleteNode={deleteNode}
                  togglePurchased={togglePurchased}
                  ideaTitle={ideaTitle}
                  setIdeaTitle={setIdeaTitle}
                  ideaNotes={ideaNotes}
                  setIdeaNotes={setIdeaNotes}
                  addIdeaFromForm={addIdeaFromForm}
                  newMemberName={newMemberName}
                  setNewMemberName={setNewMemberName}
                  newMemberInterests={newMemberInterests}
                  setNewMemberInterests={setNewMemberInterests}
                  handleAddMember={handleAddMember}
                  exportJSON={exportJSON}
                  importJSON={importJSON}
                  resetLayout={resetLayout}
                  setCurrentProfile={setCurrentProfile as any}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom AI Chat */}
        <ChatPanel
          messages={messages as any}
          chatInput={chatInput}
          onChatInputChange={setChatInput}
          onSend={sendMessage}
          helpCollapsed={chatHelpCollapsed}
          toggleHelp={() => setChatHelpCollapsed((s) => !s)}
        />
      </div>
    </TooltipProvider>
  );
}
