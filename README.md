# SMART OPD — Intelligent Healthcare Queue Management System

> **Tagline:** "Token number stays. Priority changes."

Smart OPD is a complete, modern, responsive frontend healthcare outpatient department (OPD) queue management system. It captures patient symptoms and vital signs, assesses clinical triage urgency, and automatically reorganizes the waiting queue based on clinical priority rather than strict registration arrival order.

---

## 🌟 Key Features

1. **Intelligent Clinical Triage Engine**:
   - Assesses presenting symptoms (e.g. chest tightness, shortness of breath, fever) and vital signs (SpO₂, Blood Pressure, Pulse, Temperature).
   - Classifies patients into **IMMEDIATE (Red)**, **SOON (Orange)**, and **ROUTINE (Green)** priority levels.
   - Detects life-threatening red-flag indicators and alerts medical staff immediately.
   - Highlights missing or unmeasured vitals gracefully.

2. **Automatic Smart Queue Reordering**:
   - Queue sequence: `IMMEDIATE` &gt; `SOON` &gt; `ROUTINE`.
   - Equal priority tie-breaker: FIFO (First-In, First-Out based on registration time).
   - **Core Rule**: The patient's original registration token number (e.g. `OPD-018`, `OPD-021`, `OPD-030`) **NEVER changes**. Only their calculated queue position (`Pos #1`, `Pos #2`) updates automatically in real time.

3. **Nurse Dashboard & Clinical Override**:
   - Dedicated views for Immediate, Soon, Routine, and In-Consultation queues.
   - Immediate-priority registrations include desk screening questions; recorded answers are handed to the nurse for review and never diagnose or downgrade urgency automatically.
   - Nurse priority override modal with required clinical rationale logging.
   - Vitals update modal allowing real-time re-assessment.
   - One-click workflow triggers: Call Patient, Start Consultation, Complete Visit.

4. **Doctor Consultation Panel**:
   - Synchronized view displaying current attending patient, next priority patient in line, and upcoming smart queue.

5. **Live Public Waiting Room TV Display**:
   - Dedicated screen showing `NOW SERVING` token in massive high-contrast typography, next waiting tokens, and recent calls.
   - Multilingual display in English, Hindi, and Gujarati, following the priority queue order.
   - Automatic, slower spoken token announcements with a chime in the selected language; prefers an available female voice and uses phonetic Hindi/Gujarati when native voices are unavailable.
   - **Privacy Compliant**: Displays token numbers only; hides patient names, symptoms, and medical details.
   - Automatic cross-tab sync via browser `localStorage` storage events.

6. **Complete Multilingual Support**:
   - 3 Languages: **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)**.
   - Dynamic non-reloading language switcher.
   - Manual dictionary translations (No external APIs or Google Translate dependency).

7. **System Audit Trail**:
   - Logs registration events, triage decisions, nurse priority overrides, vitals modifications, patient calls, and consultation completions.

---

## 📁 Project Structure

```
Smart-OPD/
│
├── index.html                  # Main SPA container & layout
├── README.md                   # Complete documentation
├── server.js                   # Local static server
├── package.json                # Start command
│
├── assets/
│   ├── images/
│   │   ├── smart-opd-logo.svg            # Brand logo SVG
│   │   ├── hospital-illustration.svg     # Medical dashboard graphics
│   │   └── empty-queue.svg              # Empty state illustration
│   │
│   └── icons/
│       └── favicon.svg                   # Browser favicon
│
├── css/
│   ├── style.css               # Global variables, typography, priority colors
│   ├── layout.css              # Header, sidebar, drawer, content grids
│   ├── components.css          # Buttons, badges, cards, modals, toast alerts
│   ├── forms.css               # Symptom chips, vitals inputs, live triage preview
│   ├── dashboard.css           # Metric stats cards & quick actions
│   ├── queue.css               # Patient cards & Public TV display styling
│   └── responsive.css          # Media queries (down to 360px mobile)
│
├── js/
│   ├── utils.js                # Helpers (date formatting, HTML escape, token string)
│   ├── translations.js         # Multilingual dictionaries (en, hi, gu)
│   ├── language.js             # Language engine & dynamic DOM updater
│   ├── storage.js              # Browser LocalStorage adapter & cross-tab sync
│   ├── state.js                # Centralized reactive application state
│   ├── triage-engine.js        # Clinical assessment & red-flag detection engine
│   ├── queue-engine.js         # Priority & FIFO queue sorting algorithm
│   ├── validation.js           # Form input validation logic
│   ├── notifications.js        # Toast notification system
│   ├── audit-trail.js          # Audit logging & event table renderer
│   ├── registration.js         # Patient registration form controller
│   ├── nurse-dashboard.js      # Nurse queue control & override modal
│   ├── doctor-dashboard.js     # Doctor consultation panel controller
│   ├── token-display.js        # Public waiting room TV screen controller
│   ├── router.js               # SPA hash router & view renderer
│   └── app.js                  # Main application bootstrap
│
└── pages/
    ├── dashboard.html          # Route fallback redirect
    ├── registration.html       # Route fallback redirect
    ├── nurse.html              # Route fallback redirect
    ├── doctor.html             # Route fallback redirect
    ├── token-display.html      # Route fallback redirect
    ├── patient-token.html      # Route fallback redirect
    ├── audit.html              # Route fallback redirect
    └── settings.html           # Route fallback redirect
```

