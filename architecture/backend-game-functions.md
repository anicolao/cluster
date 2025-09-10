# Backend Game Functions

## Overview

The backend game functions implement the core game logic, state management, and real-time processing for the Cluster game. Built on Firebase Cloud Functions, these serverless functions handle game actions, state persistence, and automated game progression.

## Core Functions

### Game Action Processing (`game.ts`)

The primary function for handling real-time game actions from players.

#### `executeGameAction(gameid: string, action: GameAction)`

Processes individual game actions and updates game state:

```typescript
export async function executeGameAction(gameid: string, action: GameAction) {
  // 1. Load current game state
  const gamestate = await getGameState(gameid);
  
  // 2. Compute new state based on action
  const nextstate = game(gamestate, action);
  
  // 3. Generate diff patch for efficient updates
  const p = diff(gamestate, nextstate) as GameState;
  
  // 4. Update Firestore if game options changed
  if (p?.options !== undefined) {
    const db = admin.firestore();
    const gameDoc = db.doc(`/games/${gameid}`);
    await gameDoc.set(nextstate.options);
  }
  
  // 5. Write patch to game state history
  return writePatch(gameid, p);
}
```

**Supported Actions:**
- `join_game`: Add player to game
- `leave_game`: Remove player from game  
- `start_game`: Begin game when requirements met
- `compute_tick`: Advance game simulation

#### State Persistence Strategy

Game state uses a novel patch-based persistence system:

```typescript
async function writePatch(gameid: string, p: Patch) {
  // Patches are stored in timestamped blocks
  // This enables:
  // - Efficient incremental updates
  // - Complete state reconstruction
  // - Audit trail of all changes
  // - Block-based storage optimization
}

async function getGameState(gameid: string) {
  // Reconstruct current state by applying all patches
  // in chronological order from stored blocks
}
```

**Benefits:**
- **Efficient Storage**: Only changes are stored, not full state
- **Audit Trail**: Complete history of all game changes
- **Scalability**: Block-based storage handles long games
- **Recovery**: State can be reconstructed from any point

### Scheduled Game Updates (`updateGames`)

Automated function that runs every 15 minutes to advance all active games:

```typescript
export async function updateGames() {
  const db = admin.firestore();
  const games = db.collection('/games');
  const snapshot = await games.get();
  
  for (const game of snapshot.docs) {
    const gameOptions = game.data();
    
    if (gameOptions.started) {
      // Advance active games by one tick
      await executeGameAction(game.id, { type: "compute_tick" });
    } else if (gameOptions.playersNeeded === 0) {
      // Start games that have enough players
      await executeGameAction(game.id, { type: "start_game" });
      
      if (gameOptions.autospawn) {
        // Create replacement game for autospawn games
        await createGame({
          name: randomName(),
          autospawn: true,
          playerCount: gameOptions.playerCount,
          playersNeeded: gameOptions.playerCount,
          players: {},
        });
      }
    }
  }
}
```

**Scheduled Tasks:**
- **Game Progression**: Advance ticks for active games
- **Auto-Start**: Begin games when player requirements met
- **Auto-Spawn**: Create replacement games for full lobbies
- **Cleanup**: Handle game lifecycle management

## Profile Management (`profile.ts`)

Handles user profile updates and synchronization.

### `processProfileAction(path: string, action: ProfileAction)`

Updates user profiles based on profile actions:

```typescript
export async function processProfileAction(path: string, action: ProfileAction) {
  const db = admin.firestore();
  const timestamp = FieldValue.serverTimestamp();
  
  const profile: Profile = { timestamp };
  
  // Update specific profile fields
  if (action.alias) {
    profile.alias = action.alias;
  }
  if (action.profile_image) {
    profile.profile_image = action.profile_image;
  }
  
  // Upsert profile document
  const profileSnapshot = await db.doc(path).get();
  if (profileSnapshot.exists) {
    return db.doc(path).update({ ...profile });
  }
  return db.doc(path).set(profile);
}
```

**Profile Fields:**
- `alias`: Player display name
- `profile_image`: Avatar image identifier
- `timestamp`: Last update timestamp

## Metagame Functions (`metagame.ts`)

Manages game lifecycle operations - creation and deletion.

### `createGame(options: GameOptions)`

Creates new game instances:

```typescript
export async function createGame(options: GameOptions) {
  const db = admin.firestore();
  const gameDoc = db.collection("/games").doc();
  
  return gameDoc.set({
    ...options,
    playersNeeded: options.playerCount,  // Initialize players needed
    started: false,                      // Games start inactive
    players: {},                         // Empty player roster
  });
}
```

### `deleteGame(gameid: string)`

Soft-deletes games by marking them as deleted:

```typescript
export async function deleteGame(gameid: string) {
  const db = admin.firestore();
  const gameDoc = db.doc(`/games/${gameid}`);
  return gameDoc.update({ deleted: true });
}
```

## Function Triggers

All functions are triggered by Firebase Realtime Database events:

### Game Action Trigger

```typescript
exports.gameAction = onValueCreated(
  "/games/{gameid}/{uid}/{actionid}",
  (event) => {
    const action = event.data.val() as GameAction;
    const gameid = event.params.gameid;
    return executeGameAction(gameid, action);
  }
);
```

### Profile Action Trigger

