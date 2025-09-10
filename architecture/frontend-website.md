# Frontend Website Components

## Overview

The website components provide marketing, informational, and landing page functionality for Cluster. Built with SvelteKit and organized under the `(website)` route group, these components focus on user acquisition, game introduction, and public-facing content.

## Route Structure

```
src/routes/(website)/
└── +page.svelte              # Landing/marketing page
```

## Landing Page Component

### Marketing Content (`+page.svelte`)

The main landing page introduces the game concept and drives user engagement:

```svelte
<script lang="ts">
  // Marketing page logic
  import { goto } from '$app/navigation';
  
  function startPlaying() {
    goto('/lobby');
  }
</script>

<!-- Hero section -->
<section class="hero">
  <h1>Cluster</h1>
  <p class="tagline">An obsessive slow real-time strategy game</p>
  <p class="description">
    Compete to dominate the galaxy through diplomacy and cooperation. 
    No single player has the resources to win alone.
  </p>
  <button on:click={startPlaying} class="cta-button">
    Start Playing
  </button>
</section>

<!-- Game features -->
<section class="features">
  <div class="feature">
    <h3>Diplomacy-Focused</h3>
    <p>Alliance formation and meta-game play are central mechanics</p>
  </div>
  
  <div class="feature">
    <h3>Slow Real-Time</h3>
    <p>Games progress over extended periods with deliberate pacing</p>
  </div>
  
  <div class="feature">
    <h3>Galaxy Domination</h3>
    <p>Compete for territorial and resource control</p>
  </div>
</section>

<style>
  .hero {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: white;
  }
  
  .tagline {
    font-size: 1.5rem;
    margin: 1rem 0;
    color: #darkorchid;
  }
  
  .cta-button {
    background: darkorchid;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.2rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .cta-button:hover {
    background: #8b5a96;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .feature {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
  }
</style>
```

### Key Features

**User Acquisition:**
- Clear value proposition highlighting unique game mechanics
- Compelling call-to-action button
- Visual hierarchy guiding users toward engagement

**Game Introduction:**
- Explanation of core gameplay concepts
- Emphasis on diplomacy and cooperation mechanics  
- Setting expectations for slow real-time strategy

**Responsive Design:**
- Mobile-first approach with flexible grid layouts
- Scalable typography and spacing
- Touch-friendly interaction targets

## Design System

### Color Palette

```css
:root {
  --primary-color: darkorchid;      /* Primary brand color */
  --primary-dark: #8b5a96;          /* Hover states */
  --background-dark: #1a1a2e;       /* Dark backgrounds */
  --background-medium: #16213e;     /* Gradient backgrounds */
  --text-light: white;              /* Light text */
  --text-dark: #333;                /* Dark text */
  --surface-light: #f8f9fa;         /* Light surfaces */
}
```

### Typography Scale

```css
.hero h1 {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: bold;
  margin-bottom: 1rem;
}

.tagline {
  font-size: clamp(1.2rem, 4vw, 1.5rem);
  font-weight: 300;
  line-height: 1.4;
}

.description {
  font-size: clamp(1rem, 3vw, 1.2rem);
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}
```

### Component Patterns

**Hero Section Pattern:**
```svelte
<section class="hero">
  <div class="hero-content">
    <h1>Primary Headline</h1>
    <p class="tagline">Supporting tagline</p>
    <p class="description">Detailed description</p>
    <button class="cta-button">Call to Action</button>
  </div>
</section>

<style>
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  
  .hero-content {
    max-width: 800px;
    padding: 2rem;
  }
</style>
```

**Feature Grid Pattern:**
```svelte
<section class="features">
  {#each features as feature}
    <div class="feature-card">
      <div class="feature-icon">{feature.icon}</div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  {/each}
</section>

<style>
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    padding: 4rem 2rem;
  }
  
  .feature-card {
    background: var(--surface-light);
    padding: 2rem;
    border-radius: 0.5rem;
    text-align: center;
    transition: transform 0.2s ease;
  }
  
  .feature-card:hover {
    transform: translateY(-4px);
  }
</style>
```

## SEO and Accessibility

### Meta Tags and SEO

```svelte
<svelte:head>
  <title>Cluster - Slow Real-Time Strategy Game</title>
  <meta name="description" content="An obsessive slow real-time strategy game where players compete to dominate the galaxy through diplomacy and cooperation." />
  <meta name="keywords" content="strategy game, diplomacy, real-time, multiplayer, galaxy, space" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Cluster - Slow Real-Time Strategy Game" />
  <meta property="og:description" content="Compete to dominate the galaxy through diplomacy and cooperation in this unique strategy game." />
  <meta property="og:image" content="/images/og-image.jpg" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Cluster - Slow Real-Time Strategy Game" />
  <meta name="twitter:description" content="Compete to dominate the galaxy through diplomacy and cooperation." />
  <meta name="twitter:image" content="/images/twitter-card.jpg" />
  
  <!-- Canonical URL -->
  <link rel="canonical" href="https://cluster-7c384.web.app" />
</svelte:head>
```

### Accessibility Features

