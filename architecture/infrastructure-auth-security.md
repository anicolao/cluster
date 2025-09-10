# Infrastructure - Authentication & Security

## Overview

Cluster implements a comprehensive security model using Firebase Authentication, Security Rules, and defense-in-depth strategies. The system protects user data, prevents unauthorized access, and ensures game integrity while maintaining a seamless user experience.

## Authentication Architecture

### Firebase Authentication Integration

Firebase Authentication provides the identity layer with Google OAuth:

```typescript
// Authentication configuration
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Authentication flow
import { signInWithPopup } from 'firebase/auth';

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    
    // User profile creation/update
    await createOrUpdateUserProfile(user);
    
    return user;
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
```

### User Session Management

```typescript
// Session state management
export const signedIn = writable<boolean | undefined>(undefined);
export let uid: string | undefined = undefined;

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    signedIn.set(true);
    
    // Sync user data to Firestore
    syncUserProfile(user);
  } else {
    uid = undefined;
    signedIn.set(false);
    
    // Clean up user session
    clearUserSession();
  }
});
```

### User Profile Synchronization

```typescript
// Sync Firebase Auth data with Firestore
async function syncUserProfile(user: User) {
  const userRef = doc(firestore, 'users', user.uid);
  
  await setDoc(userRef, {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastSignIn: serverTimestamp(),
    provider: 'google'
  }, { merge: true });
}
```

## Security Rules

### Firestore Security Rules

Comprehensive rules protecting document access:

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Default deny all
    match /{document=**} {
      allow read, write: if false;
    }

    // User documents - users can only write their own
    match /users/{uid} {
      allow write: if request.auth != null && request.auth.uid == uid;
    }

    // Profiles - authenticated users can read all profiles
    match /profiles/{document=**} {
      allow read: if request.auth != null;
    }

    // Games - authenticated users can read game data
    match /games/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

**Security Principles:**
- **Default Deny**: All access denied unless explicitly allowed
- **Authentication Required**: All operations require valid Firebase Auth token
- **Principle of Least Privilege**: Users only access what they need
- **Resource-level Control**: Granular permissions per document type

### Realtime Database Security Rules

Action-based permissions for real-time operations:

```json
{
  "rules": {
    // Game actions - users can only write their own actions
    "games": {
      "$gameid": {
        "$uid": {
          ".write": "$uid === auth.uid"
        }
      }
    },
    
    // User actions - users control their own action queues
    "users": {
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    
    // Default deny
    ".read": false,
    ".write": false
  }
}
```

**Key Features:**
- **User-scoped Writing**: Users can only create actions under their UID
- **Authentication Validation**: All writes require valid `auth.uid`
- **Action Isolation**: Users cannot interfere with others' actions
- **Read Restrictions**: No global read access to sensitive data

## Authorization Patterns

### Resource-based Authorization

```typescript
// Check if user can modify a game
function canModifyGame(user: User, gameId: string, game: GameOptions): boolean {
  // Users can only join games, not modify options
  if (!user || !user.uid) return false;
  
  // Check if game is still accepting players
  if (game.started || game.playersNeeded <= 0) return false;
  
  // Check if user is already in the game
  if (game.players[user.uid]) return false;
  
  return true;
}

// Validate action permissions before dispatch
function validateGameAction(action: GameAction, user: User, game: GameOptions): boolean {
  switch (action.type) {
    case 'join_game':
      return canModifyGame(user, gameId, game);
    case 'leave_game':
      return user.uid === action.uid && game.players[user.uid];
    case 'start_game':
      // Only allow if game has enough players
      return game.playersNeeded === 0;
    default:
      return false;
  }
}
```

### Role-based Authorization

```typescript
// User roles system (future enhancement)
interface UserRoles {
  admin: boolean;
  moderator: boolean;
  player: boolean;
}

async function getUserRoles(uid: string): Promise<UserRoles> {
  const roleDoc = await getDoc(doc(firestore, 'userRoles', uid));
  return roleDoc.exists() ? roleDoc.data() as UserRoles : { 
    admin: false, 
    moderator: false, 
    player: true 
  };
}

// Admin-only operations
async function deleteGame(gameId: string, requestingUser: string) {
  const roles = await getUserRoles(requestingUser);
  
  if (!roles.admin) {
    throw new Error('Insufficient permissions');
  }
  
  // Proceed with deletion
  await updateDoc(doc(firestore, 'games', gameId), {
    deleted: true,
    deletedBy: requestingUser,
    deletedAt: serverTimestamp()
  });
}
```

