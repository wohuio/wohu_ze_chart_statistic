# Statistics Chart - WeWeb Component

Beautiful statistics dashboard for time tracking data.

## Features

- **Progress Ring**: Visual completion percentage
- **Hours Display**: Actual vs Expected with progress bar
- **Entry Count**: Number of time entries with averages
- **Minutes Breakdown**: Detailed minute-level statistics
- **Auto-Refresh**: Optional 30-second auto-refresh
- **Responsive**: Works on all screen sizes

## Installation

```bash
npm install
npm run serve --port=3000
```

## API

Fetches from: `https://xv05-su7k-rvc8.f2.xano.io/api:if8X12tw/statistics`

### Parameters
- `user_id` (number): User ID to fetch statistics for
- `period` (string): "day", "week", or "month"
- `reference_date` (timestamp): Reference date in milliseconds

## WeWeb Setup

1. Add component to your page
2. Configure settings:
   - User ID (bindable to current user)
   - Period (day/week/month)
   - Reference Date (current timestamp)
   - Auto Refresh (optional)

## Display Cards

1. **Progress Ring** - Completion percentage visualization
2. **Hours Card** - Total hours vs expected with progress bar
3. **Entry Count** - Number of entries and averages
4. **Minutes Card** - Detailed breakdown in minutes
