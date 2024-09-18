# Income Verification App

A comprehensive application built using Next.js and shadcn/ui for generating and verifying income reports. This app demonstrates client-side rendering with React hooks and integrates with the Basiq API to handle token generation and report requests.

## Features

- **User Authentication**: Simple login page to generate an authentication token.
- **Report Generation**: Generate income verification reports via the Basiq API.
- **Dashboard**: View and manage generated reports (accessible after login).

## Technologies

- **Next.js**: React framework for server-side rendering and static site generation.
- **shadcn/ui**: A modern UI library for React.
- **Axios**: Promise-based HTTP client for making API requests.

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- npm or yarn

### Installation

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-repo/income-verification.git
    cd income-verification
    ```

2. **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

3. **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add your environment variables:

    ```env
    NEXT_PUBLIC_BASI_Q_API_KEY=your_basiq_api_key
    ```

4. **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

    Navigate to `http://localhost:3000` to see the application in action.

## Usage

1. **Login Page**: Enter your email address and click "Login" to generate an API token. You will be redirected to the dashboard upon successful token generation.

2. **Dashboard**: Manage and view your income verification reports. This page is accessible only after logging in.

## API Integration

- **Token Generation**: The login process calls the Basiq API to generate a token. The API endpoint used is `https://au-api.basiq.io/token`.

## Development

### Adding Features

1. **Create a new feature branch:**

    ```bash
    git checkout -b feature/your-feature
    ```

2. **Make your changes and commit:**

    ```bash
    git add .
    git commit -m "Add your feature"
    ```

3. **Push to the repository:**

    ```bash
    git push origin feature/your-feature
    ```

4. **Create a Pull Request**: Open a Pull Request on GitHub with your changes.

### Running Tests

To run tests (if any), use:

```bash
npm test
# or
yarn test
