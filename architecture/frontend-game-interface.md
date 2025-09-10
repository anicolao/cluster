# Frontend Game Interface

## Overview

The frontend game interface provides the player-facing UI for the Cluster game. Built with SvelteKit and organized into route groups, it offers a cohesive experience from authentication through active gameplay. The interface emphasizes real-time updates, responsive design, and intuitive game management.

## Route Architecture

The game interface uses SvelteKit's route groups pattern with `(game)` containing all authenticated game-related pages:

```
src/routes/(game)/
├── +layout.svelte          # Authentication wrapper
├── lobby/+page.svelte      # Game discovery and joining
├── game/+page.svelte       # Active game view
├── profile/+page.svelte    # User profile management  
└── admin/+page.svelte      # Game administration tools
```

## Core Components

### Authentication Layout (`+layout.svelte`)

Provides authentication wrapper for all game routes:

```svelte
<script lang="ts">
  import { auth, googleAuthProvider, signedIn, user } from '$lib/auth';
  import { Signin } from '@ourway/svelte-firebase-auth';
</script>

<div class="top">
  {#if $signedIn === true}
    <slot />  <!-- Render authenticated content -->
  {:else if $signedIn === false}
    <p>Please sign in.</p>
    <Signin {auth} {googleAuthProvider} on:user_changed={user} />
  {:else}
    <!-- Loading state with animated spinner -->
    <div class="loading">
      <div class="lds-ripple"><div></div><div></div></div>
    </div>
  {/if}
</div>
```

**Features:**
- **Conditional Rendering**: Shows content only when authenticated
- **Loading States**: Animated spinner during auth check
- **Google OAuth Integration**: Seamless sign-in experience
- **Responsive Design**: Full viewport height with centered content

### Game Lobby (`lobby/+page.svelte`)

Central hub for game discovery and management:

```svelte
<script lang="ts">
  let games: { [gameid: string]: GameOptions } = {};
  let joinedGames: string[] = [];
  let joinableGames: string[] = [];
  
  // Real-time subscription to games collection
  function subscribeToGamesCollection() {
    const gamedata = collection(firestore, "games");
    unsubscribeGames = onSnapshot(query(gamedata), (querySnapshot) => {
      for (const change of querySnapshot.docChanges()) {
        const doc = change.doc;
        games[doc.ref.id] = change.doc.data() as GameOptions;
        
        if (games[doc.ref.id]?.deleted) {
          delete games[doc.ref.id];
        }
        games = games; // Trigger Svelte reactivity
        
        if (uid !== undefined) {
          updateGameList(uid);
        }
      }
    });
  }
</script>
```

**Game Management Functions:**
```typescript
function joinGame(gameid: string) {
  return () => {
    const alias = users[uid].alias;
    const avatar = users[uid].profile_image;
    pushAction(gameid, { type: "join_game", uid, alias, avatar });
    goto(`/game/?id=${gameid}`);
  };
}

function updateGameList(userid: string) {
  joinedGames = Object.keys(games).filter(
    (x) => games[x].players && games[x].players[userid] !== undefined
  );
  joinableGames = Object.keys(games).filter(
    (x) => joinedGames.indexOf(x) === -1 && !games[x].started
  );
}
```

**Features:**
- **Real-time Game List**: Live updates as games are created/modified
- **Game Filtering**: Separates joined games from available games
- **One-click Join**: Streamlined game joining with auto-navigation
- **Profile Integration**: Uses player profile for game actions

### Active Game View (`game/+page.svelte`)

Real-time interface for active gameplay:

```svelte
<script lang="ts">
  let gameState: GameState = {} as GameState;
  let lastTimeStamp = 0;
  
  // Subscribe to game state patches
  function subscribeToGamePatches() {
    const blocks = collection(firestore, `games/${gameId}/blocks`);
    unsubscribeFromGamePatches = onSnapshot(
      query(blocks, orderBy("initial_timestamp")),
      (querySnapshot) => {
        for (const change of querySnapshot.docChanges()) {
          const block = doc.data();
          const timestamps = Object.keys(block)
            .filter((x) => +x)
            .sort();
            
          for (const time of timestamps) {
            if (+time > lastTimeStamp) {
              gameState = patch(gameState, JSON.parse(block[time])) as GameState;
              lastTimeStamp = +time;
            }
          }
        }
      }
    );
  }
</script>
```

**State Reconstruction:**
- **Patch-based Updates**: Efficiently applies incremental state changes
- **Chronological Ordering**: Ensures patches are applied in correct sequence
- **Real-time Sync**: Automatically updates as game progresses
- **Memory Efficient**: Only stores current state, not full history

### User Profile (`profile/+page.svelte`)

Profile management with real-time validation:

```svelte
<script lang="ts">
  let alias = "";
  const WRITE_DELAY = 500;
  let writeTimeout = 0;
  
  function pushAction(action: ProfileAction) {
    push(ref(realtimeDB, `users/${uid}/profile`), action);
  }
  
  function writeName() {
    pushAction({ type: "set_alias", alias });
  }
  
  function setNameTimeout() {
    writeTimeout = new Date().getTime() + WRITE_DELAY;
    setTimeout(() => {
      if (writeTimeout < new Date().getTime() + 10) {
        writeName();
      }
    }, WRITE_DELAY);
  }
  
  // Reactive update with debouncing
  $: if (alias) setNameTimeout();
</script>
```