```typescript
exports.profileChanged = onValueCreated(
  "/users/{uid}/profile/{actionid}",
  (event) => {
    const path = `/profiles/${event.params.uid}`;
    const { type, alias, profile_image } = event.data.val();
    
    if (type === "set_alias" && alias !== undefined) {
      return processProfileAction(path, { type, alias });
    }
    if (type === "set_avatar" && profile_image !== undefined) {
      return processProfileAction(path, { type, profile_image });
    }
  }
);
```

### Metagame Action Trigger

```typescript
exports.metaGameAction = onValueCreated(
  "/users/{uid}/games/{actionid}",
  (event) => {
    const action = event.data.val() as MetaGameAction;
    
    if (action.type === "create_game") {
      return createGame(action.gameOptions);
    }
    if (action.type === "delete_game") {
      return deleteGame(action.gameid);
    }
  }
);
```

### Scheduled Tick Trigger

```typescript
exports.tick = onSchedule("every 15 minutes", async () => {
  await updateGames();
});
```

## Data Flow Architecture

### Action Processing Pipeline

1. **Client Action**: Player dispatches action to Realtime Database
2. **Function Trigger**: Firebase Function responds to new data
3. **State Loading**: Current game state loaded from Firestore blocks
4. **State Computation**: Pure function computes new state
5. **Diff Generation**: Patch created comparing old and new state
6. **Persistence**: Patch stored in Firestore, options updated
7. **Real-time Sync**: All clients receive updated state

### State Synchronization

```typescript
// Frontend subscribes to game state
const gameRef = ref(realtimeDB, `games/${gameId}`);
onValue(gameRef, (snapshot) => {
  const gameState = snapshot.val();
  // UI automatically updates with new state
});

// Backend updates trigger real-time propagation
await writePatch(gameid, statePatch);
// All subscribed clients receive update immediately
```

## Error Handling and Resilience

### Idempotent Operations

All functions are designed to be idempotent:

```typescript
if (gamestate.options.players[action.uid]) {
  // Player already in game - gracefully handle duplicate joins
  return gamestate;
}
```

### Graceful Degradation

```typescript
try {
  await db.doc(path).update(data);
} catch (err) {
  // If block is full, create new block
  const newBlock = `/games/${gameid}/blocks/Block_${++blockNumber}`;
  await db.doc(newBlock).set({ initial_timestamp: now, ...data });
}
```

### Validation and Constraints

```typescript
if (action.type === "start_game") {
  if (nextstate.options.playersNeeded === 0) {
    nextstate.options.started = true;
  }
  // Only start games when requirements are met
}
```

## Performance Optimizations

### Efficient State Updates

- **Patch-based persistence**: Only changes are stored and transmitted
- **Block-based storage**: Large game histories split into manageable chunks
- **Differential updates**: Frontend receives minimal state changes

### Scalable Architecture

- **Serverless functions**: Automatic scaling based on demand
- **Database optimization**: Efficient queries and indexing
- **Real-time efficiency**: Minimal payload sizes for fast synchronization

### Caching Strategy

```typescript
// Game state reconstruction with caching
let cachedGameState: GameState | null = null;
let lastBlockTimestamp: number = 0;

async function getGameState(gameid: string) {
  // Check if cache is still valid
  if (cachedGameState && cacheIsValid()) {
    return cachedGameState;
  }
  
  // Reconstruct from patches
  cachedGameState = await reconstructFromPatches(gameid);
  return cachedGameState;
}
```

## Testing Strategy

### Unit Testing

```typescript
describe('executeGameAction', () => {
  it('should handle join_game action', async () => {
    const action: GameAction = {
      type: 'join_game',
      uid: 'player1',
      alias: 'TestPlayer',
      avatar: 'avatar1'
    };
    
    await executeGameAction('game123', action);
    
    const updatedState = await getGameState('game123');
    expect(updatedState.options.players['player1']).toBeDefined();
  });
});
```

### Integration Testing

```typescript
describe('Game Function Integration', () => {
  beforeEach(async () => {
    // Initialize Firebase test environment
    await setupEmulators();
  });
  
  it('should process complete game flow', async () => {
    // Create game
    await createGame(testGameOptions);
    
    // Players join
    await executeGameAction(gameId, joinAction1);
    await executeGameAction(gameId, joinAction2);
    
    // Game starts automatically
    await updateGames();
    
    const finalState = await getGameState(gameId);
    expect(finalState.options.started).toBe(true);
  });
});
```

## Monitoring and Observability

### Logging Strategy

```typescript
console.log(`Processing ${action.type} for game ${gameid}`);
console.log(`Game state: tick=${gamestate.tick}, players=${Object.keys(gamestate.options.players).length}`);
```

### Error Tracking

```typescript
try {
  await executeGameAction(gameid, action);
} catch (error) {
  console.error(`Failed to process action ${action.type}:`, error);
  // Error automatically reported to Firebase Functions monitoring
  throw error; // Re-throw for function retry logic
}
```

### Performance Metrics

- Function execution time tracking
- Database operation latency monitoring
- Real-time synchronization performance
- Memory usage and optimization

---

*The backend game functions provide a robust, scalable foundation for real-time multiplayer game logic, with efficient state management, reliable persistence, and seamless integration with the frontend application.*