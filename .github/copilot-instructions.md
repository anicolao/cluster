# Cluster - Epic Space Strategy Game

## Project Overview

Cluster is an obsessive slow real-time strategy game where players compete to dominate the galaxy. The core gameplay revolves around diplomacy and cooperation, as no single player has the resources to win alone. Players must form alliances, negotiate, and sometimes betray each other to establish a winning coalition.

### Key Game Concepts

- **Slow Real-Time Strategy**: Games progress over extended periods with deliberate pacing
- **Diplomacy-Focused**: Alliance formation and meta-game play are central mechanics
- **Galaxy Domination**: Players compete for territorial and resource control
- **Alliance Mechanics**: Players are incentivized to form different alliances each game
- **Betrayal & Cooperation**: Dynamic relationships between players drive gameplay

## Technology Stack

### Frontend (SvelteKit Application)
- **Framework**: SvelteKit with TypeScript
- **Build Tool**: Vite
- **Styling**: Standard CSS with Svelte component scoping
- **Auth**: Firebase Authentication with Google provider
- **State Management**: Svelte stores + Firebase realtime updates
- **Routing**: SvelteKit file-based routing with (game) and (website) route groups

### Backend (Firebase Cloud Functions)
- **Runtime**: Node.js 18 with TypeScript
- **Functions**: Firebase Cloud Functions for game logic
- **Database**: 
  - Firestore for persistent game data and user profiles
  - Realtime Database for live game state updates
- **Auth**: Firebase Authentication

### Development Tools
- **Linting/Formatting**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest with coverage reporting
- **Package Manager**: npm (with bun.lockb for compatibility)
- **Git Hooks**: Husky for pre-commit checks
- **CI/CD**: Firebase deployment with automated checks

## Architecture Patterns

### Data Models

#### Game State (`functions/src/common/gamestate.ts`)
```typescript
interface GameOptions {
  name: string;
  autospawn: boolean;      // Auto-create similar games when full
  playerCount: number;     // Max players
  playersNeeded: number;   // Min players to start
  started: boolean;
  winner?: string;
  players: { [k: string]: PlayerInfo };
}

interface GameState {
  tick: number;           // Game progression counter
  options: GameOptions;
}
```

#### Game Actions
- `join_game` / `leave_game`: Player lobby management
- `start_game`: Begin gameplay
- `compute_tick`: Advance game state

### Frontend Structure
```
src/
├── lib/                 # Shared utilities
│   ├── auth.ts         # Firebase auth helpers
│   ├── firebase.ts     # Firebase configuration
│   └── store.ts        # Svelte stores
├── routes/
│   ├── (game)/         # Game interface routes
│   │   ├── admin/      # Admin tools
│   │   ├── game/       # Active game view
│   │   ├── lobby/      # Game lobby
│   │   └── profile/    # User profile
│   └── (website)/      # Marketing/info pages
```

### Backend Structure
```
functions/src/
├── common/             # Shared types and utilities
│   ├── gamestate.ts   # Core game data models
│   ├── profiles.ts    # User profile types
│   ├── metagame.ts    # Game creation/deletion
│   └── gamenames.ts   # Game naming utilities
├── game.ts            # Game logic functions
├── profile.ts         # User profile management
├── metagame.ts        # Game lifecycle management
└── index.ts           # Function exports
```

## Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Start Firebase emulators: `firebase emulators:start`
3. Run development server: `npm run dev`
4. Run tests: `npm test`

### Code Quality
- **Linting**: `npm run lint` (Biome)
- **Formatting**: `npm run format` (Biome)
- **Type Checking**: `npm run check` (Svelte + TypeScript)

### Testing Strategy
- **Unit Tests**: Vitest for business logic
- **Integration Tests**: Firebase emulator testing
- **Coverage**: Aim for comprehensive test coverage
- **Test Files**: 
  - Main app: `tests/*.test.ts`
  - Functions: `functions/tests/**/*.test.ts`

### Deployment
- **Build**: `npm run build`
- **Deploy**: `npm run deploy` (Firebase hosting + functions)
- **Environment**: Firebase project configuration

## Coding Conventions

### TypeScript
- Strict type checking enabled
- Prefer interfaces over types for object shapes
- Use proper typing for Firebase operations
- Avoid `any` - use proper types or `unknown`

### Svelte Components
- Use `<script lang="ts">` for TypeScript
- Implement reactive statements with `$:` for state changes
- Use Svelte stores for cross-component state
- Follow Svelte naming conventions for props and events

### Firebase Patterns
- Use Firestore for persistent data (user profiles, game configs)
- Use Realtime Database for live updates (game state, player actions)
- Implement proper error handling for Firebase operations
- Use Firebase Authentication for all user operations

### Game Logic
- Keep game state immutable where possible
- Use action-based state updates
- Implement proper validation for all player actions
- Consider performance for real-time updates

## Common Patterns

### Authentication Flow
```typescript
import { auth, user } from '$lib/auth';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Check if user is authenticated
if ($user) {
  // User is signed in
}
```

### Firestore Operations
```typescript
import { firestore } from '$lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';

// Subscribe to real-time updates
const unsubscribe = onSnapshot(collection(firestore, 'games'), (snapshot) => {
  // Handle updates
});
```

### Game Action Dispatch
```typescript
import { push, ref } from '@firebase/database';
import { realtimeDB } from '$lib/firebase';

const action: GameAction = {
  type: 'join_game',
  uid: userId,
  alias: playerAlias,
  avatar: playerAvatar
};

await push(ref(realtimeDB, `gameActions/${gameId}`), action);
```

## Game-Specific Context

### Core Mechanics
- **Ticks**: Games progress in discrete time units
- **Alliances**: Dynamic player relationships
- **Resources**: Territory and strategic assets
- **Diplomacy**: Negotiation and treaty systems
- **Victory Conditions**: Collaborative winning scenarios

### Player Experience
- **Lobby System**: Game discovery and joining
- **Profile Management**: Player identity and history
- **Real-time Updates**: Live game state synchronization
- **Admin Tools**: Game management and moderation

### Scalability Considerations
- Design for multiple concurrent games
- Optimize for real-time performance
- Consider mobile/responsive design
- Plan for player growth and engagement

## Performance Notes

- Use Svelte's reactivity efficiently
- Minimize Firebase read/write operations
- Implement proper caching strategies
- Consider lazy loading for large datasets
- Use Firebase emulators for development testing

## Security Considerations

- Validate all user inputs
- Use Firebase Security Rules
- Implement proper authentication checks
- Sanitize user-generated content
- Protect against common web vulnerabilities

---

When working on this codebase, remember that Cluster is fundamentally about creating engaging multiplayer experiences that reward strategic thinking, diplomatic skill, and collaborative gameplay. Every feature should enhance the core goal of making alliance formation and meta-game strategy the path to victory.