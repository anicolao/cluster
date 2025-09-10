# Frontend Libraries

## Overview

The frontend library layer provides shared utilities, Firebase integration, authentication, and state management for the Cluster SvelteKit application. These libraries abstract common functionality and provide a clean interface between the UI components and external services.

## Core Libraries

### Firebase Integration (`firebase.ts`)

Centralizes Firebase configuration and service initialization:

```typescript
// Firebase App Configuration
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "cluster-7c384.firebaseapp.com",
  databaseURL: "https://cluster-7c384-default-rtdb.firebaseio.com",
  projectId: "cluster-7c384",
  // ... other config
};

// Initialized Services
export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore();
export const realtimeDB = getDatabase(app);
```

**Key Features:**
- Environment-aware emulator connection for development
- Centralized service instances for consistent usage
- Production vs development configuration switching

**Development Mode:**
```typescript
if (!import.meta.env.PROD) {
  // Automatically connect to local emulators
  connectFirestoreEmulator(firestore, "localhost", 8080);
  connectDatabaseEmulator(realtimeDB, "localhost", 9000);
}
```

### Authentication (`auth.ts`)

Manages user authentication and session state:

```typescript
// Firebase Auth Instance
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Session State
export let uid: string | undefined = undefined;
export const signedIn = writable<boolean | undefined>(undefined);
```

**Authentication Flow:**
1. User signs in with Google OAuth
2. Firebase Auth event triggers custom handler
3. User profile is created/updated in Firestore
4. Global state stores are updated
5. UI components reactively update

**Event Handler:**
```typescript
export function user(e: CustomEvent) {
  if (e.detail.signedIn) {
    signedIn.set(true);
    store.dispatch(login(e.detail));
    uid = e.detail.uid;
    
    // Persist user data to Firestore
    const userRecord = doc(firestore, `/users/${uid}`);
    setDoc(userRecord, e.detail);
  } else {
    signedIn.set(false);
    store.dispatch(logout(uid));
  }
}
```

### State Management (`store.ts`)

Implements Redux-style state management with Svelte integration:

```typescript
import { configureSvelteStore } from "@ourway/svelte-redux";

const reducer = {
  users,  // User authentication reducer
};

const reduxStore = configureSvelteStore(reducer);
export const store = reduxStore as ReduxStore & SvelteStore;
```

**Benefits:**
- Predictable state updates through actions
- Time-travel debugging support
- Easy integration with Svelte's reactivity
- Scalable architecture for complex state

### User Management (`users.ts`)

Handles user state with Redux actions and reducers:

```typescript
export interface UserState {
  users: { [k: string]: SignedInUser };
}

// Actions
export const login = createAction<SignedInUser>("login");
export const logout = createAction<string>("logout");

// Reducer
export const users = createReducer(initialState, (builder) => {
  builder
    .addCase(login, (state, action) => {
      state.users[action.payload.uid] = action.payload;
    })
    .addCase(logout, (state, action) => {
      delete state.users[action.payload];
    });
});
```

**State Structure:**
- Maps user IDs to `SignedInUser` objects
- Supports multiple concurrent user sessions
- Immutable updates with Immer integration

## Integration Patterns

### Svelte Component Usage

```svelte
<script lang="ts">
  import { auth, googleAuthProvider, user } from '$lib/auth';
  import { firestore, realtimeDB } from '$lib/firebase';
  import { store } from '$lib/store';
  import { Signin } from '@ourway/svelte-firebase-auth';
  
  // Reactive store subscriptions
  $: currentUser = $store.users[uid];
  $: isSignedIn = $signedIn;
</script>

<!-- Authentication component -->
<Signin {auth} providers={{ google: googleAuthProvider }} on:user={user} />

<!-- Reactive UI based on auth state -->
{#if isSignedIn}
  <p>Welcome, {currentUser?.displayName}!</p>
{:else}
  <p>Please sign in to continue.</p>
{/if}
```

### Firebase Data Binding

```svelte
<script lang="ts">
  import { onSnapshot, collection, query } from 'firebase/firestore';
  import { firestore } from '$lib/firebase';
  
  let games = {};
  
  // Real-time Firestore subscription
  onMount(() => {
    const gamesCollection = collection(firestore, 'games');
    return onSnapshot(query(gamesCollection), (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const doc = change.doc;
        games[doc.ref.id] = doc.data();
      }
      games = games; // Trigger Svelte reactivity
    });
  });
</script>
```

