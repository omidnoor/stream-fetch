# StreamFetch Project Restructuring Plan

## Overview
Restructure the StreamFetch application to have a proper marketing home page with hero section, organized feature pages under a route group, and consistent navigation/footer across all pages.

---

## Current Structure Problems
1. No proper landing/home page - goes directly to YouTube downloader
2. Missing navbar and footer components
3. Pages are not organized in a clean structure
4. Sidebar navigation not suitable for public-facing home page
5. No clear separation between marketing pages and application pages

---

## New Architecture

### Route Structure

```
streamfetch/
├── src/app/
│   ├── layout.tsx                    # Root layout (minimal, no sidebar)
│   ├── page.tsx                      # 🆕 HOME/LANDING PAGE (Hero with features)
│   │
│   ├── (pages)/                      # 🆕 Route group for app pages
│   │   ├── layout.tsx                # 🆕 Pages layout (with sidebar)
│   │   │
│   │   ├── dashboard/                # Current home page functionality
│   │   │   └── page.tsx              # YouTube downloader interface
│   │   │
│   │   ├── youtube/                  # 🆕 Dedicated YouTube section
│   │   │   ├── page.tsx              # Download interface (moved from dashboard)
│   │   │   └── history/              # 🆕 Download history
│   │   │       └── page.tsx
│   │   │
│   │   ├── dubbing/                  # 🆕 Dedicated dubbing section
│   │   │   ├── page.tsx              # Create new dubbing job
│   │   │   └── jobs/                 # 🆕 All dubbing jobs
│   │   │       └── page.tsx
│   │   │
│   │   ├── studio/                   # 🆕 Video editor section
│   │   │   ├── page.tsx              # Projects list (current /projects)
│   │   │   └── editor/
│   │   │       ├── page.tsx          # Editor interface (current /editor)
│   │   │       └── [projectId]/      # 🆕 Edit specific project
│   │   │           └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx              # User settings
│   │
│   └── api/                          # No changes to API routes
│       └── ...
│
├── src/components/
│   ├── navbar.tsx                    # 🆕 Top navigation bar
│   ├── footer.tsx                    # 🆕 Footer component
│   ├── hero.tsx                      # 🆕 Hero section for home
│   ├── feature-card.tsx              # 🆕 Feature showcase cards
│   ├── sidebar.tsx                   # Updated for (pages) only
│   └── ui/                           # Existing UI components
│       └── ...
```

---

## Page Descriptions

### 1. Home Page (`/`)
**Purpose**: Marketing/landing page to introduce StreamFetch

**Sections**:
- **Navbar**: Logo, links (Features, Pricing, Docs), "Get Started" CTA
- **Hero Section**:
  - Main headline: "Download, Dub, and Edit Videos with AI"
  - Subheadline: Feature description
  - CTA buttons: "Start Free" → `/dashboard`, "Watch Demo"
  - Hero image/animation: Showcase editor interface
- **Features Section**:
  - 3 cards highlighting main features:
    1. YouTube Downloader (icon, title, description)
    2. AI Dubbing (ElevenLabs integration)
    3. Video Editor (timeline editing)
- **How It Works**: 3-step process visualization
- **Testimonials/Social Proof** (optional for future)
- **Footer**: Links, social media, copyright

**Layout**: No sidebar, full-width navbar + footer

---

### 2. Dashboard (`/(pages)/dashboard`)
**Purpose**: Main application hub - current YouTube downloader

**Content**:
- Keep current YouTube downloader interface
- Add quick stats at top (total downloads, active dubbing jobs, projects count)
- Recent activity feed on the side
- Quick links to other features

**Layout**: Sidebar + navbar + footer

---

### 3. YouTube Section (`/(pages)/youtube`)

#### `/youtube` - Download Interface
- Video URL input
- Fetch video info
- Quality selection
- Download button
- Link to history page

#### `/youtube/history` - Download History
- List of all downloaded videos
- Search and filter options
- Re-download capability
- Quick actions: "Edit", "Dub"

---

### 4. Dubbing Section (`/(pages)/dubbing`)

#### `/dubbing` - Create Dubbing Job
- Video URL or file upload
- Language selection (source and target)
- Cost estimation
- Create job button
- Active jobs preview (recent 3)

#### `/dubbing/jobs` - All Dubbing Jobs
- Table/grid of all dubbing jobs
- Status indicators (pending, processing, completed, failed)
- Progress bars for active jobs
- Download buttons for completed jobs
- Filter by status and language

---

### 5. Studio Section (`/(pages)/studio`)

#### `/studio` - Projects List
- Grid of video projects
- Thumbnail previews
- Project metadata (duration, last edited)
- Create new project button
- Delete/duplicate actions

#### `/studio/editor` - Editor Interface
- Timeline component
- Preview player
- Tools panel (trim, text, effects)
- Export options