## Input Validation and Sanitization

### Client-side Validation

```typescript
// Validate game action inputs
function validateJoinGameAction(action: JoinGameAction): boolean {
  if (!action.uid || typeof action.uid !== 'string') return false;
  if (!action.alias || typeof action.alias !== 'string') return false;
  if (action.alias.length < 1 || action.alias.length > 50) return false;
  if (!action.avatar || typeof action.avatar !== 'string') return false;
  
  // Sanitize alias
  action.alias = action.alias.trim();
  
  return true;
}

// Profile input sanitization
function sanitizeAlias(alias: string): string {
  return alias
    .trim()
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 50); // Limit length
}
```

### Server-side Validation

```typescript
// Firebase Functions validation
export async function executeGameAction(gameid: string, action: GameAction) {
  // Validate game ID format
  if (!gameid || typeof gameid !== 'string' || gameid.length !== 20) {
    throw new Error('Invalid game ID');
  }
  
  // Validate action structure
  if (!action || !action.type) {
    throw new Error('Invalid action format');
  }
  
  // Type-specific validation
  switch (action.type) {
    case 'join_game':
      if (!isValidJoinGameAction(action)) {
        throw new Error('Invalid join_game action');
      }
      break;
    case 'leave_game':
      if (!isValidLeaveGameAction(action)) {
        throw new Error('Invalid leave_game action');
      }
      break;
    default:
      throw new Error('Unknown action type');
  }
  
  // Proceed with action processing
  return processValidatedAction(gameid, action);
}
```

## Data Protection

### Personal Information Handling

```typescript
// Minimal data collection
interface PublicProfile {
  alias: string;        // User-chosen display name
  avatar: string;       // Game avatar identifier
  lastSeen: Timestamp;  // Activity timestamp
}

interface PrivateProfile {
  email: string;        // From Firebase Auth (not exposed)
  realName: string;     // From Google profile (not exposed)
  signUpDate: Timestamp;
}

// Data access controls
function getPublicProfile(uid: string): PublicProfile {
  // Only return publicly visible data
  return {
    alias: getUserAlias(uid),
    avatar: getUserAvatar(uid),
    lastSeen: getLastActivity(uid)
  };
}
```

### Data Anonymization

```typescript
// Anonymous analytics data
function trackGameEvent(eventType: string, gameId: string) {
  // Remove personally identifiable information
  const anonymousEvent = {
    type: eventType,
    gameId: hashGameId(gameId), // Hash for privacy
    timestamp: Date.now(),
    playerCount: getPlayerCount(gameId),
    // No user IDs or names
  };
  
  analytics.track(anonymousEvent);
}
```

## Security Monitoring

### Audit Logging

```typescript
// Security event logging
interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'permission_denied' | 'suspicious_activity';
  uid?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Timestamp;
  details: Record<string, any>;
}

function logSecurityEvent(event: SecurityEvent) {
  // Log to secure collection with admin-only access
  addDoc(collection(firestore, 'securityLogs'), {
    ...event,
    timestamp: serverTimestamp()
  });
}

// Usage in functions
export async function executeGameAction(gameid: string, action: GameAction) {
  try {
    // Process action
    const result = await processAction(gameid, action);
    
    // Log successful action
    logSecurityEvent({
      type: 'auth_success',
      uid: action.uid,
      details: { gameId: gameid, actionType: action.type }
    });
    
    return result;
  } catch (error) {
    // Log security failures
    logSecurityEvent({
      type: 'permission_denied',
      uid: action.uid,
      details: { gameId: gameid, error: error.message }
    });
    
    throw error;
  }
}
```

### Rate Limiting

```typescript
// Action rate limiting
const actionCounts = new Map<string, number>();
const RATE_LIMIT = 10; // actions per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const key = `${uid}:${Math.floor(now / RATE_WINDOW)}`;
  
  const count = actionCounts.get(key) || 0;
  if (count >= RATE_LIMIT) {
    logSecurityEvent({
      type: 'suspicious_activity',
      uid,
      details: { reason: 'rate_limit_exceeded', count }
    });
    return false;
  }
  
  actionCounts.set(key, count + 1);
  return true;
}
```

