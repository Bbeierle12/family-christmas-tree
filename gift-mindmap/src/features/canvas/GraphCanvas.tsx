import React from 'react'
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap } from 'reactflow'
import RootNode from '@/features/nodes/RootNode'
import PersonNode from '@/features/nodes/PersonNode'
import IdeaNode from '@/features/nodes/IdeaNode'

const nodeTypes = { root: RootNode, person: PersonNode, idea: IdeaNode } as const

export interface GraphCanvasProps {
  rfRef: any
  nodes: any[]
  edges: any[]
  onNodesChange: any
  onEdgesChange: any
  onConnect: any
  onNodeClick: any
  onMoveEnd?: any
}

export default function GraphCanvas(props: GraphCanvasProps) {
  const { rfRef, nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onMoveEnd } = props
  return (
    <ReactFlow
      ref={rfRef}
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      onMoveEnd={onMoveEnd}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
      <MiniMap pannable zoomable />
      <Controls position="bottom-left" />
    </ReactFlow>
  )
}

