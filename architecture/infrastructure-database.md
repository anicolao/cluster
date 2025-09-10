# Infrastructure - Database Design

## Overview

Cluster uses a hybrid database approach combining Firebase Firestore for persistent data and Firebase Realtime Database for live game state. This design optimizes for both consistency and real-time performance while maintaining scalability and cost-effectiveness.

## Database Architecture

### Firestore (Document Database)

Firestore handles persistent, structured data with strong consistency guarantees:

```
/games/{gameId}                    # Game configurations
/users/{uid}                       # User authentication data  
/profiles/{uid}                    # User profile information
/games/{gameId}/blocks/{blockId}   # Game state history blocks
```

### Realtime Database (Real-time Updates)

Realtime Database manages live, ephemeral data with sub-second latency:

```
/gameActions/{gameId}/{uid}/{actionId}    # Player actions queue
/users/{uid}/profile/{actionId}           # Profile update actions
/users/{uid}/games/{actionId}             # Metagame actions
```

## Firestore Schema Design

### Games Collection

Primary game configuration and metadata:

```typescript
// /games/{gameId}
interface GameDocument {
  name: string;              // "Ancient Rome", "Golden Byzantium"
  autospawn: boolean;        // Auto-create replacement when full
  playerCount: number;       // Maximum players (2-8)
  playersNeeded: number;     // Remaining slots 
  started: boolean;          // Game status
  deleted?: boolean;         // Soft deletion flag
  winner?: string;           // Winner UID when game ends
  players: {                 // Current player roster
    [uid: string]: {
      uid: string;
      alias: string;
      avatar: string;
    }
  }
}
```

**Indexing Strategy:**
- Index on `started` for lobby queries
- Index on `playersNeeded` for available games
- Composite index on `started` + `playersNeeded` for efficiency

### Game State Blocks

Patch-based state storage for efficient updates:

```typescript
// /games/{gameId}/blocks/{blockId}
interface GameBlock {
  initial_timestamp: number;     // Block creation time
  last_timestamp: number;        // Last update time
  [timestamp: string]: string;   // Serialized patches keyed by timestamp
}
```

**Block Management:**
- New blocks created when size limits reached (~1MB)
- Timestamps as keys enable chronological patch application
- Efficient queries using `initial_timestamp` ordering

### User Profiles

Player identity and preferences:

```typescript
// /profiles/{uid}
interface ProfileDocument {
  alias: string;           // Display name
  profile_image: string;   // Avatar identifier
  timestamp: FieldValue;   // Last update timestamp
}

// /users/{uid}  
interface UserDocument {
  // Firebase Auth user data
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  // ... other auth fields
}
```

## Realtime Database Schema

### Game Actions Queue

Real-time action processing:

```json
{
  "gameActions": {
    "{gameId}": {
      "{uid}": {
        "{actionId}": {
          "type": "join_game",
          "uid": "player123",
          "alias": "PlayerOne", 
          "avatar": "avatar1"
        }
      }
    }
  }
}
```

**Benefits:**
- Sub-second action processing
- Automatic cleanup via TTL rules
- User-scoped write permissions
- Efficient fan-out to multiple games

### Profile Actions

Real-time profile updates:

```json
{
  "users": {
    "{uid}": {
      "profile": {
        "{actionId}": {
          "type": "set_alias",
          "alias": "NewPlayerName"
        }
      },
      "games": {
        "{actionId}": {
          "type": "create_game",
          "gameOptions": { ... }
        }
      }
    }
  }
}
```

## Data Access Patterns

### Real-time Game Updates

```typescript
// Client subscribes to game state changes
const gameRef = ref(realtimeDB, `games/${gameId}`);
onValue(gameRef, (snapshot) => {
  const gameState = snapshot.val();
  updateGameUI(gameState);
});

// Client dispatches actions
const action = { type: 'join_game', uid, alias, avatar };
await push(ref(realtimeDB, `gameActions/${gameId}/${uid}`), action);
```

### Game Discovery

```typescript
// Query available games
const gamesQuery = query(
  collection(firestore, 'games'),
  where('started', '==', false),
  where('playersNeeded', '>', 0),
  orderBy('name')
);

onSnapshot(gamesQuery, (snapshot) => {
  const availableGames = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
});
```

### State Reconstruction

```typescript
// Load complete game state from blocks
const blocksQuery = query(
  collection(firestore, `games/${gameId}/blocks`),
  orderBy('initial_timestamp')
);

let gameState = {};
const blocks = await getDocs(blocksQuery);

blocks.forEach(block => {
  const data = block.data();
  const timestamps = Object.keys(data)
    .filter(key => !isNaN(+key))
    .sort();
    
  timestamps.forEach(timestamp => {
    const patch = JSON.parse(data[timestamp]);
    gameState = patch(gameState, patch);
  });
});
```