---

## ⚡ Quick Start & How to Run

1. Install **Node.js 20.12 or newer**.
2. From the project folder, run `npm start`.
3. Open `http://127.0.0.1:3000`.

Patient registration, rule-based triage, and queue management work without an AI key. Optional Gemini intake summaries require a Gemini API key configured in `.env`:

1. Copy `.env.example` to `.env` in the project root.
2. Set `GEMINI_API_KEY` to your key. Never put it in browser JavaScript or commit `.env`.
3. The default configuration uses the faster `gemini-3.5-flash-lite` model and tries `gemini-2.5-flash` once if Google reports temporary overload (HTTP 429/503). Each model attempt times out after 12 seconds. You can change either model in `.env` to a model enabled for your API key.
4. Run `npm start`; the local server loads `.env` and exposes the same-origin `/api/intake/summarize` endpoint. Restart the server after editing `.env` or updating the application.

The Chief Complaint field also supports browser speech recognition for English, Hindi, and Gujarati. Use a supported browser with microphone permission over localhost or HTTPS; recognition may be processed by the browser's speech service. Check the dictated text before submitting.

OPD department is suggested immediately from complaint keywords and can be manually changed in the registration form. When a Gemini intake summary is generated, Gemini also returns a department suggestion, which replaces the automatic suggestion unless staff has manually selected a department. The saved department is visible on the Nurse and Doctor dashboards. This routing suggestion is not a diagnosis.

When staff generates an intake summary, the form sends only the chief-complaint text to Google Gemini. Gemini returns a factual summary and an `IMMEDIATE`, `SOON`, or `ROUTINE` complaint-based priority; that AI priority is automatically applied to the queue and shown to nurse/doctor staff. The existing symptom/vital rule engine can raise the combined priority, but cannot be lowered by the AI. Staff can override the queue priority. This is an experimental decision-support prototype, not a clinically validated triage system: qualified clinicians must supervise its use, and emergencies must follow local emergency protocols without waiting for AI. Gemini errors are shown, and registration remains available using the rule-based triage result. Use synthetic/demo data during development, and obtain required patient permission and organizational approval before sending any real patient information to an external AI service.

When the combined registration recommendation is `IMMEDIATE`, the desk can record patient answers about current breathing difficulty, chest pain/pressure, fainting/confusion/seizure, and heavy bleeding/severe allergy. A “yes” or “not sure” answer prompts staff to alert the nurse; answers are saved with the local patient record for nurse review and are not sent to Gemini. This questionnaire is a handoff aid, not a validated triage protocol: it does not determine priority, and staff must not delay urgent care to complete it.
---

## Queue Workflow

1. Register a patient to create a token and add them to the queue. The confirmation dialog offers a patient-specific prescription slip to take to the doctor.
2. Use the Nurse Dashboard to call patients, update vitals, adjust priority, or delete a patient record.
3. Open the Live Token Display and use the corner arrow button to enter fullscreen. Press **Esc** to exit fullscreen.
4. Patient token numbering starts from `OPD-001` each local calendar day.
5. Filter audit history by token and an inclusive date range.

---

## ⚠️ Known Limitations & Clinical Safety Disclaimer

- **Prototype Disclaimer**: Smart OPD is a decision-support prototype built for demonstration and educational purposes. It is **not a diagnostic medical device** and should not be used as a standalone diagnostic system without direct oversight by qualified clinical medical professionals.
- **Frontend Persistence**: Data is persisted in browser `localStorage`. Clearing browser data or cache will clear the local queue. Multi-device sync requires an enterprise backend API.

---

## 📜 License & Credits

Built as a modern frontend healthcare queue management system prototype. Free to use for clinical queue workflow demonstration.