## Vulnerability Prevention

### SQL Injection Prevention

Firebase's NoSQL structure and SDK prevent SQL injection, but we still validate:

```typescript
// Safe query construction
function findGamesByName(namePattern: string) {
  // Firebase SDK handles sanitization
  return query(
    collection(firestore, 'games'),
    where('name', '>=', namePattern),
    where('name', '<=', namePattern + '\uf8ff')
  );
}
```

### XSS Prevention

```typescript
// Content sanitization for display
function sanitizeForDisplay(userInput: string): string {
  return userInput
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Use in Svelte components
function displayPlayerAlias(alias: string) {
  return sanitizeForDisplay(alias);
}
```

### CSRF Prevention

Firebase's authentication tokens provide CSRF protection:

```typescript
// All Firebase operations require valid auth token
// Tokens are automatically included in requests
// Firebase validates token signatures server-side

// Additional CSRF protection for sensitive operations
function validateRequestOrigin(request: any): boolean {
  const origin = request.headers.origin;
  const allowedOrigins = ['https://cluster-7c384.web.app'];
  
  return allowedOrigins.includes(origin);
}
```

## Compliance and Privacy

### GDPR Compliance

```typescript
// Data export for user rights
async function exportUserData(uid: string): Promise<UserDataExport> {
  const userData = await getDoc(doc(firestore, 'users', uid));
  const profileData = await getDoc(doc(firestore, 'profiles', uid));
  
  return {
    user: userData.data(),
    profile: profileData.data(),
    games: await getUserGameHistory(uid),
    exportDate: new Date().toISOString()
  };
}

// Data deletion for right to be forgotten
async function deleteUserData(uid: string) {
  const batch = writeBatch(firestore);
  
  // Mark user documents for deletion
  batch.update(doc(firestore, 'users', uid), { deleted: true });
  batch.update(doc(firestore, 'profiles', uid), { deleted: true });
  
  // Remove from active games
  const userGames = await getUserActiveGames(uid);
  userGames.forEach(gameId => {
    batch.update(doc(firestore, 'games', gameId), {
      [`players.${uid}`]: deleteField()
    });
  });
  
  await batch.commit();
}
```

### Data Minimization

```typescript
// Collect only necessary data
interface UserProfile {
  alias: string;           // Required for gameplay
  avatar: string;          // Required for identification
  // email, real name not stored in profile
  // location, age not collected
  // browsing history not tracked
}

// Automatic data cleanup
async function cleanupOldData() {
  const cutoffDate = new Date();
  cutoffDate.setYear(cutoffDate.getFullYear() - 1);
  
  // Remove old game records
  const oldGames = query(
    collection(firestore, 'games'),
    where('createdAt', '<', cutoffDate),
    where('completed', '==', true)
  );
  
  const snapshot = await getDocs(oldGames);
  snapshot.docs.forEach(doc => {
    deleteDoc(doc.ref);
  });
}
```

## Security Testing

### Penetration Testing

```typescript
// Security test scenarios
describe('Security Tests', () => {
  it('should reject unauthenticated requests', async () => {
    // Test without auth token
    expect(() => executeGameAction('game123', action))
      .toThrow('Authentication required');
  });
  
  it('should prevent cross-user action injection', async () => {
    // Test action with different UID
    const maliciousAction = {
      type: 'join_game',
      uid: 'victim-uid',
      alias: 'attacker'
    };
    
    expect(() => executeGameAction('game123', maliciousAction))
      .toThrow('Unauthorized action');
  });
  
  it('should sanitize user inputs', async () => {
    const xssAttempt = '<script>alert("xss")</script>';
    const sanitized = sanitizeAlias(xssAttempt);
    
    expect(sanitized).not.toContain('<script>');
  });
});
```

### Security Monitoring Dashboard

```typescript
// Real-time security metrics
interface SecurityMetrics {
  authFailures: number;
  rateLimitHits: number;
  suspiciousActions: number;
  activeUsers: number;
  averageSessionDuration: number;
}

function getSecurityMetrics(): Promise<SecurityMetrics> {
  // Query security logs for recent activity
  return aggregateSecurityData();
}
```

---

*The authentication and security infrastructure provides comprehensive protection for user data and game integrity while maintaining a seamless user experience and compliance with privacy regulations.*