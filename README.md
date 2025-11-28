# Crownboard

A Next.js 16 App Router application for displaying live leaderboards for Whop businesses. This app runs inside Whop's iframe and uses Whop authentication.

## Features

- **Top Spenders**: Leaderboard showing customers who have spent the most
- **Top Affiliates**: Leaderboard showing affiliates with the highest earnings
- **Most Active Members**: Leaderboard showing members with the most activity

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Whop API key:
```
WHOP_API_KEY=your_whop_api_key_here
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard with tabs
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Redirects to /dashboard
│   └── globals.css            # Global styles
├── components/
│   └── LeaderboardTable.tsx   # Reusable leaderboard component
├── lib/
│   ├── whop.ts                # Whop API client and auth helpers
│   └── leaderboard.ts         # Leaderboard calculation functions
└── package.json
```

## Authentication

This app uses Whop's iframe authentication. The `x-whop-user-token` header is automatically provided by Whop when the app is loaded in their iframe.

- No login/signup UI required
- Token verification is handled in `lib/whop.ts`
- If token is missing, users see: "Please open this app inside Whop."

## API Integration

Currently, the app uses mock data. To integrate with the real Whop API:

1. Update `getWhopUser()` in `lib/whop.ts` to verify tokens with Whop's API
2. Implement real API calls in:
   - `fetchPayments()`
   - `fetchAffiliates()`
   - `fetchMembers()`

All functions have TODO comments indicating where real API calls should be added.

## Styling

The app uses Tailwind CSS with a dark theme optimized for Whop's iframe environment.

## License

Private - Whop App Store



# crown-board