## Performance Optimizations

### Efficient Queries

**Firestore Query Optimization:**
```typescript
// Use composite indexes for complex queries
const activeGamesQuery = query(
  collection(firestore, 'games'),
  where('started', '==', true),
  where('deleted', '==', false),
  limit(50)
);

// Paginate large result sets
const paginatedQuery = query(
  gamesCollection,
  orderBy('name'),
  startAfter(lastDoc),
  limit(20)
);
```

**Realtime Database Denormalization:**
```json
{
  "gameActions": {
    "{gameId}": {
      ".indexOn": ["timestamp", "type"]
    }
  }
}
```

### Caching Strategy

**Client-side Caching:**
```typescript
// Cache frequently accessed data
const gameCache = new Map();

function getGameState(gameId: string) {
  if (gameCache.has(gameId)) {
    return gameCache.get(gameId);
  }
  
  const state = loadGameStateFromFirestore(gameId);
  gameCache.set(gameId, state);
  return state;
}
```

**Firebase Cache Configuration:**
```typescript
// Enable offline persistence
enablePersistence(firestore);

// Configure cache settings
const settings = {
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB
  ignoreUndefinedProperties: true
};
connectFirestoreEmulator(firestore, settings);
```

## Data Consistency

### ACID Properties

**Firestore Transactions:**
```typescript
await runTransaction(firestore, async (transaction) => {
  const gameRef = doc(firestore, 'games', gameId);
  const game = await transaction.get(gameRef);
  
  if (game.data().playersNeeded > 0) {
    transaction.update(gameRef, {
      playersNeeded: game.data().playersNeeded - 1,
      [`players.${uid}`]: playerData
    });
  }
});
```

**Eventual Consistency:**
- Realtime Database updates are eventually consistent
- Critical state changes go through Firestore transactions
- Optimistic UI updates with conflict resolution

### Conflict Resolution

```typescript
// Handle concurrent updates gracefully
function handleGameAction(gameState: GameState, action: GameAction) {
  // Idempotent operations prevent conflicts
  if (action.type === 'join_game') {
    if (gameState.players[action.uid]) {
      return gameState; // Player already joined
    }
    // Proceed with join logic
  }
}
```

## Backup and Recovery

### Automated Backups

Firebase provides automatic daily backups:
- Point-in-time recovery for Firestore
- Export functionality for disaster recovery
- Cross-region replication for availability

### Data Export

```typescript
// Export game data for analysis
const gamesSnapshot = await getDocs(collection(firestore, 'games'));
const gamesData = gamesSnapshot.docs.map(doc => ({
  id: doc.id,
  data: doc.data(),
  timestamp: new Date().toISOString()
}));

// Save to Cloud Storage or external system
await exportToCloudStorage(gamesData);
```

## Monitoring and Analytics

### Query Performance

```typescript
// Monitor slow queries
const startTime = performance.now();
const result = await getDocs(expensiveQuery);
const duration = performance.now() - startTime;

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`);
}
```

### Usage Metrics

```json
{
  "firestore": {
    "reads": 50000,
    "writes": 10000,
    "deletes": 100
  },
  "realtimeDB": {
    "bandwidth": "1.2GB",
    "connections": 500
  }
}
```

## Cost Optimization

### Read/Write Minimization

```typescript
// Use limit() to reduce unnecessary reads
const recentGames = query(
  collection(firestore, 'games'),
  orderBy('timestamp', 'desc'),
  limit(10) // Only load what's needed
);

// Batch writes for efficiency
const batch = writeBatch(firestore);
batch.set(gameRef, gameData);
batch.update(playerRef, playerData);
await batch.commit();
```

### Data Lifecycle Management

```typescript
// Soft delete with scheduled cleanup
async function archiveOldGames() {
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  
  const oldGames = query(
    collection(firestore, 'games'),
    where('timestamp', '<', cutoffDate),
    where('started', '==', false)
  );
  
  const batch = writeBatch(firestore);
  const snapshot = await getDocs(oldGames);
  
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { deleted: true });
  });
  
  await batch.commit();
}
```

## Security Considerations

### Data Validation

```typescript
// Validate data before writes
function validateGameOptions(options: any): options is GameOptions {
  return (
    typeof options.name === 'string' &&
    typeof options.playerCount === 'number' &&
    options.playerCount >= 2 &&
    options.playerCount <= 8 &&
    typeof options.autospawn === 'boolean'
  );
}
```

### Access Control

```typescript
// Role-based access control
function canModifyGame(uid: string, gameId: string): boolean {
  const userRoles = getUserRoles(uid);
  const gameOwner = getGameOwner(gameId);
  
  return userRoles.includes('admin') || uid === gameOwner;
}
```

---

*The database design balances real-time performance with data consistency, providing a scalable foundation for the multiplayer game experience while maintaining cost-effectiveness and reliability.*