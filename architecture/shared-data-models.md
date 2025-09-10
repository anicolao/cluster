# Shared Data Models

## Overview

The shared data models define the core TypeScript interfaces and types used throughout the Cluster application. These models are shared between the frontend SvelteKit application and the backend Firebase Functions, ensuring type safety and consistency across the entire system.

## Core Data Models

### Game State Models (`gamestate.ts`)

The game state models define the structure of game data and the actions that can be performed on games.

```typescript
interface GameOptions {
  name: string;
  autospawn: boolean;      // Auto-create similar games when full
  playerCount: number;     // Max players allowed
  playersNeeded: number;   // Min players needed to start
  started: boolean;        // Whether game has begun
  deleted?: boolean;       // Soft deletion flag
  winner?: string;         // UID of winning player
  players: { [k: string]: PlayerInfo };
}

interface PlayerInfo {
  uid: string;    // Firebase Auth user ID
  alias: string;  // Display name
  avatar: string; // Avatar image identifier
}

interface GameState {
  tick: number;          // Game progression counter
  options: GameOptions;  // Game configuration and metadata
}
```

### Game Actions

Game actions represent all possible player interactions with a game:

```typescript
// Player joins a game
interface JoinGameAction {
  type: "join_game";
  uid: string;
  alias: string;
  avatar: string;
}

// Player leaves a game
interface LeaveGameAction {
  type: "leave_game";
  uid: string;
}

// Start the game (when enough players)
interface StartGameAction {
  type: "start_game";
}

// Advance game simulation by one tick
interface ComputeTickGameAction {
  type: "compute_tick";
}

type GameAction = JoinGameAction | LeaveGameAction | StartGameAction | ComputeTickGameAction;
```

### User Profile Models (`profiles.ts`)

User profiles manage player identity and preferences:

```typescript
interface UserProfile {
  alias: string;         // Player display name
  profile_image: string; // Avatar image URL or identifier
  games: string[];       // List of game IDs player is participating in
}

interface ProfileAction {
  type: string;
  alias?: string;         // New alias to set
  profile_image?: string; // New avatar to set
}
```

### Metagame Models (`metagame.ts`)

Metagame actions handle game lifecycle management:

```typescript
// Create a new game
interface CreateGameAction {
  type: "create_game";
  gameOptions: GameOptions;
}

// Delete an existing game
interface DeleteGameAction {
  type: "delete_game";
  gameid: string;
}

type MetaGameAction = CreateGameAction | DeleteGameAction;
```

## Data Flow Patterns

### Action-Based Updates

All state changes in Cluster follow an action-based pattern:

1. **Action Dispatch**: Actions are pushed to Firebase Realtime Database
2. **Function Trigger**: Firebase Functions respond to new actions
3. **State Computation**: Functions compute new state based on action and current state
4. **State Persistence**: Updated state is written back to database
5. **Client Sync**: All connected clients receive updated state

### Immutable State Updates

State updates maintain immutability:

```typescript
function game(gamestate: GameState, action: GameAction) {
  const nextstate = { ...gamestate };
  
  if (action.type === "join_game") {
    // Create new nested objects rather than mutating
    nextstate.options = { ...nextstate.options };
    nextstate.options.players = { ...nextstate.options.players };
    nextstate.options.players[action.uid] = {
      uid: action.uid,
      alias: action.alias,
      avatar: action.avatar
    };
  }
  
  return nextstate;
}
```

### Type Safety

TypeScript discriminated unions ensure type safety:

```typescript
// Type narrowing based on action.type
function processAction(action: GameAction) {
  switch (action.type) {
    case "join_game":
      // TypeScript knows action has uid, alias, avatar properties
      return handleJoinGame(action);
    case "leave_game":
      // TypeScript knows action has uid property
      return handleLeaveGame(action);
    case "start_game":
      // TypeScript knows action has no additional properties
      return handleStartGame(action);
    case "compute_tick":
      // TypeScript knows action has no additional properties
      return handleComputeTick(action);
  }
}
```

## Game Logic Functions

### Game State Initialization

```typescript
function initialGameState(options: GameOptions): GameState {
  return {
    tick: 0,
    options,
  };
}
```

### Game State Queries

```typescript
function gameOver(gamestate: GameState): boolean {
  return gamestate.options.winner !== undefined;
}
```

### Game State Transitions

The main game state reducer handles all action types:

```typescript
function game(gamestate: GameState, action: GameAction): GameState {
  // Handle join_game: Add player to game
  // Handle leave_game: Remove player from game  
  // Handle start_game: Begin game if enough players
  // Handle compute_tick: Advance game simulation
}
```

## Utility Functions

### Game Naming (`gamenames.ts`)

Automatic generation of unique, thematic game names:

```typescript
function randomName(): string {
  // Combines random adjectives with ancient place names
  // Examples: "Ancient Aballava", "Golden Rome", "Fast Byzantium"
}
```

## Database Schema Integration

### Firestore Collections

- `games/`: Persistent game configurations (GameOptions)
- `users/`: User authentication and profile data
- `profiles/`: User profile details (UserProfile)

### Realtime Database Paths

- `gameActions/{gameId}/`: Game action queue
- `games/{gameId}/`: Live game state
- `users/{uid}/profile/`: Profile update actions
- `users/{uid}/games/`: Metagame actions

## Error Handling

### Validation Patterns

```typescript
// Validate required fields
if (!action.uid || !action.alias) {
  throw new Error("Invalid join_game action: missing required fields");
}

// Validate game state constraints
if (gamestate.options.players[action.uid]) {
  // Player already in game - handle gracefully
  return gamestate;
}
```

### Graceful Degradation

- Missing optional fields default to sensible values
- Invalid actions are logged but don't crash the system
- State transitions are atomic and consistent

## Performance Considerations

### Minimal State Changes

- Only modified portions of state are updated
- Immutable updates enable efficient change detection
- Firebase listeners only fire for actual changes

### Efficient Serialization

- Simple data structures serialize efficiently
- No circular references or complex objects
- Optimized for Firebase's JSON transport

## Testing Strategy

### Unit Tests

- Test each action type in isolation
- Verify state transitions are correct
- Test edge cases and error conditions

### Integration Tests

- Test action dispatch and processing pipeline
- Verify database schema matches type definitions
- Test real-time synchronization behavior

---

*These data models form the foundation of the Cluster application, providing type safety, consistency, and a clear contract between frontend and backend components.*