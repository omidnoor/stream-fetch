# CSS Styling Consolidation Plan

## Overview

Transform the streamfetch codebase from scattered inline styles and hardcoded values into a professional, scalable, and maintainable design system using centralized globals.css with Tailwind CSS utilities.

---

## Current State Analysis

### What's Working Well
- Tailwind CSS adoption: 97.6% (41/42 component files)
- CSS custom properties for theming in `:root`
- shadcn/ui pattern with class-variance-authority (CVA)
- Dark mode support via class-based switching

### Issues to Address

| Category | Count | Priority |
|----------|-------|----------|
| Inline styles (dynamic values) | 14 instances | Medium |
| Hardcoded hex colors | 8+ occurrences | High |
| Hardcoded Tailwind grays | 20+ occurrences | High |
| Missing design tokens | - | Medium |
| No component layer utilities | - | Medium |

---

## Target Architecture

```
globals.css
├── @tailwind base
├── @tailwind components
├── @tailwind utilities
├── @layer base
│   ├── :root (CSS Variables)
│   │   ├── Colors (semantic)
│   │   ├── Spacing tokens
│   │   ├── Typography tokens
│   │   └── Animation tokens
│   └── Base element styles
├── @layer components
│   ├── Progress bar utilities
│   ├── Slider/range styles
│   ├── Timeline utilities
│   └── Common patterns
└── @layer utilities
    └── Custom utility classes
```

---

## Phase 1: Design Token Expansion

**Goal:** Extend CSS variables to cover all design decisions

### 1.1 Add Surface Colors

```css
:root {
  /* Existing... */

  /* Surface hierarchy (dark theme) */
  --surface-0: 0 0% 4%;          /* Deepest: #0a0a0a */
  --surface-1: 0 0% 6%;          /* #0f0f0f - replace hardcoded */
  --surface-2: 0 0% 10%;         /* #1a1a1a - replace hardcoded */
  --surface-3: 0 0% 14%;         /* Elevated surfaces */
  --surface-4: 0 0% 18%;         /* Highest elevation */

  /* Interactive states */
  --hover: 0 0% 12%;
  --active: 0 0% 16%;
  --focus-ring: 263 70% 60%;     /* Same as primary */
}
```

### 1.2 Add Spacing Tokens

