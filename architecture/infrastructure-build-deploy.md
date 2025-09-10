# Infrastructure - Build & Deployment

## Overview

Cluster uses a modern development and deployment pipeline built around Firebase tools, SvelteKit, and automated quality checks. The infrastructure supports local development, automated testing, and seamless production deployment with a focus on developer productivity and code quality.

## Development Environment

### Local Development Setup

```bash
# Install dependencies
npm install          # Install frontend dependencies
cd functions && npm install  # Install backend dependencies

# Start local development
firebase emulators:start     # Start Firebase emulators
npm run dev                  # Start SvelteKit dev server (port 5173)

# Development URLs
# Frontend: http://localhost:5173
# Firebase UI: http://localhost:4000
# Firestore: localhost:8080
# Realtime DB: localhost:9000
# Functions: localhost:5001
```

### Firebase Emulator Configuration

```json
// firebase.json - Emulator setup
{
  "emulators": {
    "auth": {
      "host": "0.0.0.0",
      "port": 9099
    },
    "functions": {
      "host": "0.0.0.0", 
      "port": 5001
    },
    "firestore": {
      "host": "0.0.0.0",
      "port": 8080
    },
    "hosting": {
      "host": "0.0.0.0",
      "port": 5002
    },
    "database": {
      "host": "0.0.0.0",
      "port": 9000
    },
    "ui": {
      "host": "0.0.0.0",
      "enabled": true
    },
    "singleProjectMode": true
  }
}
```

**Emulator Benefits:**
- **Offline Development**: Work without internet connection
- **Data Isolation**: Test data doesn't affect production
- **Fast Iteration**: Instant deployment of function changes
- **Debugging Tools**: Rich debugging interface via Firebase UI

### Environment Configuration

```typescript
// src/lib/firebase.ts - Environment detection
if (!import.meta.env.PROD) {
  // Development: Use local emulators
  connectFirestoreEmulator(firestore, "localhost", 8080);
  connectDatabaseEmulator(realtimeDB, "localhost", 9000);
} else {
  // Production: Use live Firebase services
  // Configuration automatically loaded from firebaseConfig
}
```

## Build System Architecture

### SvelteKit Configuration

```javascript
// svelte.config.js
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
  preprocess: vitePreprocess(),
  
  kit: {
    adapter: adapter({
      pages: "build",        // Output directory
      assets: "build",       // Static assets
      fallback: null,        // SPA fallback
      precompress: false     // Disable compression
    }),
    
    // Path aliases for clean imports
    alias: {
      "$common/*": "./functions/src/common/*"
    }
  },
  
  // Suppress accessibility warnings during development
  onwarn: (warning, handler) => {
    if (warning.code.startsWith("a11y")) {
      return;
    }
    handler(warning);
  }
};
```

### Vite Configuration

```typescript
// vite.config.ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import execute from "rollup-plugin-shell";

export default defineConfig({
  plugins: [
    sveltekit(),
    // Auto-generate version on build
    execute({ 
      commands: ["./bin/version"], 
      hook: "buildStart" 
    })
  ],
  
  test: {
    include: ["tests/**/*.{test,spec}.{js,ts}"],
    coverage: {
      exclude: [
        "build/**",
        "functions/**", 
        "svelte.config.js"
      ]
    }
  },
  
  server: {
    fs: {
      // Allow access to functions directory
      allow: ["functions"]
    }
  }
});
```

### TypeScript Configuration

```json
// tsconfig.json - Frontend TypeScript config
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

```json
// functions/tsconfig.json - Backend TypeScript config
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

## Code Quality Pipeline

### Biome Configuration

```json
// biome.json - Unified linting and formatting
{
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noUnusedTemplateLiteral": "off"
      },
      "performance": {
        "noDelete": "off"
      }
    }
  }
}
```

### NPM Scripts

```json
// package.json - Build and quality scripts
{
  "scripts": {
    // Development
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    
    // Quality checks
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "format": "biome format --write src tests",
    "lint": "biome check src tests",
    "lint:fix": "biome check --apply src tests",
    
    // Testing
    "test": "vitest run --coverage",
    "test:watch": "vitest watch --coverage",
    
    // CI/CD
    "ci": "biome ci src tests",
    "deploy": "npm run build && firebase deploy --only hosting,firestore"
  }
}
```

### Git Hooks with Husky

```bash
# .husky/pre-commit - Pre-commit quality checks
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and type checking
npm run lint
npm run check

# Run tests
npm run test

# Format code
npm run format
```

## Testing Infrastructure

### Vitest Configuration

```typescript
// vitest.config.ts (part of vite.config.ts)
test: {
  include: ["tests/**/*.{test,spec}.{js,ts}"],
  coverage: {
    exclude: [
      "build/**",
      "functions/**",
      "svelte.config.js",
      ...coverageConfigDefaults.exclude
    ],
    reporter: ['text', 'html', 'lcov']
  },
  environment: 'jsdom', // For Svelte component testing
  setupFiles: ['tests/setup.ts']
}
```

