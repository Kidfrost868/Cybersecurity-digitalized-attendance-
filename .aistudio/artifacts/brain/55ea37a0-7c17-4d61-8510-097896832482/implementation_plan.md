# Centralized Firebase Firestore Cloud Database Migration

## Title & Summary
Migrate UniPass from local device storage to a centralized, multi-device Firebase Firestore cloud database. This ensures student rosters, active lecture sessions, attendance ledgers, geofence validations, and Course Rep in-hall overrides synchronize in real time across lecturers' laptops, student smartphones, and classroom projectors, backed by local offline persistence for lecture halls with unstable connectivity.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user during Phase 1:
> - **Provisioning Method**: Automatic 1-click AI Studio cloud provisioning (with optional fallback code comments showing manual configuration keys).
> - **Cloud Sync Scope**: Full synchronization across all data collections (student master roster, courses, active lecture sessions, verified attendance ledger records, flagged security proxy attempts, and in-hall location overrides).
> - **Offline Resilience**: Offline-first caching with automatic background synchronization when internet connectivity drops inside lecture halls.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces isolated in-memory and local browser storage with a persistent Google Cloud Firestore database. Lecturers, Course Reps, and students can access the system simultaneously from distinct physical devices; any roster edit, attendance check-in, or session launch is immediately reflected across all screens.
- **Target Audience / Persona**: Course Representatives, Lecturers, and Students in the Faculty of Computing & Digital Technology at Redeemer's University.
- **Key Value**: Solves the data-silo problem where attendance recorded on a student's phone was invisible to the Course Rep's dashboard or classroom projector screen without manual local imports.

---

## 2. User Experience & Visual Design

- **Real-Time Multi-Device Sync**:
  - When the Course Rep launches a session on the podium computer, it immediately activates on all students' mobile portals within sub-seconds.
  - When students submit check-ins from their seats, the attendee count and live stream increment instantly on the classroom projector and rep dashboard without page refreshes.
  - When a Course Rep grants an In-Hall GPS Override on their phone, the student's device immediately unlocks for sign-in.
- **Connection & Sync Health Indicator**:
  - A discreet cloud sync status indicator in the navigation header:
    - 🟢 *Cloud Synced (Connected to Firestore)*
    - 🟡 *Offline Mode (Cached locally, will sync automatically)*
    - 🔵 *Syncing transactions...*
- **Visual Theme & Anti-Slop Guidelines**:
  - Preserves the sleek dark institutional aesthetic (`#070A11`, Slate-900, Emerald-400 accent) tailored for Redeemer's University Cybersecurity Department.
  - Unboxed metadata with typographic separators (`·`), high-contrast typography (`IBM Plex Mono` for JAMB/matric/PINs, `Plus Jakarta Sans` for body and headings).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Firestore SDK vs Server-Proxy Cloud Sync**
  - *Chosen Approach*: Hybrid architecture. The client uses Firebase SDK for real-time document listeners (`onSnapshot`) to deliver instant projector and mobile updates, while the Express server maintains transactional authority and security validation.
  - *Why*: Provides sub-second real-time responsiveness on classroom screens while maintaining server-side security checks (single-device fingerprinting, 50m Haversine geofence calculation, and brute-force lockouts).
- **Decision 2: Offline Persistence Strategy**
  - *Chosen Approach*: Enable Firestore offline cache persistence (`enableIndexedDbPersistence` / `persistentLocalCache`).
  - *Why*: Campus lecture theatres frequently suffer from intermittent mobile reception; students and lecturers can continue recording check-ins offline, which automatically sync once the device reconnects.
- **Decision 3: Configuration Keys & Setup Documentation**
  - *Chosen Approach*: Provision via AI Studio's integrated Firebase workflow, but provide a dedicated `src/config/firebase.ts` module with explicit comments detailing where to inspect or inject custom Firebase API keys if deploying independently.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Firebase Firestore Cloud                        │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────┐  │
│  │   students   │   │   courses    │   │   sessions   │   │ records │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └────┬────┘  │
│         │                  │                  │                │       │
│  ┌──────┴──────────────────┴──────────────────┴────────────────┴────┐  │
│  │           Security Rules (firestore.rules) & RBAC Guard          │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ Realtime Sync & Offline Cache
             ┌───────────────────────┼──────────────────────┐
             │                       │                      │
             ▼                       ▼                      ▼
┌─────────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│  Course Rep Dashboard   │ │ Projector Screen │ │    Student Portal    │
│  - Live Roster Manager  │ │ - Giant PIN HUD  │ │  - 50m Radar Badge   │
│  - In-Hall Override Desk│ │ - Live Ticker    │ │  - Anti-Proxy Lock   │
│  - Multi-Course Ledgers │ │ - Attendance %   │ │  - Real-Time Check-In│
└─────────────────────────┘ └──────────────────┘ └──────────────────────┘
```

### Firestore Schema & Collections
1. **`students`**: Document ID = `jambRegNo`
   - Fields: `jambRegNo`, `fullName`, `matricNo`, `department`, `level`, `phone`, `createdAt`, `updatedAt`
2. **`courses`**: Document ID = `id` (e.g., `course-cyb301`)
   - Fields: `id`, `code`, `title`, `lecturerName`, `hallLocation`, `department`, `totalLectures`, `createdAt`
3. **`sessions`**: Document ID = `sessionId`
   - Fields: `id`, `courseId`, `lectureNumber`, `courseCode`, `courseTitle`, `lecturerName`, `courseRepName`, `hallLocation`, `startTime`, `durationMs`, `expiresAt`, `status`, `latitude`, `longitude`, `geofenceRadius`, `currentPasscode`, `previousPasscode`
4. **`records`**: Document ID = `rec-{id}`
   - Fields: `id`, `sessionId`, `courseId`, `courseCode`, `lectureNumber`, `jambRegNo`, `studentName`, `matricNo`, `department`, `deviceId`, `timestamp`, `status`, `distanceMeters`, `userLat`, `userLng`
5. **`flaggedAttempts`**: Document ID = `flag-{id}`
   - Fields: `id`, `sessionId`, `jambRegNo`, `studentName`, `attemptedCode`, `deviceId`, `timestamp`, `userLat`, `userLng`, `distanceMeters`, `reason`
6. **`locationOverrides`**: Document ID = `{sessionId}_{jambRegNo}`
   - Fields: `id`, `sessionId`, `jambRegNo`, `studentName`, `deviceId`, `grantedAt`, `reason`

### Execution Roadmap (Post-Approval)
1. **Step 1: Firebase Tool Trigger**: Call `show_aistudio_ui` with `ui_type: "firebase_setup"` to open the terms confirmation and initiate provisioning.
2. **Step 2: Dependencies & Configuration**: Install `firebase` package; configure `src/config/firebase.ts` with transparent key documentation and offline persistence.
3. **Step 3: Intermediate IR & Security Rules**: Create `firebase-blueprint.json` and deploy robust `firestore.rules`.
4. **Step 4: Refactor Service Layer (`api.ts`)**: Update student roster CRUD, attendance submission, session states, and override desks to read/write Firestore collections.
5. **Step 5: Frontend Real-Time Subscriptions**: Wire `StudentPortal.tsx`, `AdminDashboard.tsx`, and `ProjectorView.tsx` with live Firestore listeners.
6. **Step 6: Verification & Compilation**: Validate build, verify cross-device sync via curl/browsers, and ensure zero lint errors.
