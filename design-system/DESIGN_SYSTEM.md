# KHUMMELA Design System

Design guidelines for the KHUMMELA missing persons identification platform.

## Brand Identity

KHUMMELA represents hope, community, and trust. The visual language should feel humanitarian, calm, and professional — never alarming or sensational.

**Tagline:** Together we find hope  
**Secondary:** Every person matters. Every search counts.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `khummela-primary` | `#1e3a5f` | Headers, primary buttons, brand panels |
| `khummela-primary-dark` | `#152a45` | Hover states on primary |
| `khummela-accent` | `#2d6a6a` | Secondary actions, focus rings, links |
| `khummela-accent-dark` | `#1f4d4d` | Hover on accent elements |
| `khummela-hope` | `#e8a317` | Highlights, statistics, hope indicators |
| `khummela-bg` | `#f8f6f3` | Page backgrounds |
| `khummela-surface` | `#f0ece6` | Cards, tab backgrounds, subtle panels |
| `khummela-text` | `#1a2332` | Primary text |
| `khummela-muted` | `#6b7280` | Secondary text, placeholders |
| `khummela-border` | `#e2ddd5` | Borders, dividers |
| `khummela-success` | `#2d6a4f` | Success messages, active status |
| `khummela-error` | `#c0392b` | Errors, validation |

All colors are defined as CSS variables in `app/globals.css` and mapped to Tailwind via `@theme inline`.

## Typography

- **Font family:** Geist Sans (`--font-geist-sans`) for UI text
- **Monospace:** Geist Mono for codes, IDs, technical data
- **Headings:** Bold, tight tracking (`tracking-tight`)
- **Body:** Regular weight, relaxed line height (`leading-relaxed`) for longer text

### Scale

| Element | Size | Weight |
|---------|------|--------|
| Page title | `text-4xl` / `text-5xl` | `font-bold` |
| Section title | `text-2xl` | `font-bold` |
| Card title | `text-lg` | `font-semibold` |
| Body | `text-sm` / `text-base` | `font-normal` |
| Label | `text-sm` | `font-medium` |
| Caption | `text-xs` | `font-normal` |

## Spacing & Layout

- **Max content width:** `max-w-6xl` for main layouts
- **Auth forms:** `max-w-md`
- **Page padding:** `px-6 py-12` (main), `px-6 py-4` (header)
- **Card padding:** `p-6` to `p-8`
- **Form spacing:** `space-y-4` between fields

## Components

Use shared UI components from `components/ui/`:

- `Button` — variants: `primary`, `secondary`, `outline`, `ghost`; sizes: `sm`, `md`, `lg`
- `Input` — with optional `error` prop for validation messages
- `Label` — consistent form labels

### Button Usage

- **Primary:** Main CTAs (Sign in, Create account, Get started)
- **Outline:** Secondary actions (Sign in with Google, alternative paths)
- **Ghost:** Tertiary actions (Sign out, navigation links styled as buttons)

### Cards

```tsx
<div className="rounded-2xl border border-khummela-border bg-white p-8 shadow-sm">
```

### Status / Alert Banners

- Success: `bg-khummela-success/10 text-khummela-success`
- Error: `bg-khummela-error/10 text-khummela-error`
- Info: `bg-khummela-accent/5 border border-khummela-accent/30`

## Auth Layout Pattern

Split layout for sign-in/sign-up:

- **Left panel (40%):** `bg-khummela-primary` with brand messaging, statistics, tagline
- **Right panel (60%):** White/off-white form area, centered `max-w-md`

## Iconography & Logo

- Logo mark: Letter "K" in `bg-khummela-accent` or `bg-khummela-primary` rounded square
- Avoid red alert icons unless indicating critical missing-person alerts
- Use subtle patterns (dot grid) on brand panels at low opacity

## Accessibility

- All interactive elements must have visible focus states (`focus-visible:ring-2 focus-visible:ring-khummela-accent`)
- Form inputs require associated `<Label>` elements
- Color is never the sole indicator of state — pair with text labels
- Minimum touch target: 44px height for buttons (`h-11` default)

## Tone of Voice (UI Copy)

- Empathetic, not dramatic
- Action-oriented: "Help find", "Join us", "Continue"
- Avoid: "Urgent!", sensational language, fear-based messaging
- Prefer: hope, community, reunion, coordination

## Premium UI tier (Sangam Connect)

- One primary CTA per screen; 48px minimum touch targets (`h-12`)
- Cards: `rounded-2xl bg-white shadow-sm ring-1 ring-black/5`
- Use extended components: `Card`, `Badge`, `StatCard`, `CaseCard`, `StepWizard`, `SearchBar`, `PhotoUpload`, `MatchCompare`, `BottomNav`
- Skeleton loaders for async lists; designed `EmptyState` for zero results
- Motion: 200–300ms ease-out; respect `prefers-reduced-motion`

## File Organization

```
components/
  ui/           # Generic design system components
  auth/         # Authentication-specific components
app/
  (auth)/       # Auth pages with shared layout
  dashboard/    # Protected user area
  management/   # Management-role protected area
```

When adding new features, extend the design system components rather than creating one-off styles.
