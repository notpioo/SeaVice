# SeaVice Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern service platforms like Fiverr, Upwork, and Notion, combined with contemporary SaaS landing pages. Focus on trust-building, clear service presentation, and seamless user journeys.

**Core Principles**:
- Professional yet approachable aesthetic
- Trust and credibility through social proof
- Clear hierarchy guiding users to action
- Seamless role-based navigation experiences

## Typography System

**Font Stack**: 
- Primary: Inter (headings, UI elements) - Google Fonts
- Secondary: System UI fallback for body text

**Hierarchy**:
- Hero Headline: text-5xl md:text-6xl lg:text-7xl, font-bold, tracking-tight
- Section Headers: text-3xl md:text-4xl, font-bold
- Subsections: text-xl md:text-2xl, font-semibold
- Body Large: text-lg, font-normal
- Body Standard: text-base, font-normal
- Captions/Labels: text-sm, font-medium

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Component padding: p-6 to p-8
- Section spacing: py-16 md:py-24 lg:py-32
- Element gaps: gap-6 to gap-12
- Container padding: px-4 md:px-8

**Grid Foundation**:
- Max container width: max-w-7xl mx-auto
- Service cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Feature sections: grid-cols-1 lg:grid-cols-2
- Content reading width: max-w-3xl for text blocks

## Component Library

### Navigation
- Fixed top navbar with blur backdrop (backdrop-blur-lg)
- Logo left, navigation center, auth buttons right on desktop
- Mobile: hamburger menu with slide-in drawer
- Transparent on hero, solid background on scroll
- Height: h-16 md:h-20
- Include: Logo, Home, Services, Login/Register CTAs

### Hero Section (Landing Page)
- Full viewport height: min-h-screen with flex centering
- Two-column layout on desktop: 60/40 split (content/visual)
- Large hero image on right side showing modern digital workspace or abstract tech visualization
- Left content: Headline, subheadline (max-w-xl), dual CTAs (primary + secondary)
- Trust indicators below CTAs: "10,000+ Services Delivered" with small icons
- Subtle gradient overlay on hero image

### Service Cards (Services Page)
- Card-based grid layout with hover lift effect (hover:scale-105 transition)
- Each card contains: Icon/image thumbnail, service title, brief description, provider info, pricing indicator
- Card padding: p-6
- Border radius: rounded-xl
- Include subtle shadow: shadow-lg
- CTA button at bottom of each card

### Trust Section
- Three-column stats showcase: grid-cols-1 md:grid-cols-3
- Large numbers (text-4xl font-bold) above labels
- Icons from Heroicons above each stat
- Centered alignment

### Features Showcase
- Alternating two-column sections (image left/right)
- Each feature: Icon, headline, description list with checkmarks
- Image placeholders: aspect-video rounded-2xl
- Spacing between features: space-y-24

### Call-to-Action Sections
- Full-width sections with centered content: max-w-4xl mx-auto text-center
- Prominent headline, supporting text, button group
- Background treatment with subtle pattern or gradient
- Padding: py-20 md:py-28

### Forms (Login/Register)
- Centered card layout: max-w-md mx-auto
- Card with elevated shadow and border
- Input fields: Full width, h-12, rounded-lg, with focus states
- Labels: text-sm font-medium mb-2
- Password visibility toggle
- "Remember me" checkbox for login
- Social login options with icon buttons
- Form spacing: space-y-4
- Submit button: Full width, h-12

### Admin Panel
- Sidebar navigation: w-64 fixed left, full height
- Main content area: ml-64 with top bar
- Top bar: h-16 with user profile dropdown right-aligned
- Sidebar items: Icon + label, hover background states
- Data tables with: Alternating row treatment, action buttons, search/filter bar
- Table actions: Edit, Delete icons from Heroicons

### Footer
- Multi-column layout: grid-cols-2 md:grid-cols-4
- Sections: About, Services, Support, Connect
- Newsletter signup form embedded
- Social media icon links
- Copyright and legal links at bottom
- Background distinct from main content
- Padding: pt-16 pb-8

## Interaction Patterns

**Buttons**:
- Primary: px-8 py-3, rounded-full, font-semibold, with hover:scale-105 transition
- Secondary: Same sizing, outlined variant
- Icon buttons: w-10 h-10, rounded-full, flex items-center justify-center

**Cards & Containers**:
- Border radius: rounded-xl to rounded-2xl
- Shadows: shadow-md default, shadow-xl on hover
- Transitions: transition-all duration-300

**Microinteractions**:
- Hover states on all interactive elements (minimal, subtle)
- Loading states for forms and data fetching
- Success/error toast notifications (top-right positioned)

## Images

**Required Images**:
1. **Hero Image**: Modern workspace with laptop showing digital services dashboard, vibrant and professional (right side of hero, 50% viewport width)
2. **Feature Images**: 3-4 product screenshots or illustrations showing service process, dashboard interfaces
3. **Service Thumbnails**: Icon-based or simple illustrations for each service category
4. **Trust Badges**: Client logos or certification icons (if available, use placeholders)

**Image Treatment**:
- Aspect ratios: 16:9 for features, 1:1 for service cards
- Border radius: rounded-xl to rounded-2xl
- Lazy loading for performance
- Responsive srcset for different viewports

## Responsive Strategy

**Breakpoints**:
- Mobile: < 768px - Single column, stacked layout, full-width buttons
- Tablet: 768px - 1024px - Two-column grids, optimized spacing
- Desktop: > 1024px - Full multi-column layouts, expanded spacing

**Mobile Optimizations**:
- Touch-friendly tap targets: minimum h-12
- Simplified navigation with drawer menu
- Reduced text sizes (one step down from desktop)
- Stacked service cards with full width
- Sticky CTAs on mobile where appropriate