### Action Dispatch Pattern

```typescript
import { push, ref } from '@firebase/database';
import { realtimeDB } from '$lib/firebase';
import type { GameAction } from '$common/gamestate';

async function joinGame(gameId: string, playerInfo: PlayerInfo) {
  const action: GameAction = {
    type: 'join_game',
    uid: playerInfo.uid,
    alias: playerInfo.alias,
    avatar: playerInfo.avatar
  };
  
  await push(ref(realtimeDB, `gameActions/${gameId}`), action);
}
```

## External Dependencies

### Firebase SDK Integration

The libraries wrap Firebase SDK functionality:

- `@firebase/app`: Core Firebase application
- `@firebase/auth`: Authentication services
- `@firebase/firestore`: Document database
- `@firebase/database`: Realtime database

### Redux Integration

State management uses Redux Toolkit with Svelte bindings:

- `@reduxjs/toolkit`: Modern Redux with Immer
- `@ourway/svelte-redux`: Svelte store integration
- `@ourway/svelte-firebase-auth`: Firebase Auth components

### Type Safety

All libraries are fully typed with TypeScript:

```typescript
// Typed store subscription
const unsubscribe: Unsubscribe = onSnapshot(
  collection(firestore, 'games'),
  (snapshot: QuerySnapshot) => {
    // Type-safe document handling
  }
);

// Typed action creators
const loginAction = login({
  uid: 'user123',
  displayName: 'Player One',
  email: 'player@example.com'
});
```

## Error Handling

### Firebase Error Management

```typescript
import { FirebaseError } from 'firebase/app';

try {
  await setDoc(userRecord, userData);
} catch (error) {
  if (error instanceof FirebaseError) {
    console.error('Firebase error:', error.code, error.message);
    // Handle specific Firebase error codes
  } else {
    console.error('Unknown error:', error);
  }
}
```

### State Management Errors

```typescript
// Actions that can't fail at dispatch time
store.dispatch(login(userData));

// Async operations with error boundaries
try {
  const result = await someAsyncOperation();
  store.dispatch(operationSuccess(result));
} catch (error) {
  store.dispatch(operationFailure(error.message));
}
```

## Performance Optimizations

### Subscription Management

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  
  let unsubscribe: Unsubscribe;
  
  onMount(() => {
    unsubscribe = onSnapshot(collection(firestore, 'games'), handleUpdate);
  });
  
  onDestroy(() => {
    unsubscribe?.(); // Clean up subscriptions
  });
</script>
```

### Efficient State Updates

```typescript
// Batch related updates
batch(() => {
  store.dispatch(login(user));
  store.dispatch(loadUserGames(userGames));
  store.dispatch(setActiveGame(activeGameId));
});

// Use Svelte's reactivity efficiently
$: filteredGames = Object.values(games).filter(game => 
  !game.started && game.playersNeeded > 0
);
```

## Testing Strategy

### Unit Testing Libraries

```typescript
import { describe, it, expect } from 'vitest';
import { users, login, logout } from '$lib/users';

describe('users reducer', () => {
  it('should handle login action', () => {
    const state = users(undefined, login(mockUser));
    expect(state.users[mockUser.uid]).toEqual(mockUser);
  });
  
  it('should handle logout action', () => {
    const state = users(initialStateWithUser, logout(mockUser.uid));
    expect(state.users[mockUser.uid]).toBeUndefined();
  });
});
```

### Integration Testing

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import { auth } from '$lib/auth';
import TestComponent from './TestComponent.svelte';

describe('Auth Integration', () => {
  it('should update UI when user signs in', async () => {
    const { getByText } = render(TestComponent);
    
    // Simulate sign in
    await fireEvent.click(getByText('Sign In'));
    
    // Verify UI update
    expect(getByText('Welcome, Test User!')).toBeInTheDocument();
  });
});
```

## Development Workflow

### Local Development

1. Start Firebase emulators: `firebase emulators:start`
2. Libraries automatically connect to local services
3. Authentication works with test accounts
4. Data persists locally during development

### Production Deployment

1. Environment variables configure production Firebase
2. Libraries connect to production services
3. Authentication uses real Google OAuth
4. Data persists to production databases

---

*The frontend libraries provide a robust foundation for building reactive, real-time applications with Firebase, while maintaining type safety and developer productivity.*