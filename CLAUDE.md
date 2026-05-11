# Sprite Forge

Sprite Forge is a React + Vite + TypeScript application for sprite sheet processing.

## Development

- Start dev server: `npm run dev`
- Run tests: `npm test`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## Project Structure

- `src/pipeline/` - Pipeline stages (generate, split, align, arrange, preview, export)
- `src/components/` - React components (layout, canvas, common)
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/store/` - Zustand state management
- `src/__tests__/` - Vitest tests

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Zustand for state management
- @dnd-kit for drag-and-drop
- Vitest + Testing Library for testing
