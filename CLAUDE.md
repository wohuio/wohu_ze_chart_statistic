# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WeWeb component that displays time tracking statistics in a beautiful dashboard layout with cards and visualizations.

## Key Features

- **SVG Progress Ring** - Pure SVG/CSS circle chart (no external libraries)
- **Card-based Dashboard** - 4 stat cards in responsive grid
- **Real-time Updates** - Fetches from Xano API with optional auto-refresh
- **Responsive Design** - Grid layout adapts to screen size

## Development Commands

```bash
npm install          # Install dependencies
npm run serve        # Run local dev server
npm run build        # Build for production
```

## File Structure

- **src/wwElement.vue** - Main component with dashboard and API logic
- **ww-config.js** - WeWeb configuration with 4 bindable properties

## API Integration

**Endpoint:** `https://xv05-su7k-rvc8.f2.xano.io/api:6iYtDb6K/statistics`

**Query Parameters:**
- `user_id` (integer) - Required
- `period` (string) - "day", "week", or "month"
- `reference_date` (timestamp) - Unix timestamp in milliseconds

**Response Structure:**
```javascript
{
  period_label: "KW 44",
  total_hours: 0.73,
  expected_hours: 40,
  difference_hours: -39.27,
  completion_percentage: 1.8,
  entry_count: 22,
  average_hours_per_entry: 0.03,
  total_minutes: 44,
  expected_minutes: 2400,
  difference_minutes: -2356,
  // ... more fields
}
```

## Component Structure

### Cards
1. **Progress Ring Card** - SVG circle with completion percentage
2. **Hours Card** - Main hours display with progress bar
3. **Entry Count Card** - Number of entries and averages
4. **Minutes Card** - Detailed minute breakdown

### Visualizations
- **Progress Ring**: SVG circle with `stroke-dasharray` animation
- **Progress Bar**: CSS width transition for smooth animation
- **Color Coding**: Green for positive, red for negative differences

## Design Decisions

- No external chart libraries (Chart.js, etc.) - keeps bundle small
- Pure SVG for progress ring - more control over styling
- Card-based layout - easy to understand and customize
- CSS Grid for responsive layout - no media query complexity