#### `/studio/editor/[projectId]` - Edit Specific Project
- Load project by ID
- Same editor interface as above
- Save/auto-save functionality

---

### 6. Settings (`/(pages)/settings`)
- API keys (ElevenLabs, YouTube)
- Default preferences
- Account settings
- Usage statistics
- Billing (future)

---

## Component Specifications

### Navbar Component
```tsx
// For home page (/)
<Navbar variant="landing">
  - Logo (left)
  - Links: Features, Pricing, Docs
  - "Get Started" button (primary CTA)
  - "Sign In" button (secondary)
</Navbar>

// For app pages (/(pages)/*)
<Navbar variant="app">
  - Logo (left)
  - Breadcrumbs (middle)
  - Search (optional)
  - User menu (right)
  - Notifications icon
</Navbar>
```

**Features**:
- Sticky/fixed positioning
- Responsive (mobile menu)
- Dark mode support
- Active link highlighting

---

### Footer Component
```tsx
<Footer>
  - Logo + tagline
  - Navigation columns:
    * Product (Features, Pricing, Docs)
    * Company (About, Blog, Contact)
    * Legal (Privacy, Terms, GDPR)
    * Social (Twitter, GitHub, Discord)
  - Newsletter signup (optional)
  - Copyright notice
</Footer>
```

**Features**:
- Responsive grid (4 columns → 2 → 1)
- Link hover states
- Social icons

---

### Hero Component
```tsx
<Hero>
  - Main headline (h1, large, gradient text)
  - Subheadline (p, muted text)
  - CTA buttons (primary + secondary)
  - Hero visual (editor screenshot or animation)
  - Stats bar (downloads, users, videos processed)
</Hero>
```

**Features**:
- Gradient backgrounds
- Animated elements (fade-in, slide-up)
- Responsive (stack on mobile)

---

## Navigation Flow

### User Journeys

**Journey 1: New User**
```
/ (Home) → "Get Started" → /dashboard → YouTube download
```

**Journey 2: Download & Dub**
```
/youtube → Download video → "Dub this video" button → /dubbing (pre-filled URL)
```

**Journey 3: Download & Edit**
```
/youtube → Download → "Edit in Studio" → /studio → Create project → /studio/editor/[id]
```

**Journey 4: Manage Jobs**
```
/dubbing → Create job → View progress → /dubbing/jobs → Download completed
```

---

## Sidebar Navigation Updates

**New Sidebar Items** (only shown in `(pages)` layout):
1. 📊 **Dashboard** → `/dashboard`
2. 📥 **YouTube** → `/youtube`
3. 🎙️ **Dubbing** → `/dubbing`
4. 🎬 **Studio** → `/studio`
5. ⚙️ **Settings** → `/settings`

**Active States**:
- Highlight current section
- Show subsection indicators (if on `/youtube/history`, highlight "YouTube")

---

## Layout Strategy

### Root Layout (`app/layout.tsx`)
- Minimal layout
- Global styles
- Font loading
- No sidebar, no navbar (children render their own)

### Pages Layout (`app/(pages)/layout.tsx`)
- Two-column: Sidebar (left) + Main content (right)
- Navbar at top (app variant)
- Footer at bottom
- Content area with max-width and padding

### Home Layout (`app/page.tsx`)
- Full-width content
- Navbar at top (landing variant)
- Footer at bottom
- No sidebar

---

## Implementation Phases

### Phase 1: Component Foundation (Days 1-2)
- [ ] Create `navbar.tsx` component (landing + app variants)
- [ ] Create `footer.tsx` component
- [ ] Create `hero.tsx` component
- [ ] Create `feature-card.tsx` component
- [ ] Update `sidebar.tsx` with new navigation items

### Phase 2: Layout Restructure (Days 3-4)
- [ ] Create `(pages)` route group
- [ ] Create `(pages)/layout.tsx` with sidebar
- [ ] Update root `layout.tsx` (remove sidebar)
- [ ] Create new home page at `/` with hero
- [ ] Move current home to `/(pages)/dashboard`

### Phase 3: Feature Pages (Days 5-8)
- [ ] Create `/youtube` page (move download interface)
- [ ] Create `/youtube/history` page (download history)
- [ ] Create `/dubbing` page (create job interface)
- [ ] Create `/dubbing/jobs` page (job management)
- [ ] Rename `/projects` → `/studio`
- [ ] Rename `/editor` → `/studio/editor`
- [ ] Create `/studio/editor/[projectId]` dynamic route

### Phase 4: Integration & Polish (Days 9-10)
- [ ] Add cross-feature action buttons ("Dub this", "Edit this")
- [ ] Update all internal links and navigation
- [ ] Add breadcrumbs to nested pages
- [ ] Implement responsive mobile navigation
- [ ] Test all user journeys
- [ ] Fix styling inconsistencies

