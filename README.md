# ResumePilot: AI-Powered ATS Resume Scanner & Enhancer

![ResumePilot Hero Image](https://raw.githubusercontent.com/firebase/studio-bots/main/apps/resume-pilot/docs/hero.png)

**ResumePilot** is a sophisticated web application designed to help job seekers beat automated screening systems and create resumes that stand out to recruiters. By leveraging the power of Google's Gemini generative AI models, ResumePilot provides instant, actionable feedback to elevate your job application materials.

## Key Features

- **🚀 Instant ATS Score:** Paste your resume and a job description to get an immediate compatibility score from 0-100. Understand exactly how your resume is perceived by Applicant Tracking Systems.
- **💡 AI-Powered Suggestions:** Receive specific, actionable feedback on how to improve your resume's keyword optimization, phrasing, and overall impact for a target role.
- **✨ AI Resume Enhancement:**
  - **With a Job Description:** Let our AI automatically rewrite and enhance your resume to perfectly align with a specific job opening, ensuring you hit all the right keywords and phrases.
  - **With Just a Job Role:** Don't have a specific job description? No problem. Provide a target job title (e.g., "Senior Product Manager"), and our AI will optimize your resume for that career path.
- **📄 Multiple Download Formats:** Download your newly enhanced resume as a professional `.pdf`, `.docx`, or simple `.txt` file, ready for submission.
- **🔒 LinkedIn Profile Analyzer (Coming Soon):** Our next feature will provide AI-driven analysis and suggestions to optimize your LinkedIn profile and attract top recruiters.

## Technology Stack

ResumePilot is built with a modern, powerful, and type-safe technology stack:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Generative AI:** [Google Gemini via Genkit](https://firebase.google.com/docs/genkit)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Authentication:** OAuth 2.0 with PKCE for secure sign-ins.
- **Deployment:** Firebase App Hosting

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation & Running Locally

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-repo/resumepilot.git
    cd resumepilot
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add any necessary API keys (e.g., for LinkedIn OAuth).
    ```
    LINKEDIN_CLIENT_ID=YOUR_CLIENT_ID
    LINKEDIN_CLIENT_SECRET=YOUR_CLIENT_SECRET
    NEXT_PUBLIC_APP_URL=http://localhost:9002
    ```
4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
