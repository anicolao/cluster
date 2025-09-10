# Cluster - Architecture Documentation

## Overview

Cluster is an obsessive slow real-time strategy game where players compete to dominate the galaxy through diplomacy and cooperation. This document provides a comprehensive overview of the system architecture and links to detailed component documentation.

## System Architecture

Cluster follows a modern web application architecture pattern with:

- **Frontend**: SvelteKit-based single-page application
- **Backend**: Firebase Cloud Functions for serverless compute
- **Database**: Firebase Firestore + Realtime Database for data persistence
- **Authentication**: Firebase Authentication with Google provider
- **Hosting**: Firebase Hosting for static content delivery

## Technology Stack

### Frontend Technologies
- **Framework**: SvelteKit with TypeScript
- **Build Tool**: Vite
- **Styling**: Standard CSS with Svelte component scoping
- **State Management**: Redux-style stores with Firebase realtime bindings
- **Routing**: File-based routing with route groups

### Backend Technologies
- **Runtime**: Node.js 18 with TypeScript
- **Functions**: Firebase Cloud Functions v2
- **Database**: 
  - Firestore for persistent game data and user profiles
  - Realtime Database for live game state updates
- **Authentication**: Firebase Authentication

### Development Tools
- **Linting/Formatting**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest with coverage reporting
- **Package Manager**: Bun (with npm fallback)
- **Git Hooks**: Husky for pre-commit checks
- **Deployment**: Firebase CLI for automated deployment

## Component Architecture

### 1. Frontend Components
- **[Game Interface](./frontend-game-interface.md)**: Player-facing game UI including lobby, game view, and admin tools
- **[Website](./frontend-website.md)**: Marketing and informational pages
- **[Library Layer](./frontend-libraries.md)**: Shared utilities for Firebase integration, authentication, and state management

### 2. Backend Components
- **[Game Logic Functions](./backend-game-functions.md)**: Core game mechanics and action processing
- **[Profile Management](./backend-profile-functions.md)**: User profile and authentication handling
- **[Metagame Functions](./backend-metagame-functions.md)**: Game lifecycle management (creation, deletion, scheduling)

### 3. Shared Components
- **[Data Models](./shared-data-models.md)**: TypeScript interfaces and types shared between frontend and backend
- **[Game State Management](./shared-game-state.md)**: Game logic and state transition functions
- **[Common Utilities](./shared-utilities.md)**: Shared helper functions and constants

### 4. Infrastructure
- **[Database Design](./infrastructure-database.md)**: Firestore and Realtime Database schema and access patterns
- **[Authentication & Security](./infrastructure-auth-security.md)**: Firebase Authentication setup and security rules
- **[Build & Deployment](./infrastructure-build-deploy.md)**: Development workflow and deployment pipeline

## Data Flow Architecture

### Real-time Game Updates
1. Player actions are dispatched to Realtime Database
2. Firebase Functions process actions and update game state
3. Updated state is synchronized to all connected clients
4. Frontend reactively updates UI based on state changes

### Persistent Data Management
1. User profiles stored in Firestore
2. Game configurations and metadata in Firestore
3. Live game state in Realtime Database for performance
4. Automatic backup and persistence strategies

### Authentication Flow
1. Google OAuth via Firebase Authentication
2. User profile creation/update in Firestore
3. Real-time permission validation
4. Secure access to game resources

## Key Design Principles

### Scalability
- Serverless architecture for automatic scaling
- Optimized database queries and indexing
- Efficient real-time synchronization
- CDN-based static asset delivery

### Real-time Performance
- Realtime Database for low-latency updates
- Optimistic UI updates with conflict resolution
- Efficient state synchronization patterns
- Minimal payload sizes for mobile compatibility

### Security
- Firebase Security Rules for data access control
- Authentication-based authorization
- Input validation at multiple layers
- Protection against common web vulnerabilities

### Developer Experience
- TypeScript for type safety across the stack
- Shared types between frontend and backend
- Comprehensive testing with emulators
- Hot reloading and live development
- Automated code quality checks

## Getting Started

To explore the codebase:

1. **Setup**: Read [Build & Deployment](./infrastructure-build-deploy.md) for development environment setup
2. **Frontend**: Start with [Frontend Libraries](./frontend-libraries.md) to understand the foundation
3. **Backend**: Review [Game Logic Functions](./backend-game-functions.md) for core mechanics
4. **Data**: Study [Data Models](./shared-data-models.md) for type definitions and interfaces

## Related Documentation

- [Project README](../README.md): Basic project information and setup
- [Game Design Notes](../notes): Game mechanics and design decisions
- [Firebase Configuration](../firebase.json): Infrastructure configuration
- [Build Configuration](../vite.config.ts): Frontend build settings

---

*This documentation is intended to provide both high-level architectural understanding and detailed implementation guidance for developers working on the Cluster project.*