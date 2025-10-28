# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeWeb component displaying time tracking statistics with a dashboard layout. Built as a single-file Vue component with no external chart libraries.

## Development Commands

```bash
npm install          # Install dependencies
npm run serve        # Run local dev server with WeWeb CLI
npm run build        # Build component for production
```

## Architecture

### Component Structure

**Main Component:** `src/wwElement.vue` (single-file Vue component)
- Template: Dashboard with header, 3 stat cards, and conditional breakdowns
- Script: Data fetching, period management, and formatting logic
- Style: Scoped CSS with responsive design

**Configuration:** `ww-config.js` (WeWeb editor settings)
- Defines 3 bindable properties: userId, period, referenceDate
- Property defaults and editor labels (EN/DE)

### Key Design Decisions

1. **Pure SVG Progress Ring** - No Chart.js or external libraries
   - Uses `stroke-dasharray` and `stroke-dashoffset` for animation
   - Located in progress-card section (lines 48-91)

2. **Local Period State** - Component maintains its own period state
   - `localPeriod` in data() overrides `content.period` prop
   - Allows period selector buttons to work without parent re-binding
   - Always uses `Date.now()` for reference_date (ignores prop)

3. **Conditional Breakdowns** - Different views for week vs month
   - Week view (lines 137-159): Shows 7 daily bars (Mo-So)
   - Month view (lines 162-184): Shows 12 monthly bars (Jan-Dez)
   - Computed properties: `weeklyDayBreakdown`, `monthlyYearBreakdown`

## API Integration

**Endpoint:** `https://xv05-su7k-rvc8.f2.xano.io/api:if8X12tw/statistics`

**Query Parameters:**
- `user_id` (integer)
- `period` (string): "day", "week", or "month"
- `reference_date` (timestamp in milliseconds)

**Response Shape:**
```javascript
{
  period_label: string,          // e.g. "KW 44"
  period_start: number,          // Unix timestamp
  period_end: number,            // Unix timestamp
  total_hours: number,
  expected_hours: number,
  difference_hours: number,
  completion_percentage: number,
  total_minutes: number,
  expected_minutes: number,
  difference_minutes: number,
  entries: [                     // Array of individual time entries
    {
      clock_in: number,          // Unix timestamp
      duration_minutes: number
    }
  ]
}
```

## Component Behavior

### Data Flow
1. Component mounts → initializes `localPeriod` from prop
2. Calls `loadData()` → fetches from API with current date
3. Period selector buttons update `localPeriod` → triggers new fetch
4. Stats displayed in 3 cards + conditional breakdown

### Watchers
- `content.userId` → reload data
- `content.period` → update localPeriod and reload (immediate: true)

### Header Behavior
- Shows formatted period_start date (e.g. "28-10-2025")
- Date range below: "28.10.2025 - 03.11.2025"
- Manual refresh button (auto-refresh removed as of recent commits)

## Styling Notes

- CSS Grid for responsive card layout: `repeat(auto-fit, minmax(280px, 1fr))`
- Card hover effects: translateY(-4px) with shadow transition
- Progress animations: 1s ease transitions for ring and bars
- Mobile responsive: switches to single column at 768px
- German labels throughout UI ("Fortschritt", "Arbeitszeit", etc.)

## Recent Changes (from git history)

- Added monthly year breakdown for month view
- Added period selector with weekly/daily breakdown
- Replaced auto-refresh with manual refresh button
- Fixed header date format and auto-refresh functionality