### Firebase Functions Testing

```typescript
// functions/tests/setup.ts
import { initializeTestEnvironment } from '@firebase/testing';

export const testEnv = initializeTestEnvironment({
  projectId: 'test-project',
  firestore: {
    host: 'localhost',
    port: 8080
  },
  database: {
    host: 'localhost', 
    port: 9000
  }
});

// Test utilities
export function getTestFirestore() {
  return testEnv.firestore();
}

export function getTestDatabase() {
  return testEnv.database();
}
```

### Test Examples

```typescript
// tests/gamestate.test.ts
import { describe, it, expect } from 'vitest';
import { game, initialGameState } from '$common/gamestate';

describe('Game State Logic', () => {
  it('should handle join_game action', () => {
    const options = {
      name: 'Test Game',
      playerCount: 4,
      playersNeeded: 4,
      started: false,
      players: {}
    };
    
    const state = initialGameState(options);
    const action = {
      type: 'join_game' as const,
      uid: 'player1',
      alias: 'TestPlayer',
      avatar: 'avatar1'
    };
    
    const newState = game(state, action);
    
    expect(newState.options.players['player1']).toBeDefined();
    expect(newState.options.playersNeeded).toBe(3);
  });
});
```

## Deployment Pipeline

### Firebase Hosting Configuration

```json
// firebase.json - Hosting configuration
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Firebase Functions Deployment

```json
// firebase.json - Functions configuration
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "nodejs18",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint",
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ]
}
```

### Deployment Scripts

```bash
# bin/deploy - Production deployment script
#!/bin/bash

set -e  # Exit on any error

echo "🔧 Building frontend..."
npm run build

echo "🔧 Building functions..."
cd functions
npm run build
cd ..

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting,functions,firestore

echo "✅ Deployment complete!"
```

### Environment Variables

```bash
# .env.local - Development environment
VITE_FIREBASE_API_KEY=development-key
VITE_FIREBASE_PROJECT_ID=cluster-7c384-dev
VITE_ENVIRONMENT=development

# Production environment variables set in Firebase
firebase functions:config:set environment.type=production
firebase functions:config:set api.key=production-key
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd functions && npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run check
    
    - name: Run tests
      run: npm run test
    
    - name: Build application
      run: npm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for production
      run: npm run build
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        projectId: cluster-7c384
```

## Performance Optimization

### Build Optimization

```typescript
// vite.config.ts - Production optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          vendor: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          svelte: ['svelte', '@sveltejs/kit']
        }
      }
    },
    // Enable source maps for debugging
    sourcemap: true,
    // Minimize bundle size
    minify: 'terser',
    // Target modern browsers
    target: 'es2020'
  }
});
```

### Asset Optimization

```bash
# Static asset optimization
# Images compressed and converted to WebP
npm install -g @squoosh/cli

# Compress images during build
squoosh-cli --webp --resize 128 static/images/*.png
```

### Caching Strategy

```typescript
// Service worker for caching (if implemented)
const CACHE_NAME = 'cluster-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/static/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});
```

## Monitoring and Analytics

### Build Analytics

```typescript
// Build time tracking
const buildStart = Date.now();

// In vite.config.ts
export default defineConfig({
  plugins: [
    {
      name: 'build-analytics',
      buildEnd() {
        const duration = Date.now() - buildStart;
        console.log(`Build completed in ${duration}ms`);
      }
    }
  ]
});
```

### Performance Monitoring

```typescript
// Frontend performance tracking
if (typeof window !== 'undefined') {
  // Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}
```

## Security in Build Process

### Dependency Scanning

```json
// package.json - Security audit
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix"
  }
}
```

### Environment Validation

```typescript
// Build-time environment validation
function validateEnvironment() {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
  ];
  
  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }
}

// Run during build
validateEnvironment();
```

### Secrets Management

```bash
# Firebase secrets (not committed to repo)
firebase functions:secrets:set API_SECRET
firebase functions:secrets:set DATABASE_URL

# Access in functions
import { defineSecret } from 'firebase-functions/v2/params';
const apiSecret = defineSecret('API_SECRET');
```

## Troubleshooting

### Common Build Issues

```bash
# Clear build cache
rm -rf .svelte-kit build functions/lib

# Reset dependencies
rm -rf node_modules functions/node_modules
npm install
cd functions && npm install

# Firebase emulator issues
firebase logout
firebase login
firebase use --add
```

### Debug Mode

```bash
# Verbose build output
DEBUG=vite:* npm run build

# Firebase debug mode
firebase --debug emulators:start

# Function logs
firebase functions:log --only gameAction
```

---

*The build and deployment infrastructure provides a robust, automated pipeline that ensures code quality, security, and performance while supporting rapid development iteration and reliable production deployments.*