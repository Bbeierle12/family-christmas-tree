Refactor overview

This project was refactored to separate concerns and introduce a typed state store. Key modules:

- src/types/gift.ts — Core domain types (profiles, nodes, edges, export format)
- src/store/giftStore.ts — Zustand store with typed actions and React Flow change handlers
- src/store/selectors.ts — Small helpers for profile colors and filtered views
- src/lib/uid.ts, src/lib/colors.ts, src/lib/layout.ts — Utilities
- src/lib/schema.ts — Zod schemas and JSON parsing for import/export
- src/features/nodes/* — Custom React Flow nodes (Root, Person, Idea)

Migration notes

- Component GiftMindMap now reads graph and profile state from the store.
- Profiles and tree selection are store-backed; local boot/persist effects were removed.
- Import uses zod validation and hydrates the store.
- Node components were extracted; React Flow still renders inside GiftMindMap for now.

Next enhancements

- Extract canvas and panels into separate feature components (GraphCanvas, TopBar, SideTabs, ChatPanel, Legend).
- Swap UI stubs for official shadcn/ui components.
- Add undo/redo to the store if desired.

