# Design Overview: Cluster

Cluster is a slow-real-time space conquest game designed for long-term play. It leverages modern web technologies and a serverless backend to provide a seamless, persistent gaming experience.

## Architecture

### Frontend
- **Framework**: [SvelteKit](https://kit.svelte.dev/)
- **Styling**: Vanilla CSS with Svelte components.
- **3D Engine**: [Threlte](https://threlte.xyz/) (Three.js for Svelte) is the planned engine for rendering the 3D game space, providing an immersive experience for stellar navigation and planetary management. (Note: Integration in progress).
- **State Management**: Uses Svelte stores and a custom functional patching system to stay synchronized with the backend.

### Backend & Infrastructure
- **Hosting & Backend**: [Firebase](https://firebase.google.com/)
- **Database**:
    - **Firestore**: Stores persistent game state, player profiles, and game configuration. Game updates are handled via a **functional patching system** where incremental changes (diffs) are stored as "blocks" in subcollections.
    - **Realtime Database**: Used for low-latency player actions and commands, which are then processed by background functions.
- **Authentication**: Firebase Auth handles user identity and session management.
- **Serverless Logic**: Firebase Cloud Functions process game ticks, handle player actions, and maintain game state integrity by calculating state diffs and writing patches to Firestore.

### Game Logic
The game follows a tick-based system. Each tick updates the state of the universe based on player actions and automated processes. State is managed via `@ourway/patch`, allowing for efficient synchronization between the server and clients by sending only the changes rather than the full state.

### Coordination Layer
The `.conductor` directory contains the orchestration logic for the project's development lifecycle. It uses LLM-based agents to manage issues, coordinate feature implementation, and ensure quality through automated verification and E2E testing.

## Testing Strategy

### E2E Testing (Playwright)
End-to-end flows are verified using Playwright, running against Firebase Emulators to ensure a clean, isolated environment for every test run.

- **Unified Step Pattern**: All E2E tests MUST use the `TestStepHelper` to ensure that verifications, actions, and screenshots are synchronized. This pattern automatically generates a `README.md` for each test scenario, documenting the steps with screenshots and verification status.
- **Mobile-First**: Tests are configured to run on mobile device emulations (e.g., iPhone 12) to ensure a great mobile experience, which is critical for a "slow real-time" game that players check throughout the day.
- **Zero-Pixel Tolerance**: Visual snapshots are captured at every step to catch regressions in the UI.

### Unit Testing
- **Vitest**: Used for testing core game logic, patches, and Svelte components in isolation.
