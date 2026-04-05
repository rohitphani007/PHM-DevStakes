# DevStakes — Hackathon by Axios

> A high-intensity frontend hackathon where ideas meet execution.

**[Register Here →](https://forms.gle/yrQVjSU84b2Wk47Q8)**

---

## Event Overview

| Detail | Info |
|---|---|
| Duration | 3.5 days (84 hours) |
| Team Size | 4 members (at least 1 girl mandatory) |
| Primary Focus | React (Frontend) |
| Bonus Points | Up to +10 for backend, ML integration, or strong system design |

---

## Timeline

### Day-0

| Time | Activity |
|---|---|
| 12:00 PM | Ideas revealed — teams choosing from the given set can start coding immediately |
| 12:00 PM – 4:00 PM | Custom Idea Submission Window |
| 4:00 PM – 8:00 PM | Idea Review by organizers |
| 9:00 PM | Idea approval results announced — event officially starts for all teams |

### Day-1, Day-2, Day-3 — Coding Period

- Coding stops at the **end of Day-3**
- The **top 5 teams** may be called for an **offline pitch** to explain their codebase and demonstrate understanding
- Top 3 winners are decided from the offline pitch

---

## Scoring Criteria

| Criterion | Description | Points |
|---|---|---|
| Core Functionality | Does it actually work end-to-end? | 30 |
| UI / UX Quality | Visual polish, responsiveness, usability | 20 |
| Performance | Lighthouse score — speed, accessibility, SEO | 15 |
| Clean Code & Structure | Readable, modular, no spaghetti | 15 |
| Git Practices | Commits, branching, PRs with descriptions | 10 |
| Deployed & Live Link | Vercel / Netlify, accessible URL submitted | 5 |
| Idea Bonus *(custom only)* | Originality & quality of self-proposed idea | 0–5 |
| **Total** | | **100** |

> **+10 bonus points** available for implementing a backend, integrating ML models, or demonstrating strong system design.

---

## Ideas

You may choose **one** of the ideas below, or propose your **own custom idea** (subject to approval, eligible for up to 5 bonus points).

---

### 1. Real-Time "Auction/Bidding" Portal

A high-adrenaline platform where unique items are put up for timed, live auctions, requiring instant feedback and a seamless user experience.

- **Frontend Challenge:** Handling race conditions and state synchronization. When two users bid at the exact same millisecond, the frontend must handle "Optimistic Updates" (showing the user's bid immediately for a snappy UX) while simultaneously validating against the server clock to handle rejections gracefully.
- **Practical Use:** E-commerce, charity fundraisers, or digital asset trading.

---

### 2. Smart "Expense Splitter"

A comprehensive financial utility to manage group expenses, track shared bills, and "settle up" debts among friends or roommates.

- **Frontend Challenge:** Building intuitive, dynamic forms for complex splits (e.g., "A paid 70%, B and C split the rest, but D owes for drinks"). Managing complex localized state without lagging the UI.
- **Algorithmic Complexity:** The "Simplifying Debts" algorithm (often solved using graph theory/flow networks). If A owes B $10 and B owes C $10, the system should suggest A pays C $10 directly. Handling math precision and multi-currency conversions locally in the browser.
- **Practical Use:** Essential for university students living in hostels, shared flats, or group travel.

---

### 3. Dynamic Team Builder

An intelligent matching platform where users input their skills, and the system automatically forms balanced, highly functional teams based on specific event constraints.

- **Frontend Challenge:** Creating a rich, interactive drag-and-drop interface (similar to a Kanban board) where organizers can visually tweak the auto-generated teams. Visualizing skill distributions using charts (e.g., radar charts for team stats).
- **Algorithmic Complexity:** Constraint satisfaction. If 80% of users are frontend developers and 20% are designers, the system must still create fair teams without perfect combinations, distributing the rare skills evenly.
- **Practical Use:** Automating team formation for hackathons, college projects, or corporate workshops.

---

### 4. Smart "Exam Preparation Planner"

An adaptive study schedule generator that takes a student's syllabus, available hours, and target grades to map out a day-by-day learning journey.

- **Frontend Challenge:** Building interactive calendars, Gantt charts, or timeline views from scratch in React. Handling complex date/time logic and allowing users to drag, drop, and resize study blocks.
- **Algorithmic Complexity:** Priority-based time allocation. What happens when time is insufficient for full syllabus coverage? The system must dynamically recalculate and prioritize high-weightage topics over minor ones.
- **Practical Use:** Helping students manage time efficiently and reduce pre-exam anxiety.

---

### 5. Visual Node-Based Learning Roadmap Builder

A platform where educators or seniors can create interactive, branching "tech trees" (like in video games) for learning new skills (e.g., "How to learn Web Dev").

- **Frontend Challenge:** Heavy manipulation of the DOM and Canvas/SVG. Using libraries like React Flow to let users drag nodes, connect them with animated edges, zoom, pan, and handle complex graph state management in the browser.
- **Practical Use:** Replacing static PDF roadmaps with interactive, trackable learning journeys for college clubs or online courses.

---

### 6. Offline-First Markdown Note-Taking App

A distraction-free, highly performant note-taking application designed for developers and students, capable of working entirely offline.

- **Frontend Challenge:** Building a rich text editor that parses Markdown to HTML in real-time. Implementing an "Offline-First" architecture using IndexedDB/Service Workers in React, ensuring the user can close the tab, lose internet, and never lose a keystroke.
- **Practical Use:** A lightweight Notion/Obsidian alternative tailored for rapid class notes or code snippets.

---

### 7. Custom Idea *(Bonus: up to 5 points)*

Have a unique idea not listed above? Propose it!

- Each team can submit **at most 2 custom ideas** during the Day-0 submission window (12PM–4PM).
- Approved ideas earn an **idea bonus of 0–5 points** based on originality and quality.
- Approval results are announced at **9PM on Day-0**.

---

## Rules

1. Teams must have **exactly 4 members**, with **at least 1 girl**.
2. The primary tech stack must be **React** (frontend-first).
3. Each team must choose **one idea** — either from the given set or a custom approved idea.
4. Teams submitting a custom idea can submit a **maximum of 2 ideas** for review.
5. Teams selecting from the given set may **begin coding at 12PM on Day-0**.
6. Custom idea teams may begin coding only after **approval at 9PM on Day-0**.
7. All code must be pushed to a **Git repository** with clear commit history, branching, and PR descriptions.
8. A **deployed live link** (Vercel/Netlify) must be submitted for full scoring.
9. Coding officially **stops at the end of Day-3**.
10. Top 5 teams may be invited for an **offline pitch** to verify codebase understanding.

---

## Registration

**[Fill the Registration Form →](https://forms.gle/yrQVjSU84b2Wk47Q8)**

---

*DevStakes is organized by Axios. For queries, reach out to the organizing team.*
