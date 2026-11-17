# Serverless Task Management Frontend

A React and TypeScript web application for signing in and viewing tasks through the Serverless Task Management API. The frontend uses AWS Cognito for authentication and sends authenticated requests to the API.

## Project Goals

- Provide a simple web interface for the task management API.
- Authenticate users with their Cognito account.
- Retrieve and display tasks belonging to the signed-in user.
- Keep API configuration in environment variables for local development and deployment.

## Architecture

```text
Browser
   |
   v
React + TypeScript application
   |                    |
   v                    v
Amazon Cognito      Task API (API Gateway)
                         |
                         v
                   Task data response
```

**Request flow:**

1. The user signs in with their Cognito username and password.
2. AWS Amplify manages the Cognito session.
3. The frontend obtains the session ID token and sends it to the task API.
4. The API returns the authenticated user's tasks for display.

## Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| React | User interface |
| TypeScript | Application code and type checking |
| Vite | Local development server and production build |
| AWS Amplify Auth | Cognito sign-in and session handling |
| npm | Dependency and script management |

## Project Structure

```text
frontend/
├── public/                    # Static public assets
├── src/
│   ├── services/
│   │   └── tasksApi.ts        # Authenticated task API requests
│   ├── App.tsx                # Sign-in and task dashboard UI
│   ├── App.css                # Application styles
│   ├── amplifyConfig.ts       # Cognito configuration from environment
│   ├── index.css              # Global styles
│   └── main.tsx               # React application entry point
├── .env.local                 # Local, untracked environment configuration
├── index.html                 # Vite HTML entry point
├── package.json               # Dependencies and npm scripts
├── tsconfig*.json             # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

## Local Development Setup

### Prerequisites

- Node.js (version supported by the installed Vite release)
- npm
- Access to a configured Cognito user pool and the deployed task API

### 1. Install dependencies

From the `task-frontend/frontend` directory:

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the `frontend` directory:

```dotenv
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>/tasks
VITE_COGNITO_USER_POOL_ID=<region>_<user-pool-id>
VITE_COGNITO_CLIENT_ID=<user-pool-client-id>
VITE_AWS_REGION=<region>
```

Use the API URL, Cognito user pool ID, and app client ID for the same deployment. Set each variable to its value only; do not include a variable name or label inside the value. Vite exposes variables prefixed with `VITE_` to browser code, so do not put secrets in this file.

### 3. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The API must allow that page's origin through its CORS configuration.

## Available Commands

```bash
npm run dev      # Start the local development server
npm run lint     # Run ESLint
npm run build    # Type-check and create a production build in dist/
npm run preview  # Preview the production build locally
```

## Configuration and Security

- `.env.local` is for local configuration and should not be committed.
- Cognito credentials are entered by the user and handled by AWS Amplify Auth.
- The frontend sends the Cognito ID token in the `Authorization` header for protected API requests.
- Production builds require the appropriate environment variables at build time.
- The API's CORS allowed origin must match the deployed frontend origin.

## Current Functionality

- Cognito username and password sign-in.
- Session restoration when the application loads.
- Authenticated retrieval and display of the signed-in user's tasks.
- Sign-out and task-list refresh.

Task creation, editing, and deletion are not currently available in the frontend.
