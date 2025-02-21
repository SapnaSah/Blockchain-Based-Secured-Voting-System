# BlockVote - Secure Blockchain-Inspired Voting Platform

A modern, secure voting platform that leverages blockchain-inspired technology to ensure transparent and verifiable elections. Built with React, Express.js, and TypeScript, this platform provides a robust solution for conducting secure online elections.

## Features

- 🔒 Secure Authentication System
- 🗳️ Blockchain-Inspired Vote Recording
- 📊 Real-time Election Results
- 👥 User Profile Customization
- 🎯 Interactive Election Management
- 📱 Responsive Design
- 👨‍💼 Administrative Dashboard

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - TanStack Query for data fetching
  - Tailwind CSS with shadcn/ui components
  - WebSocket for real-time updates

- **Backend**:
  - Express.js with TypeScript
  - PostgreSQL database with Drizzle ORM
  - Passport.js for authentication
  - WebSocket server for real-time communication

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-secret-key
   ```
4. Push the database schema:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Voter Features

- Register and login to your account
- View active elections
- Cast secure votes
- View real-time election results
- Customize your profile with avatar and bio

### Admin Features

- Create and manage elections
- Add candidates to elections
- Monitor voting progress
- View detailed election statistics

## Security Features

- Blockchain-inspired vote recording ensures vote integrity
- Secure password hashing using scrypt
- Session-based authentication
- Vote verification through cryptographic hashes
- Protected routes and admin authorization

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Elections
- `GET /api/elections` - List all elections
- `POST /api/elections` - Create new election (admin only)
- `GET /api/elections/:id/candidates` - Get candidates for an election
- `GET /api/elections/:id/results` - Get election results

### Voting
- `POST /api/vote` - Cast a vote
- `POST /api/candidates` - Add candidate (admin only)

### Profile
- `PATCH /api/profile` - Update profile information
- `POST /api/profile/avatar` - Upload profile avatar

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
