import { Module } from "./Module"
const weeks = [
  {
    number: 1,
    title: "Introduction to Version Control and Deployment",
    topics: [
      "Introduction to Git and GitHub for version control",
      "Setting up a local development environment (installing Node.js, Git, and VS Code)",
      "Basic Git commands: init, add, commit, push, pull",
      "Creating and managing GitHub repositories"
    ],
    activity: "Set up a GitHub account, create a new repository, and push a basic project structure. Initialize a Git repository for the portfolio project.",
    projectTieIn: "Students begin managing their portfolio project using Git and GitHub, laying the foundation for collaborative development and deployment."
  },
  {
    number: 2,
    title: "Introduction to React.js",
    topics: [
      "What is React.js, and why is it used?",
      "Basics of React: Components, JSX, and Props",
      "Setting up a React project using create-react-app"
    ],
    activity: "Create a simple \"About Me\" component. Use npm start to run the app locally. Push the code to GitHub for the first time.",
    projectTieIn: "Students begin building the skeleton of their portfolio project."
  },
  {
    number: 3,
    title: "React.js Advanced Topics",
    topics: [
      "React State and Lifecycle",
      "React Router for creating multi-page websites",
      "Styling React components (CSS, Tailwind, or Bootstrap)"
    ],
    activity: "Add multiple pages to the portfolio (e.g., Home, Projects, Contact). Create an interactive project list using state (e.g., a filter or toggle). Style the portfolio with CSS.",
    projectTieIn: "Students make their portfolios functional and visually appealing."
  },
  {
    number: 4,
    title: "Introduction to Git and GitHub Best Practices",
    topics: [
      "Why use GitHub for version control and collaboration",
      "Branching strategies: main/master and feature branches",
      "Pull Requests (PRs): What they are and why they matter",
      "Merging and resolving conflicts"
    ],
    activity: "Teach students to create a new branch for a feature, commit changes regularly with clear commit messages, push branches to GitHub, create a PR to merge a feature branch into the main branch, and simulate a review process by having students review and merge PRs.",
    projectTieIn: "Students manage their portfolio code using GitHub and practice creating branches, PRs, and merging."
  },
  {
    number: 5,
    title: "Deployment with Netlify",
    topics: [
      "What is Netlify, and how does it simplify deployment?",
      "Linking GitHub to Netlify for continuous deployment",
      "Managing deployment settings and troubleshooting"
    ],
    activity: "Guide students to create a Netlify account, connect their GitHub repository to Netlify, deploy their portfolio website, and test the live deployment and fix any issues.",
    projectTieIn: "Students publish their portfolio website live on Netlify, making it accessible to anyone."
  }
]

export function LessonPlan() {
  return (
    <div className="space-y-12">
      <section className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Course Goal</h2>
        <p className="text-gray-700">
          Teach students foundational system administration and maintenance skills while integrating web development (React.js), version control with Git/GitHub, and deployment via Netlify. Students will develop and publish a personal portfolio website as their final individual project.
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold text-gray-900">Module Breakdown and Project Integration</h2>
        {weeks.map((week) => (
          <Module key={week.number} {...week} />
        ))}
      </section>

      <section className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Project Requirements</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Features:</h3>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>A Home page with a brief introduction</li>
              <li>A Projects page showcasing at least 3 projects (real or placeholder)</li>
              <li>A Contact section with dummy functionality (e.g., an email link or form)</li>
              <li>Responsive design (mobile and desktop views)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Technical Requirements:</h3>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>Use React.js for front-end development</li>
              <li>Use GitHub for version control with proper branching and PRs</li>
              <li>Deploy the website on Netlify</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Submission:</h3>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>A GitHub repository containing the source code and README.md file</li>
              <li>A live link to the deployed portfolio on Netlify</li>
              <li>Screenshots of the GitHub PRs and merges for review</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Assessment Criteria</h2>
        <ul className="list-disc list-inside text-gray-700 ml-4">
          <li>Functionality (40%): Does the portfolio work as intended? Are all required pages and features implemented?</li>
          <li>Technical Implementation (30%): Proper use of React.js components, state, and routing. Proper GitHub workflow with branches, PRs, and merges.</li>
          <li>Design and Creativity (20%): Is the portfolio visually appealing and user-friendly?</li>
          <li>Documentation (10%): Is the project well-documented in the README file?</li>
        </ul>
      </section>
    </div>
  )
}

