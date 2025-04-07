# BlockVote - Secure Blockchain-Inspired Voting Platform

A modern, secure voting platform that leverages blockchain-inspired technology to ensure transparent and verifiable elections. Built with React, Express.js, and TypeScript, this platform provides a robust solution for conducting secure online elections with flexible database options.

## Features

- 🔒 Secure Authentication System
- 🗳️ Blockchain-Inspired Vote Recording
- 📊 Real-time Election Results
- 👥 User Profile Customization
- 🎯 Interactive Election Management
- 📱 Responsive Design
- 👨‍💼 Administrative Dashboard
- 💾 Automatic fallback to in-memory database when MySQL isn't available

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - TanStack Query for data fetching
  - Tailwind CSS with shadcn/ui components
  - WebSocket for real-time updates

- **Backend**:
  - Express.js with TypeScript
  - MySQL database with Drizzle ORM
  - In-memory storage fallback with pre-seeded data
  - Passport.js for authentication
  - WebSocket server for real-time communication

## Database Flexibility

The application is designed to work with either:

1. **MySQL Database** (preferred for production):
   - Complete data persistence
   - Optimized for production workloads
   - Secure data storage and retrieval

2. **In-Memory Storage** (automatic fallback):
   - Activates automatically when MySQL is unavailable
   - Pre-seeded with sample data (elections, candidates, users)
   - Perfect for demos and testing
   - No need for database setup

This dual approach ensures the application can run in any environment, whether MySQL is available or not.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL database (optional - falls back to in-memory if unavailable)
- VS Code (recommended) or any other IDE

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd blockvote
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (for MySQL usage):
   Create a `.env` file in the root directory:
   ```env
   # MySQL configuration (if available)
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your-password
   MYSQL_DATABASE=blockvote
   
   # Session secret
   SESSION_SECRET=your-secret-key
   ```

4. Create MySQL database (if using MySQL):
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS blockvote;"
   ```

5. Push the database schema (if using MySQL):
   ```bash
   npm run db:push
   ```

6. Create uploads directory:
   ```bash
   mkdir uploads
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

### VS Code Setup (Recommended)

1. Install recommended extensions:
   - ESLint
   - Prettier
   - TypeScript and JavaScript Language Features
   - Tailwind CSS IntelliSense

2. Configure VS Code settings:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
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