# UXPilot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An AI-powered web application for UI/UX designers to help them move from idea to structured design faster and more ethically.

UXPilot is designed to enhance the creative process by providing intelligent tools for wireframing, ethical design analysis, and feedback. It empowers designers to build user-centric products with confidence and efficiency.

## ✨ Key Features

-   **🤖 AI-Powered Wireframing:** Instantly transform text prompts into visual ideas, low-fidelity wireframes, and component suggestions on an interactive canvas.
-   **🛡️ Ethical Design Guardian:** A unique **Dark Pattern Detector** analyzes design flows and alerts you to potentially manipulative or unethical UX patterns.
-   **🔍 AI-Powered Feedback:** Upload design images or Figma links to receive instant, actionable feedback on accessibility, layout, and usability based on UX best practices.
-   **🗺️ User Journey Mapping:** Dynamically build and visualize user journey maps based on different personas and goals.
-   **🎓 Design Principle Generator:** Get recommendations for relevant UX laws and principles based on your project type.
-   **🤝 Team Collaboration:** Real-time collaborative canvas editing, team workspaces, and role-based permissions.
-   **💾 Cloud & Local Storage:** Save your prompts, projects, and results either locally or in the cloud.
-   **📤 Export Options:** Export your work to PDF, Notion, or Figma to integrate with your existing workflow.
-   **🔐 Authentication:** Secure sign-up and login with Google or GitHub.

## 🚀 Tech Stack

-   **Frontend:** HTML, CSS, JavaScript, TailwindCSS
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB with Mongoose
-   **AI Engine:** OpenAI API
-   **Authentication:** Passport.js (Google & GitHub OAuth)
-   **Payments:** Stripe
-   **Canvas Library:** Fabric.js / Konva.js
-   **Security:** Helmet, CORS, express-rate-limit

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher recommended)
-   [npm](https://www.npmjs.com/)
-   [MongoDB](https://www.mongodb.com/try/download/community) installed and running.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd UXPILOT-APP
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables. Replace the placeholder values with your actual credentials.

    ```env
    # Server Configuration
    PORT=3000
    NODE_ENV=development
    FRONTEND_URL=http://localhost:3000

    # Database
    MONGODB_URI=mongodb://localhost:27017/uxpilot

    # Session
    SESSION_SECRET=your_super_secret_session_key

    # OpenAI API
    OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Stripe Payments
    STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
    GOOGLE_CLIENT_SECRET=your_google_client_secret

    # GitHub OAuth
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    ```

### Running the Application

The development environment requires running the backend server and the TailwindCSS compiler in separate terminals.

1.  **Start the backend server:**
    This command starts the server with `nodemon`, which automatically restarts on file changes.
    ```sh
    npm run dev
    ```

2.  **Start the TailwindCSS compiler:**
    This command watches for CSS changes and rebuilds the output file.
    ```sh
    npm run build:css
    ```

The application should now be running at the `FRONTEND_URL` you configured (e.g., `http://localhost:3000`).

## API Endpoints

The server exposes several RESTful API endpoints under the `/api` prefix:

-   **/auth**: Handles user registration, login, and OAuth (Google, GitHub).
-   **/ai**: Powers AI features like content generation and design feedback.
-   **/user**: Manages user profiles and data.
-   **/payment**: Integrates with Stripe for creating checkout sessions.
-   **/design**: Manages user designs and projects.
-   **/team**: Handles team collaboration features.
-   **/codegen**: Provides code generation capabilities.
-   **/analytics**: Tracks usage and performance metrics.


## 💰 Monetization Model

UXPilot uses a freemium model to make powerful design tools accessible to everyone.

-   **Free Plan:**
    -   5 AI prompts per month
    -   Basic features
-   **Pro Plan ($29/month):**
    -   Unlimited AI prompts
    -   All professional features
-   **Enterprise Plan (Custom Pricing):**
    -   Advanced features for large teams
    -   SSO and white-labeling options

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License.