```css
:root {
  /* Spacing scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### 1.3 Add Animation Tokens

```css
:root {
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Animations */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 1.4 Tailwind Config Updates

```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      surface: {
        0: 'hsl(var(--surface-0))',
        1: 'hsl(var(--surface-1))',
        2: 'hsl(var(--surface-2))',
        3: 'hsl(var(--surface-3))',
        4: 'hsl(var(--surface-4))',
      },
      hover: 'hsl(var(--hover))',
      active: 'hsl(var(--active))',
    },
    transitionDuration: {
      fast: 'var(--transition-fast)',
      normal: 'var(--transition-normal)',
      slow: 'var(--transition-slow)',
    }
  }
}
```

---

## Phase 2: Component Layer Utilities

**Goal:** Extract reusable patterns into `@layer components`

### 2.1 Progress Bar Component

**Current:** Inline `style={{ width: \`${progress}%\` }}`
**Files:** `upload-area.tsx`, `export-dialog.tsx`, `dubbing/jobs/page.tsx`

```css
@layer components {
  /* Progress bar track */
  .progress-track {
    @apply relative h-2 w-full overflow-hidden rounded-full;
    background: hsl(var(--surface-2));
  }

  /* Progress bar fill - use with CSS variable */
  .progress-fill {
    @apply h-full rounded-full transition-all duration-300;
    background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-4)));
    width: var(--progress, 0%);
  }

  /* Animated progress (indeterminate) */
  .progress-fill-animated {
    @apply progress-fill;
    animation: progress-indeterminate 1.5s ease-in-out infinite;
  }
}

@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
```

**Usage:**
```tsx
// Before
<div className="h-2 rounded-full" style={{ width: `${progress}%` }} />

// After
<div className="progress-track">
  <div className="progress-fill" style={{ '--progress': `${progress}%` } as React.CSSProperties} />
</div>
```

### 2.2 Range Slider Styles

**Current:** Inline gradient backgrounds for video/volume sliders
**Files:** `video-player.tsx`

```css
@layer components {
  /* Custom range slider */
  .slider-range {
    @apply appearance-none w-full h-1.5 rounded-full cursor-pointer;
    background: hsl(var(--surface-2));
  }

  .slider-range::-webkit-slider-thumb {
    @apply appearance-none w-3 h-3 rounded-full;
    background: hsl(var(--foreground));
    cursor: grab;
  }

  .slider-range::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.2);
  }

  .slider-range::-moz-range-thumb {
    @apply w-3 h-3 rounded-full border-0;
    background: hsl(var(--foreground));
    cursor: grab;
  }

  /* Filled slider - use CSS variable for progress */
  .slider-filled {
    --slider-progress: 0%;
    background: linear-gradient(
      90deg,
      hsl(var(--foreground)) var(--slider-progress),
      hsl(var(--surface-2)) var(--slider-progress)
    );
  }
}
```

### 2.3 Timeline Positioning Utilities

**Current:** Multiple inline styles for left/width/height
**Files:** `timeline.tsx`

```css
@layer components {
  /* Timeline track */
  .timeline-track {
    @apply relative w-full overflow-hidden;
    background: hsl(var(--surface-1));
  }

  /* Timeline clip - position via CSS variables */
  .timeline-clip {
    @apply absolute rounded cursor-pointer transition-all;
    left: var(--clip-start, 0);
    width: var(--clip-width, 100px);
  }

  /* Timeline playhead */
  .timeline-playhead {
    @apply absolute top-0 bottom-0 w-0.5 pointer-events-none z-10;
    background: hsl(var(--destructive));
    left: var(--playhead-pos, 0);
  }

  /* Time markers */
  .timeline-marker {
    @apply absolute text-xs;
    color: hsl(var(--muted-foreground));
    left: var(--marker-pos, 0);
  }
}
```

### 2.4 Canvas Interaction Utilities

**Current:** `pointerEvents: 'auto'/'none'`
**Files:** `AnnotatablePDFViewer.tsx`

```css
@layer utilities {
  .interactive {
    pointer-events: auto;
  }

  .non-interactive {
    pointer-events: none;
  }
}
```

---

## Phase 3: Replace Hardcoded Colors

### 3.1 Mapping Table

| Hardcoded Value | Replacement | Files |
|-----------------|-------------|-------|
| `#0f0f0f` | `bg-surface-1` | sidebar.tsx, timeline.tsx |
| `#1a1a1a` | `bg-surface-2` | timeline.tsx |
| `bg-gray-900` | `bg-surface-1` | Multiple |
| `bg-gray-800` | `bg-surface-2` | Multiple |
| `border-gray-800` | `border-border` | Multiple |
| `text-gray-400` | `text-muted-foreground` | Multiple |
| `text-gray-500` | `text-muted-foreground` | Multiple |

### 3.2 Search & Replace Commands

```bash
# Find all hardcoded colors
grep -rn "#0f0f0f\|#1a1a1a\|gray-900\|gray-800" src/components/

# Specific replacements
# bg-[#0f0f0f] → bg-surface-1
# bg-gray-900 → bg-surface-1
# border-gray-800 → border-border
```

---

## Phase 4: File-by-File Refactoring

### Priority 1: High-Impact Components

#### 4.1 `video-player.tsx`
**Inline Styles:** 2 (gradient sliders)

```tsx
// Before (line ~364)
<input
  style={{ background: `linear-gradient(90deg, white ${progress}%, #333 ${progress}%)` }}
/>

// After
<input
  className="slider-range slider-filled"
  style={{ '--slider-progress': `${progress}%` } as React.CSSProperties}
/>
```

#### 4.2 `timeline.tsx`
**Inline Styles:** 5 (positioning)

```tsx
// Before
<div style={{ left: `${xPos}px`, width: `${width}px` }}>

// After
<div
  className="timeline-clip"
  style={{
    '--clip-start': `${xPos}px`,
    '--clip-width': `${width}px`
  } as React.CSSProperties}
>
```

#### 4.3 Progress Bars (`upload-area.tsx`, `export-dialog.tsx`, `dubbing/jobs/page.tsx`)
**Inline Styles:** 3 (width percentage)

```tsx
// Before
<div className="h-2 rounded-full bg-primary" style={{ width: `${progress}%` }} />

// After
<div className="progress-track">
  <div
    className="progress-fill"
    style={{ '--progress': `${progress}%` } as React.CSSProperties}
  />
</div>
```

### Priority 2: PDF Components

#### 4.4 `PDFViewer.tsx`
**Inline Style:** Canvas sizing

```tsx
// Before
<canvas style={{ maxWidth: '100%', height: 'auto' }} />

// After - add utility class
<canvas className="w-full h-auto" />
```

#### 4.5 `PDFPage.tsx`
**Inline Style:** Conditional display

```tsx
// Before
style={{ display: loading ? "none" : "block" }}

// After - Tailwind conditional
className={loading ? "hidden" : "block"}
```

#### 4.6 `AnnotatablePDFViewer.tsx`
**Inline Styles:** 2 (pointer events)

```tsx
// Before
style={{ pointerEvents: isDrawing ? 'auto' : 'none' }}

// After
className={isDrawing ? 'interactive' : 'non-interactive'}
```

---

## Phase 5: Updated globals.css Structure

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================
   BASE LAYER - Design Tokens & Resets
   ============================================ */
@layer base {
  :root {
    /* Brand Colors */
    --primary: 263 70% 60%;
    --primary-foreground: 210 40% 98%;

    /* Semantic Colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    /* Surface Hierarchy */
    --surface-0: 0 0% 4%;
    --surface-1: 0 0% 6%;
    --surface-2: 0 0% 10%;
    --surface-3: 0 0% 14%;
    --surface-4: 0 0% 18%;

    /* Card & Popover */
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    /* Form Elements */
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 263 70% 60%;

    /* Interactive States */
    --hover: 0 0% 12%;
    --active: 0 0% 16%;

    /* Charts */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;

    /* Spacing */
    --radius: 0.5rem;

    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 200ms ease;
    --transition-slow: 300ms ease;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
      'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
      'Helvetica Neue', sans-serif;
  }
}

/* ============================================
   COMPONENTS LAYER - Reusable Patterns
   ============================================ */
@layer components {
  /* Progress Bars */
  .progress-track {
    @apply relative h-2 w-full overflow-hidden rounded-full;
    background: hsl(var(--surface-2));
  }

  .progress-fill {
    @apply h-full rounded-full transition-all duration-300 ease-out;
    background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-4)));
    width: var(--progress, 0%);
  }

  /* Range Sliders */
  .slider-track {
    @apply appearance-none w-full h-1.5 rounded-full cursor-pointer;
    background: hsl(var(--surface-2));
  }

  .slider-track::-webkit-slider-thumb {
    @apply appearance-none w-3 h-3 rounded-full;
    background: hsl(var(--foreground));
    cursor: grab;
    transition: transform var(--transition-fast);
  }

  .slider-track::-webkit-slider-thumb:active {
    cursor: grabbing;
    transform: scale(1.2);
  }

  .slider-track::-moz-range-thumb {
    @apply w-3 h-3 rounded-full border-0;
    background: hsl(var(--foreground));
  }

  .slider-filled {
    background: linear-gradient(
      90deg,
      hsl(var(--foreground)) var(--slider-progress, 0%),
      hsl(var(--surface-2)) var(--slider-progress, 0%)
    );
  }

  /* Timeline */
  .timeline-track {
    @apply relative w-full overflow-hidden;
    background: hsl(var(--surface-1));
  }

  .timeline-clip {
    @apply absolute rounded transition-all cursor-pointer;
    left: var(--clip-start, 0);
    width: var(--clip-width, 100px);
  }

  .timeline-playhead {
    @apply absolute top-0 bottom-0 w-0.5 pointer-events-none z-10;
    background: hsl(var(--destructive));
    left: var(--playhead-pos, 0);
  }

  .timeline-marker {
    @apply absolute text-xs text-muted-foreground;
    left: var(--marker-pos, 0);
  }

  /* Cards */
  .card-surface {
    @apply rounded-lg border bg-card p-4;
  }

  .card-elevated {
    @apply card-surface shadow-lg;
    background: hsl(var(--surface-2));
  }

  /* Form Inputs */
  .input-base {
    @apply w-full rounded-md border bg-transparent px-3 py-2;
    @apply focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  /* Buttons */
  .btn-ghost {
    @apply rounded-md px-3 py-2 transition-colors;
    @apply hover:bg-[hsl(var(--hover))];
  }
}

/* ============================================
   UTILITIES LAYER - Atomic Helpers
   ============================================ */
@layer utilities {
  /* Pointer Events */
  .interactive {
    pointer-events: auto;
  }

  .non-interactive {
    pointer-events: none;
  }

  /* Text Truncation */
  .truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Scrollbar Styling */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--surface-3)) transparent;
  }

  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: hsl(var(--surface-3));
    border-radius: 3px;
  }

  /* Glass Effect */
  .glass {
    backdrop-filter: blur(12px);
    background: hsl(var(--background) / 0.8);
  }

  /* Gradient Text */
  .gradient-text {
    background: linear-gradient(135deg, hsl(var(--chart-1)), hsl(var(--chart-4)), hsl(var(--chart-5)));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes progress-indeterminate {
  0% { transform: translateX(-100%); width: 30%; }
  50% { width: 50%; }
  100% { transform: translateX(400%); width: 30%; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## Phase 6: Tailwind Config Updates

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Existing semantic colors...
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ...

        // NEW: Surface hierarchy
        surface: {
          0: "hsl(var(--surface-0))",
          1: "hsl(var(--surface-1))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
          4: "hsl(var(--surface-4))",
        },
        hover: "hsl(var(--hover))",
        active: "hsl(var(--active))",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "progress-indeterminate": "progress-indeterminate 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## Implementation Checklist

### Phase 1: Design Tokens
- [ ] Add surface color variables to globals.css
- [ ] Add animation/transition tokens
- [ ] Update tailwind.config.ts with new color mappings

### Phase 2: Component Layer
- [ ] Add progress bar utilities
- [ ] Add slider/range utilities
- [ ] Add timeline utilities
- [ ] Add pointer event utilities

### Phase 3: Hardcoded Color Replacement
- [ ] Replace `#0f0f0f` with `bg-surface-1`
- [ ] Replace `#1a1a1a` with `bg-surface-2`
- [ ] Replace `bg-gray-900` with `bg-surface-1`
- [ ] Replace `bg-gray-800` with `bg-surface-2`
- [ ] Replace `border-gray-800` with `border-border`
- [ ] Replace `text-gray-400/500` with `text-muted-foreground`

### Phase 4: Component Refactoring
- [ ] video-player.tsx - Convert slider gradients
- [ ] timeline.tsx - Convert positioning to CSS variables
- [ ] upload-area.tsx - Use progress-track/fill
- [ ] export-dialog.tsx - Use progress-track/fill
- [ ] dubbing/jobs/page.tsx - Use progress-track/fill
- [ ] PDFViewer.tsx - Replace inline canvas sizing
- [ ] PDFPage.tsx - Replace display toggle
- [ ] AnnotatablePDFViewer.tsx - Use interactive/non-interactive

### Phase 5: Testing & Validation
- [ ] Visual regression testing
- [ ] Dark mode verification
- [ ] Responsive design check
- [ ] Animation performance check

---

## Benefits After Consolidation

| Metric | Before | After |
|--------|--------|-------|
| Inline styles | 14 | 0 (CSS variables only) |
| Hardcoded colors | 28+ | 0 |
| CSS file size | ~1KB | ~4KB |
| Design tokens | 25 | 50+ |
| Reusable components | 0 | 8+ |
| Theme consistency | Partial | Complete |
| Maintainability | Medium | High |

---

## Quick Reference: CSS Variable Pattern

```tsx
// TypeScript pattern for CSS variables
<div
  className="progress-fill"
  style={{ '--progress': `${value}%` } as React.CSSProperties}
/>
```

This pattern:
- Keeps dynamic values in JavaScript
- Moves all styling to CSS
- Maintains type safety
- Enables CSS transitions on the variable
