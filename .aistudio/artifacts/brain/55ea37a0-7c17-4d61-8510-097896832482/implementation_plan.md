# Student Roster Management, Course Ledger Reset & Check-In Streamlining

Empower the Course Rep with full student lifecycle management (inline editing, removal, and addition), reset the Course Ledger to an empty initial state with custom course creation, and remove the GPS location blocker in favor of high-reliability 1-minute rolling passcodes and single-device hardware locking.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your clarification, the following architectural choices have been locked in:
> - **Attendance Verification**: Removed the GPS geolocation enforcement and distance verification. Check-in now relies on the **1-minute rolling passcode** displayed in class combined with **single-device hardware locking** (anti-proxy protection).
> - **Course Ledger Reset**: Cleared all pre-existing courses from the database. The Course Ledger starts completely clean, equipped with an intuitive **"Add Course" modal** allowing the Class Rep to set up courses on demand.
> - **Student Management**: Direct **Edit** and **Delete** action buttons on each student row in the Roster Manager, complete with an Edit Student modal (supporting name, JAMB, matric, level, department updates) and a safe delete confirmation.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Class Rep Roster Control**: The Course Rep can now update student records (correct typos, edit JAMB or Matric numbers, change levels) or delete students directly from the Roster table, as well as add new students individually or in bulk via CSV.
  2. **Clean Course Ledger**: Removes all seeded test courses. The system provides an empty slate with an interactive "+ Add Course" dialog for the Class Rep to configure course codes, titles, and venues.
  3. **Hassle-Free Anti-Proxy Check-In**: Eliminates browser GPS errors, permission prompts, and coordinate drift. Students only need to enter their JAMB/Matric number and the 4-digit PIN currently projected on the classroom screen. The server guarantees anti-proxy integrity through single-device hardware/fingerprint locking and 1-minute code expiration.
- **Target Audience**: Cybersecurity students and Course Reps in the Faculty of Computing & Digital Technology at Redeemer's University.
- **Key Value**: 100% check-in reliability without false location blocks, paired with complete administrative autonomy for the Class Rep to manage students and courses.

---

## 2. User Experience & Visual Design

### Key User Flows

```
[Student Check-In]
Student enters JAMB/Matric -> Live 4-digit PIN -> Instant Verification
(No GPS permission dialogs, no out-of-bounds errors, immediate check-in)

[Class Rep - Student Management]
Roster Directory -> Each row has [Edit] and [Delete] buttons
  ├── Click Edit: Modal pre-filled with student info -> Save Changes -> Instant table update
  └── Click Delete: Confirmation prompt -> Remove student from database -> Notification toast

[Class Rep - Course Ledger]
Course Ledger Tab -> Empty State: "No courses configured yet" -> Click "+ Add Course"
  └── Modal: Course Code, Course Title, Lecturer Name, Venue -> Create Course -> Ledger Matrix active
```

### Visual Identity & Theme
- **Theme**: High-contrast slate and emerald aesthetic (`#020617` / `#0F172A` / `#10B981`) fitting cybersecurity infrastructure.
- **Roster Action Controls**: Compact icon buttons on each row:
  - Edit: Emerald/slate button with edit pencil icon (`Lucide Edit3`).
  - Delete: Rose/slate button with trash icon (`Lucide Trash2`).
  - Add Course: Prominent emerald action button with plus icon (`Lucide Plus`).
- **Typography & Data Grid**: Monospaced tabular numerals for student IDs, lecture counts, and passcodes (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removal of GPS Geofencing**
  - *Chosen Approach*: Strip out the browser geolocation requirement, `userLat`/`userLng` submission, and distance calculation. Check-in directly validates the student JAMB against the master roster, the current/previous 1-minute rolling PIN, and device uniqueness.
  - *Why*: Mobile browser permission popups, iframe sandboxes, and indoors GPS multipath interference caused legitimate students in the hall to be blocked. 1-minute rolling PINs visible only on the physical hall projector already provide strong physical presence assurance.
  - *Alternative Considered*: Retaining GPS as optional; rejected because confusing location status cards cluttered the student view.
- **Decision 2: Student Mutation Endpoints**
  - *Chosen Approach*: Add `PUT /api/students/:jamb` (Edit student) and `DELETE /api/students/:jamb` (Delete student) protected by Course Rep authentication (`requireAdminAuth`).
  - *Why*: Allows instantaneous roster corrections without needing full database resets.
- **Decision 3: Course Creation & Ledger Empty State**
  - *Chosen Approach*: Provide `POST /api/courses` and `DELETE /api/courses/:courseId` endpoints. When no courses exist, display a clean empty state with a 1-click "Add Course" trigger.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RUN CyberPass Frontend                          │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌───────────────┐ │
│  │   Student Check-In    │  │   Roster Manager   │  │ Course Ledger │ │
│  │ (JAMB + PIN + Device) │  │  (Add/Edit/Delete) │  │  (Add/Manage) │ │
│  └───────────┬───────────┘  └─────────┬──────────┘  └───────┬───────┘ │
└──────────────┼────────────────────────┼─────────────────────┼─────────┘
               │                        │                     │
               ▼                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Express Backend API                             │
│                                                                        │
│  • POST /api/check-in             (Passcode + Single-Device Guard)     │
│  • GET/POST/PUT/DELETE /api/students                                   │
│  • GET/POST/DELETE /api/courses   (Empty initial state + Add Course)   │
│  • GET /api/courses/:id/ledger    (Live attendance matrix)             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ In-Memory Data Store: masterStudents, masterCourses, records     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### API Handlers to Update/Add
1. `PUT /api/students/:jamb`: Updates student full name, matric number, level, and department.
2. `DELETE /api/students/:jamb`: Removes the student from `masterStudents` and clears associated device locks.
3. `POST /api/courses`: Creates a new course and adds it to `masterCourses`.
4. `DELETE /api/courses/:courseId`: Deletes a course from the ledger.
5. `POST /api/check-in`: Remove `userLat`, `userLng`, and Haversine distance verification; streamline passcode + single-device validation.

### Component Updates
1. `src/components/StudentPortal.tsx`: Remove all GPS acquisition hooks, location status indicators, and permission buttons. Deliver a clean, rapid check-in form.
2. `src/components/RosterManager.tsx`: Add `Edit` and `Delete` action buttons to each student row, with an Edit Student modal and a Delete confirmation modal.
3. `src/components/CourseLedgerView.tsx`: Support an empty course state with a dedicated "+ Add Course" modal.
4. `src/components/AdminDashboard.tsx`: Add course deletion/creation controls and remove GPS coordinate capturing.
5. `src/services/api.ts` & `server.ts`: Wire new student and course CRUD routes and clear initial course list.