**Features:**
- **Debounced Updates**: Prevents excessive Firebase writes
- **Real-time Preview**: Instant local feedback on changes
- **Avatar Selection**: Integration with game avatar system
- **Profile Persistence**: Automatic saving to user profile

### Admin Interface (`admin/+page.svelte`)

Game administration and management tools:

```svelte
<script lang="ts">
  function pushAction(action: MetaGameAction) {
    push(ref(realtimeDB, `users/${uid}/games`), action);
  }
  
  // Create new game with random name
  function createGame() {
    const options: GameOptions = {
      name: randomName(),
      autospawn: false,
      playerCount: 4,
      playersNeeded: 4,
      started: false,
      players: {}
    };
    
    const action: CreateGameAction = {
      type: "create_game",
      gameOptions: options
    };
    
    pushAction(action);
  }
  
  // Delete existing game
  function deleteGame(gameid: string) {
    const action: DeleteGameAction = {
      type: "delete_game",
      gameid
    };
    
    pushAction(action);
  }
</script>
```

**Administrative Functions:**
- **Game Creation**: Generate new games with customizable options
- **Game Deletion**: Soft-delete games to maintain data integrity
- **Real-time Monitoring**: Live view of all game states
- **Batch Operations**: Handle multiple games efficiently

## Real-time Data Patterns

### Firebase Integration

All components use consistent patterns for Firebase integration:

```typescript
// Firestore subscription pattern
let unsubscribe: Unsubscribe | undefined;

onMount(() => {
  const collection = collection(firestore, "collectionName");
  unsubscribe = onSnapshot(query(collection), handleSnapshot);
});

onDestroy(() => {
  unsubscribe?.(); // Clean up subscriptions
});
```

### Action Dispatch Pattern

Consistent action dispatch across all components:

```typescript
function pushAction(action: ActionType) {
  push(ref(realtimeDB, `path/to/actions`), action);
}

// Usage with type safety
pushAction({
  type: "specific_action",
  payload: validatedData
});
```

### State Synchronization

Real-time state updates with Svelte reactivity:

```typescript
// Trigger Svelte reactivity after Firebase updates
games = games;
users = users;
gameState = gameState;

// Reactive statements for computed values
$: joinableGames = Object.keys(games).filter(
  game => !games[game].started && !userInGame(game)
);
```

## UI/UX Patterns

### Loading States

Consistent loading indicators across components:

```svelte
{#if loading}
  <div class="loading">
    <div class="lds-ripple"><div></div><div></div></div>
  </div>
{:else}
  <!-- Content -->
{/if}
```

### Error Handling

Graceful error handling with user feedback:

```svelte
{#if error}
  <div class="error">
    <p>Something went wrong: {error.message}</p>
    <button on:click={retry}>Try Again</button>
  </div>
{/if}
```

### Responsive Design

Mobile-first responsive patterns:

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

## Performance Optimizations

### Efficient Subscriptions

- **Targeted Queries**: Subscribe only to necessary data
- **Cleanup Management**: Proper subscription cleanup on component destroy
- **Change Detection**: Process only actual document changes

### Optimistic Updates

```typescript
// Optimistic UI update
function joinGameOptimistic(gameId: string) {
  // Update local state immediately
  games[gameId].players[uid] = currentUser;
  games = games;
  
  // Dispatch actual action
  pushAction(gameId, joinAction);
  
  // Navigate immediately for better UX
  goto(`/game/?id=${gameId}`);
}
```

### Memory Management

```typescript
// Efficient object updates
function updateGame(gameId: string, updates: Partial<GameOptions>) {
  games = {
    ...games,
    [gameId]: {
      ...games[gameId],
      ...updates
    }
  };
}
```

## Accessibility Features

### Keyboard Navigation

- Tab navigation through interactive elements
- Enter/Space activation for buttons
- Escape key for modal dismissal

### Screen Reader Support

```svelte
<button 
  aria-label="Join game {game.name}"
  aria-describedby="game-{gameId}-description"
  on:click={joinGame(gameId)}
>
  Join Game
</button>

<div id="game-{gameId}-description" class="sr-only">
  {game.playerCount} player game, {game.playersNeeded} spots remaining
</div>
```

### Visual Indicators

- Loading states with animated feedback
- Success/error states with color and text
- Real-time status indicators

## Testing Strategy

### Component Testing

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import GameLobby from './+page.svelte';

describe('Game Lobby', () => {
  it('should display available games', () => {
    const { getByText } = render(GameLobby, {
      props: { games: mockGames }
    });
    
    expect(getByText('Ancient Rome')).toBeInTheDocument();
  });
  
  it('should join game on button click', async () => {
    const { getByText } = render(GameLobby);
    
    await fireEvent.click(getByText('Join Game'));
    
    expect(mockPushAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'join_game' })
    );
  });
});
```

### Integration Testing

```typescript
describe('Game Flow Integration', () => {
  it('should complete full game join flow', async () => {
    // Start at lobby
    const lobby = render(GameLobby);
    
    // Join game
    await fireEvent.click(lobby.getByText('Join Game'));
    
    // Verify navigation to game page
    expect(window.location.pathname).toBe('/game');
    
    // Verify game state loaded
    const game = render(GameView);
    expect(game.getByText('Game Started')).toBeInTheDocument();
  });
});
```

---

*The frontend game interface provides an intuitive, real-time experience that seamlessly integrates with Firebase services while maintaining excellent performance and accessibility standards.*