### Phase 5: Future Enhancements
- [ ] Add search functionality
- [ ] Implement user authentication
- [ ] Add usage analytics dashboard
- [ ] Create pricing page
- [ ] Add documentation pages
- [ ] Implement dark mode toggle

---

## Design Specifications

### Color Palette
```css
/* Primary */
--primary: 210 100% 50%        /* Blue */
--primary-dark: 210 100% 40%

/* Secondary */
--secondary: 280 60% 55%       /* Purple */

/* Accent */
--accent: 340 75% 55%          /* Pink */

/* Neutrals */
--background: 0 0% 100%        /* White */
--foreground: 222 47% 11%      /* Dark */
--muted: 210 40% 96%           /* Light gray */
--border: 214 32% 91%
```

### Typography
```css
/* Headlines */
font-family: 'Inter', sans-serif
h1: 48px (mobile: 32px), bold
h2: 36px (mobile: 24px), semibold
h3: 24px (mobile: 20px), semibold

/* Body */
p: 16px, regular
small: 14px, regular
```

### Spacing
```css
/* Container max-width */
max-width: 1280px
padding: 0 24px (mobile: 16px)

/* Section spacing */
section padding: 80px 0 (mobile: 40px 0)

/* Component spacing */
gap: 16px, 24px, 32px
```

---

## File Changes Summary

### New Files
1. `src/components/navbar.tsx`
2. `src/components/footer.tsx`
3. `src/components/hero.tsx`
4. `src/components/feature-card.tsx`
5. `src/app/(pages)/layout.tsx`
6. `src/app/(pages)/dashboard/page.tsx`
7. `src/app/(pages)/youtube/page.tsx`
8. `src/app/(pages)/youtube/history/page.tsx`
9. `src/app/(pages)/dubbing/page.tsx`
10. `src/app/(pages)/dubbing/jobs/page.tsx`
11. `src/app/(pages)/studio/page.tsx`
12. `src/app/(pages)/studio/editor/page.tsx`
13. `src/app/(pages)/studio/editor/[projectId]/page.tsx`

### Modified Files
1. `src/app/layout.tsx` - Remove sidebar, make minimal
2. `src/app/page.tsx` - Replace with landing page
3. `src/components/sidebar.tsx` - Update navigation items
4. Delete: `src/app/downloads/page.tsx` (replaced by `/youtube/history`)
5. Delete: `src/app/projects/page.tsx` (moved to `/studio`)
6. Delete: `src/app/editor/page.tsx` (moved to `/studio/editor`)

### No Changes
- All API routes remain the same
- All service layer files remain the same
- All UI components remain the same

---

## Success Metrics

✅ **Completion Criteria**:
1. Home page accessible at `/` with hero section
2. All app pages under `/(pages)` route group
3. Navbar and footer on all pages
4. Sidebar only on app pages (not home)
5. All navigation links working correctly
6. Responsive design on mobile devices
7. Cross-feature action buttons functional
8. No broken links or console errors

---

## Notes & Considerations

### Route Groups in Next.js App Router
- `(pages)` folder does NOT affect URL structure
- URLs remain: `/dashboard`, `/youtube`, `/studio`
- The parentheses make it a route group (organizational only)
- Allows separate layouts without URL nesting

### SEO Considerations
- Add proper meta tags to home page
- Include Open Graph tags for social sharing
- Add structured data (JSON-LD) for rich snippets
- Create sitemap.xml
- Add robots.txt

### Performance
- Use Next.js Image component for all images
- Lazy load below-the-fold components
- Code split large components
- Optimize font loading with next/font

### Accessibility
- Semantic HTML (nav, main, footer, section)
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all images
- Keyboard navigation support
- ARIA labels where needed
- Color contrast compliance (WCAG AA)

---

## Timeline Estimate

| Phase | Tasks | Duration |
|-------|-------|----------|
| Phase 1 | Component Foundation | 2 days |
| Phase 2 | Layout Restructure | 2 days |
| Phase 3 | Feature Pages | 4 days |
| Phase 4 | Integration & Polish | 2 days |
| **Total** | | **10 days** |

*Note: Assumes full-time development. Adjust based on actual availability.*

---

## Questions to Resolve

1. **Branding**: Do we have a logo? What colors/fonts to use?
2. **Authentication**: Will we add user accounts in this phase?
3. **Pricing**: Is this a paid product? Free tier?
4. **Content**: Who writes copy for home page (headlines, descriptions)?
5. **Analytics**: Should we add tracking (Google Analytics, PostHog)?
6. **Deployment**: Any changes needed for hosting/deployment?

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | High | Create feature branch, test thoroughly |
| Users with bookmarked URLs | Medium | Add redirects from old routes |
| Large PR, merge conflicts | Medium | Break into smaller PRs per phase |
| Design inconsistencies | Low | Create design system first |
| Performance regression | Low | Monitor bundle size, use Lighthouse |

---

Last Updated: 2025-12-05
Status: Planning Phase
