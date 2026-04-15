# Design Overview: Cluster

Cluster is a slow-real-time space conquest game designed for long-term play. It leverages modern web technologies and a serverless backend to provide a seamless, persistent gaming experience.

## Architecture

### Frontend
- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Styling**: Vanilla CSS with Svelte components.
- **3D Engine**: [Threlte](https://threlte.xyz/) (Three.js for Svelte) is used for rendering the 3D game space, providing an immersive experience for stellar navigation and planetary management.

### Backend & Infrastructure
- **Hosting & Backend**: [Firebase](https://firebase.google.com/)
- **Database**:
    - **Firestore**: Stores persistent game state, player profiles, and game configuration. Game updates are handled via a "patch" system where incremental changes are stored as documents.
    - **Realtime Database**: Used for low-latency player actions and commands, which are then processed by background functions.
- **Authentication**: Firebase Auth handles user identity and session management.
- **Serverless Logic**: Firebase Cloud Functions process game ticks, handle player actions, and maintain game state integrity.

### Game Logic
The game follows a tick-based system. Each tick updates the state of the universe based on player actions and automated processes (like orbital mechanics or resource production). State is managed via a functional patching system, allowing for efficient synchronization between the server and clients.

### Coordination Layer
The `.conductor` directory contains the orchestration logic for the project's development lifecycle. It uses LLM-based agents to manage issues, coordinate feature implementation, and ensure quality through automated verification and E2E testing.

## Testing Strategy
- **Unit Testing**: Vitest for component and logic testing.
- **E2E Testing**: Playwright for end-to-end flows, utilizing Firebase Emulators for consistent and isolated testing environments. Screenshots and automated documentation generation are integrated into the E2E suite to provide visual regression testing and up-to-date documentation.
