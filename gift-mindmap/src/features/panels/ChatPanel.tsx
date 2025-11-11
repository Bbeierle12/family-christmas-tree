import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send } from 'lucide-react'

export interface ChatMessage { id: string; role: 'user' | 'assistant'; text: string }

export interface ChatPanelProps {
  messages: ChatMessage[]
  chatInput: string
  onChatInputChange: (v: string) => void
  onSend: () => void
  helpCollapsed: boolean
  toggleHelp: () => void
}

export default function ChatPanel({ messages, chatInput, onChatInputChange, onSend, helpCollapsed, toggleHelp }: ChatPanelProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <MessageSquare className="w-4 h-4" /> AI chat (demo)
          <Button size="sm" variant="link" className="ml-1 p-0" onClick={toggleHelp}>{helpCollapsed ? 'Show help' : 'Hide help'}</Button>
        </div>
        {!helpCollapsed && (
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
          <Input placeholder="Type a message. (e.g., add idea for Bella: cozy socks - ankle length)" value={chatInput} onChange={(e) => onChatInputChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }} />
          <Button onClick={onSend}><Send className="w-4 h-4 mr-1" /> Send</Button>
        </div>
      </CardContent>
    </Card>
  )
}

