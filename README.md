# Life Dashboard 🗂️

> A personal productivity dashboard that adapts to your time of day — all in vanilla HTML, CSS, and JavaScript.

---

## About

Life Dashboard is a single-page web app that puts your essentials in one place: a live clock, a Pomodoro focus timer, a to-do list, and a quick-launch pad for your most-visited links. The interface shifts its color palette automatically based on the time of day — warm amber tones in the morning, sky blue in the afternoon, dusky purple in the evening, and deep navy at night — so the page always feels right for when you're using it.

Built as a portfolio project, it demonstrates clean front-end architecture with no frameworks, no build pipeline, and no external libraries. Everything runs directly from a single HTML file.

---

## ✨ Features

### Core Features

| Feature | Description |
|---|---|
| **Live Greeting & Clock** | Displays a real-time clock (HH:MM:SS) and date, with a time-aware greeting ("Good Morning", "Good Afternoon", "Good Evening"). Updates every second. |
| **Pomodoro Focus Timer** | A countdown timer with Start, Stop, and Reset controls. Plays an audio beep on completion and shows a visual notification. |
| **To-Do List** | Add, edit, complete, and delete tasks. Tasks persist across page reloads via Local Storage. |
| **Quick Links** | Save shortcut buttons to frequently visited URLs. Links open in a new tab and persist across reloads. |

### Bonus Features

| Feature | Description |
|---|---|
| **Light / Dark Mode** | Toggle between light and dark themes with a single button. Preference is saved and restored on next visit. Smooth 300ms color transition. |
| **Custom Name Greeting** | Enter your name in the Settings card and the greeting personalizes — "Good Morning, Sabrina". Saved in Local Storage. |
| **Configurable Pomodoro Duration** | Set any duration from 1 to 120 minutes. The new value persists and is restored on reload. |
| **Duplicate Task Prevention** | Adding a task that already exists (case-insensitive) shows an inline error instead of creating a duplicate. |
| **Task Sorting** | Sort the task list by default order, completion status (incomplete first), or alphabetically. Sort order applies immediately on change. |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic landmarks: `<header>`, `<main>`, `<section>`, `<footer>`) |
| Styling | CSS3 — custom properties, CSS Grid, Flexbox, `@keyframes` animations |
| Logic | Vanilla JavaScript (ES5-compatible IIFEs, no transpiler required) |
| Persistence | Browser `localStorage` API |
| Dependencies | **None** — zero external libraries, zero npm packages, zero build tools |

This project is intentionally framework-free. The entire application ships as three static files that open directly in any modern browser without a development server or compilation step.

---

## 🚀 Live Demo

**[View on GitHub Pages →](https://<!-- TODO: replace with your GitHub Pages URL, e.g. https://sabrinaangel.github.io/CodingCamp-27July26-SabrinaAngel -->)**

---

## 💻 How to Run Locally

No installation, no build step, no dependencies.

```bash
# 1. Clone the repository
git clone https://github.com/sabrinaangel/CodingCamp-27July26-SabrinaAngel.git

# 2. Open the project folder
cd CodingCamp-27July26-SabrinaAngel

# 3. Open index.html in your browser
#    On macOS:
open index.html
#    On Windows:
start index.html
#    Or simply double-click index.html in your file explorer
```

That's it. No `npm install`, no server required.

---

## 📁 Project Structure

```
├── index.html          # Single HTML file — all markup and the FOUC-prevention script
├── css/
│   └── style.css       # All styles — theme variables, layout, animations (20+ sections)
├── js/
│   └── app.js          # All logic — 7 IIFE modules + bootstrap (StorageService,
│                       #   ThemeManager, ClockModule, GreetingModule, TimerModule,
│                       #   TaskModule, QuickLinksModule, BlobBackground, Toast)
└── .kiro/
    └── specs/
        └── todo-life-dashboard/
            ├── requirements.md   # Feature requirements and acceptance criteria
            ├── design.md         # Technical design and module architecture
            └── tasks.md          # Implementation task list with dependency graph
```

---

## 📋 Development Process

This project was built as part of the **RevoU Coding Bootcamp (Batch 27, July 2026)** as a front-end assignment.

Development followed a **spec-driven workflow** using [Kiro](https://kiro.dev), an AI-powered development environment. Before any code was written, a full set of spec documents was produced:

- **`requirements.md`** — user stories and acceptance criteria for every feature
- **`design.md`** — module architecture, data models, and correctness properties
- **`tasks.md`** — a prioritized implementation plan with a task dependency graph (DAG)

These documents live in `.kiro/specs/todo-life-dashboard/` and serve as the written record of every design decision made during the build. If you're curious about why something was built the way it was, the spec docs are the first place to look.

---

## 👤 Author

**<!-- TODO: replace with your full name -->**

- GitHub: [@sabrinaangel](https://github.com/sabrinaangel)
- <!-- TODO: add LinkedIn / portfolio link if you want -->

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