```svelte
<!-- Semantic HTML structure -->
<main role="main">
  <section aria-labelledby="hero-heading">
    <h1 id="hero-heading">Cluster</h1>
    <!-- Hero content -->
  </section>
  
  <section aria-labelledby="features-heading">
    <h2 id="features-heading" class="sr-only">Game Features</h2>
    <!-- Features content -->
  </section>
</main>

<!-- Screen reader friendly content -->
<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>

<!-- Keyboard navigation -->
<button 
  class="cta-button"
  on:click={startPlaying}
  on:keydown={(e) => e.key === 'Enter' && startPlaying()}
  aria-label="Start playing Cluster game"
>
  Start Playing
</button>
```

### Performance Optimization

```svelte
<script>
  import { onMount } from 'svelte';
  
  // Lazy load non-critical content
  let showFeatures = false;
  
  onMount(() => {
    // Load features after initial render
    setTimeout(() => {
      showFeatures = true;
    }, 100);
  });
</script>

<!-- Critical above-the-fold content loads immediately -->
<section class="hero">
  <!-- Hero content -->
</section>

<!-- Non-critical content loads lazily -->
{#if showFeatures}
  <section class="features">
    <!-- Features content -->
  </section>
{/if}
```

## Marketing Integration

### Analytics Tracking

```typescript
// Analytics for marketing funnel
function trackConversion(action: string) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: 'engagement',
      event_label: 'landing_page'
    });
  }
}

function startPlaying() {
  trackConversion('start_playing_clicked');
  goto('/lobby');
}
```

### A/B Testing Framework

```svelte
<script>
  import { browser } from '$app/environment';
  
  // Simple A/B testing
  let variant = 'a';
  
  if (browser) {
    const testVariant = localStorage.getItem('ab_test_variant');
    if (testVariant) {
      variant = testVariant;
    } else {
      variant = Math.random() > 0.5 ? 'a' : 'b';
      localStorage.setItem('ab_test_variant', variant);
    }
  }
</script>

{#if variant === 'a'}
  <h1>Cluster - Strategy Game</h1>
{:else}
  <h1>Cluster - Diplomatic Space Game</h1>
{/if}
```

## Content Management

### Dynamic Content Loading

```typescript
// Load marketing content from CMS or API
interface MarketingContent {
  hero: {
    title: string;
    tagline: string;
    description: string;
    ctaText: string;
  };
  features: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

async function loadMarketingContent(): Promise<MarketingContent> {
  // Could load from Firestore, external CMS, or static JSON
  const response = await fetch('/api/marketing-content');
  return response.json();
}
```

### Localization Support

```svelte
<script>
  import { _ } from 'svelte-i18n';
</script>

<h1>{$_('landing.hero.title')}</h1>
<p class="tagline">{$_('landing.hero.tagline')}</p>
<p class="description">{$_('landing.hero.description')}</p>
<button class="cta-button">
  {$_('landing.hero.cta')}
</button>
```

## Testing Strategy

### Component Testing

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import LandingPage from '../+page.svelte';

describe('Landing Page', () => {
  it('should render hero section', () => {
    const { getByText } = render(LandingPage);
    
    expect(getByText('Cluster')).toBeInTheDocument();
    expect(getByText(/slow real-time strategy/i)).toBeInTheDocument();
  });
  
  it('should navigate to lobby on CTA click', async () => {
    const { getByText } = render(LandingPage);
    const ctaButton = getByText('Start Playing');
    
    await fireEvent.click(ctaButton);
    
    // Test navigation (mock goto function)
    expect(mockGoto).toHaveBeenCalledWith('/lobby');
  });
});
```

### Visual Regression Testing

```typescript
// Using Playwright for visual testing
import { test, expect } from '@playwright/test';

test('landing page visual regression', async ({ page }) => {
  await page.goto('/');
  
  // Wait for content to load
  await page.waitForSelector('.hero h1');
  
  // Take screenshot
  await expect(page).toHaveScreenshot('landing-page.png');
});
```

## Future Enhancements

### Additional Pages

```
src/routes/(website)/
├── +page.svelte              # Landing page
├── about/+page.svelte        # About the game
├── how-to-play/+page.svelte  # Game instructions
├── blog/                     # Game development blog
└── press/+page.svelte        # Press kit and media
```

### Interactive Elements

```svelte
<!-- Game preview/demo -->
<section class="game-preview">
  <h2>See Cluster in Action</h2>
  <div class="preview-container">
    <!-- Embedded game demo or video -->
    <iframe src="/demo" title="Game Demo"></iframe>
  </div>
</section>

<!-- Newsletter signup -->
<section class="newsletter">
  <h2>Stay Updated</h2>
  <form on:submit={handleNewsletterSignup}>
    <input 
      type="email" 
      placeholder="Enter your email"
      bind:value={email}
      required
    />
    <button type="submit">Subscribe</button>
  </form>
</section>
```

---

*The website components provide an effective marketing and onboarding experience that introduces new players to the unique concepts of Cluster while maintaining excellent performance, accessibility, and SEO optimization.*