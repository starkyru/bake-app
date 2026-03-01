# Bake App — Design System Documentation

## Design Tokens

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #8B4513 | Brand color, headers, primary buttons |
| Secondary | #D4A574 | Accents, hover states, secondary elements |
| Accent | #2E7D32 | Success states, in-stock, completed |
| Warn | #C62828 | Errors, alerts, out-of-stock, cancelled |
| Amber | #F57F17 | Warnings, low-stock, pending |
| Background | #FAF3E8 | Page backgrounds (light theme) |
| Surface | #FFFFFF | Cards, panels, dialogs |
| Text Primary | #2C1810 | Headings |
| Text Secondary | #5D4037 | Body text |

### Kitchen Dark Theme
| Token | Hex | Usage |
|-------|-----|-------|
| Background | #1A1A2E | Page background |
| Surface | #16213E | Cards, panels |
| Text | #FFFFFF | All text |
| New | #4FC3F7 | New orders |
| In Progress | #FFB74D | Active orders |
| Ready | #81C784 | Completed orders |

### Typography
- **UI Font**: Inter (300-700 weights)
- **Numeric Font**: JetBrains Mono (prices, quantities, timers)
- **Scale**: 12px caption, 14px body, 16px subtitle, 20px title, 24px h3, 32px h2, 48px h1

### Spacing
8px base grid: 4px (xs), 8px (sm), 16px (md), 24px (lg), 32px (xl), 48px (xxl)

### Touch Targets
- Default: 48px minimum
- POS buttons: 64px minimum
- Kitchen display: 80px minimum

## Screen Inventory

### POS App (port 4200) — Roles: Cashier, Barista
- Login
- Shift Open / Close
- Main POS (category tabs + product grid + cart)
- Payment Dialog (cash/card/split)
- Order History
- Refund Flow

### Admin Dashboard (port 4201) — Roles: Owner, Manager
- User Management
- Product Management
- Category Management
- Recipe Editor
- Settings (general, tax, POS config)
- Location Management

### Kitchen Screen (port 4202) — Roles: Chef, Baker, Barista
- Order Queue (Kanban: New → In Progress → Ready)
- Order Detail / Recipe View
- Production Plan
- Timer Display

### Manager Dashboard (port 4203) — Roles: Owner, Manager, Accountant
- Overview (KPIs, alerts, charts)
- Inventory (stock levels, low-stock alerts)
- Finance (P&L, revenue, costs)
- Sales Analytics
- Production Planning
- Staff Overview

## Navigation Patterns
- **POS**: Top nav bar (minimal, touchscreen-optimized)
- **Admin/Manager**: Fixed sidebar (240px) + content area
- **Kitchen**: Tab navigation (large touch targets, dark theme)

## Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768-1024px
- Desktop: > 1024px
- POS is optimized for 10" tablets
- Kitchen is optimized for 15"+ displays
