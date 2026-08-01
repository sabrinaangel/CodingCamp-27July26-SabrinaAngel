 # Requirements Document

## Introduction

The To-Do List Life Dashboard is a single-page, client-side web application built with HTML, CSS, and Vanilla JavaScript. It serves as a personal daily-focus tool with a calm, morning-routine aesthetic. The dashboard combines a live clock and contextual greeting, a Pomodoro focus timer, a task list, and quick-access links — all persisted locally in the browser. Visual theming shifts subtly with the time of day, reinforcing the personal, non-corporate character of the tool.

## Glossary

- **Dashboard**: The single HTML page that hosts all features of the application.
- **Clock**: The live time and date display component in the greeting area.
- **Greeting**: The section that displays the user's name and a time-sensitive salutation.
- **Timer**: The Pomodoro focus countdown timer component.
- **Task**: A single to-do item with a text description and a completion status.
- **Task_List**: The component that renders, manages, and persists all tasks.
- **Quick_Links**: The component that renders and manages user-defined shortcut buttons to external URLs.
- **Local_Storage**: The browser's `localStorage` API used as the sole persistence layer.
- **Theme**: The visual color scheme of the Dashboard, toggled between light and dark modes.
- **Time_Period**: One of four contextual time bands — Morning (05:00–11:59), Afternoon (12:00–17:59), Evening (18:00–20:59), Night (21:00–04:59).
- **Pomodoro_Duration**: The configurable length, in minutes, of a single Timer session.
- **Sort_Order**: The active ordering applied to the Task_List — one of: Default (insertion order), Status (incomplete first), or Alphabetical (A–Z).

---

## Requirements

### Requirement 1: Live Clock and Date Display

**User Story:** As a user, I want to see the current time and date update in real time, so that I always know what time it is without leaving the Dashboard.

#### Acceptance Criteria

1. THE Clock SHALL display the device's current local time in HH:MM:SS 24-hour format, where HH is zero-padded hours (00–23), MM is zero-padded minutes (00–59), and SS is zero-padded seconds (00–59).
2. THE Clock SHALL display the current date including the full weekday name, numeric day, full month name, and four-digit year (e.g., "Thursday, 31 July 2026").
3. WHEN the Dashboard is loaded, THE Clock SHALL begin updating the displayed time every second using the device's current local time.
4. WHILE the Dashboard is open, THE Clock SHALL continue updating without requiring user interaction or page refresh.
5. IF the device time is unavailable or cannot be read, THEN THE Clock SHALL display "--:--:--" for time and "Date unavailable" for the date.

---

### Requirement 2: Time-Sensitive Greeting

**User Story:** As a user, I want to see a greeting that addresses me by name and reflects the time of day, so that the Dashboard feels personal and contextually aware.

#### Acceptance Criteria

1. WHEN the current hour is between 05:00 and 11:59 (local time), THE Greeting SHALL display the salutation "Good Morning".
2. WHEN the current hour is between 12:00 and 17:59 (local time), THE Greeting SHALL display the salutation "Good Afternoon".
3. WHEN the current hour is between 18:00 and 23:59 (local time), THE Greeting SHALL display the salutation "Good Evening".
4. WHEN the current hour is between 00:00 and 04:59 (local time), THE Greeting SHALL display the salutation "Good Evening".
5. THE Greeting SHALL append the stored user name after a comma and space separator (e.g., "Good Morning, Sabrina"). IF the stored name exceeds 50 characters, THE Greeting SHALL display only the first 50 characters of the name.
6. WHEN no user name has been saved in Local_Storage, THE Greeting SHALL display the salutation without a name suffix (e.g., "Good Morning").
7. WHEN the user submits a new name via the name input field, THE Greeting SHALL update to display the new name without requiring a page reload.
8. WHEN the user submits a new name containing at least one non-whitespace character, THE Dashboard SHALL persist the trimmed name to Local_Storage so it is restored on subsequent page loads. IF the trimmed name is empty, THE Dashboard SHALL NOT write to Local_Storage.
9. IF the user submits an empty or whitespace-only name value, THEN THE Greeting SHALL retain the previously displayed name without modification.

---

### Requirement 3: Custom Name Input

**User Story:** As a user, I want to enter and save my name, so that the greeting displays my name every time I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field (maximum 50 characters) and a save button for entering a custom name.
2. WHEN the user activates the save button with an input value containing at least one non-whitespace character, THE Dashboard SHALL write the trimmed name to Local_Storage under a defined key and update the Greeting immediately.
3. WHEN the Dashboard is loaded, THE Dashboard SHALL read the saved name from Local_Storage and pre-populate the name input field with the stored value.
4. IF the user activates the save button with an empty or whitespace-only input value, THEN THE Dashboard SHALL display an inline validation message, retain the previously saved name without modification, and SHALL NOT update Local_Storage.
5. WHEN no saved name exists in Local_Storage on Dashboard load, THE name input field SHALL display an empty or placeholder state (e.g., placeholder text "Your name").

---

### Requirement 4: Pomodoro Focus Timer

**User Story:** As a user, I want a countdown timer I can start, stop, and reset, so that I can work in focused Pomodoro sessions.

#### Acceptance Criteria

1. THE Timer SHALL display the remaining time in MM:SS format, where MM is zero-padded minutes (00–99) and SS is zero-padded seconds (00–59).
2. WHEN the Dashboard is loaded and no session is active, THE Timer SHALL display the full Pomodoro_Duration (default 25:00) as the initial remaining time.
3. WHEN the user activates the Start button, THE Timer SHALL begin counting down one second per second.
4. WHEN the user activates the Stop button while the Timer is counting down, THE Timer SHALL pause at the current remaining time.
5. WHEN the user activates the Reset button, THE Timer SHALL stop counting down and restore the display to the full Pomodoro_Duration within 200ms.
6. WHEN the remaining time reaches 00:00, THE Timer SHALL stop counting down.
7. WHEN the remaining time reaches 00:00, THE Dashboard SHALL display a visible notification for at least 3 seconds to signal session completion. THE Dashboard SHOULD also emit an audible alert lasting at least 1 second if the browser supports the Web Audio API.
8. WHILE the Timer is counting down, THE Dashboard SHALL disable the Start button and enable the Stop button within 200ms of the state change.
9. WHILE the Timer is paused or reset, THE Dashboard SHALL enable the Start button and disable the Stop button within 200ms of the state change.
10. IF the user activates the Start button when the remaining time is already 00:00, THEN THE Dashboard SHALL NOT start the timer; the Start button SHALL remain disabled.

---

### Requirement 5: Configurable Pomodoro Duration

**User Story:** As a user, I want to set a custom Pomodoro duration, so that I can adapt the timer to my preferred work interval length.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a numeric input field that allows the user to specify the Pomodoro_Duration in whole minutes.
2. THE numeric input field SHALL accept values between 1 and 120 (inclusive).
3. WHEN the user saves a valid Pomodoro_Duration and no session is running or paused, THE Timer SHALL update the displayed remaining time to reflect the new duration within 1 second.
4. WHEN the user saves a valid Pomodoro_Duration, THE Dashboard SHALL persist the value to Local_Storage so it is restored on subsequent page loads.
5. IF the user enters a value outside the range 1–120 or a non-integer value, THEN THE Dashboard SHALL display an inline validation message indicating the allowed range (1–120 minutes) and SHALL NOT save the invalid value.
6. WHEN the Dashboard is loaded, THE Dashboard SHALL read the saved Pomodoro_Duration from Local_Storage and initialize the Timer with that value. IF no saved value exists, THE Timer SHALL default to 25 minutes.
7. WHEN the user saves a valid Pomodoro_Duration while a Timer session is running or paused, THE Dashboard SHALL persist the new duration but SHALL NOT apply it until the next session start (after a Reset).

---

### Requirement 6: Task Management

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks, so that I can track what I need to accomplish during my day.

#### Acceptance Criteria

1. THE Task_List SHALL provide a text input field (maximum 200 characters) and an add button for creating new tasks.
2. WHEN the user activates the add button with a non-empty task description (1–200 characters), THE Task_List SHALL append a new Task with the provided description and a status of incomplete. Note: the only basic validation rules on the add path are non-empty and maximum 200-character length; no other validation rules apply beyond these and the duplicate check in Requirement 7.
3. IF the user activates the add button with an empty input value, THEN THE Task_List SHALL display an inline validation message indicating the field is required and SHALL NOT create a new Task.
4. IF the user activates the add button with an input value exceeding 200 characters, THEN THE Task_List SHALL display an inline validation message indicating the 200-character limit and SHALL NOT create a new Task.
5. WHEN the user activates the edit control for a Task, THE Task_List SHALL render the Task description as an editable text field pre-populated with the current description (maximum 200 characters).
6. WHEN the user confirms an edit with a non-empty value (1–200 characters), THE Task_List SHALL update the Task description to the new value. Note: all validation rules — empty check, 200-character length check, and duplicate check from Requirement 7 — must all pass before the description is updated.
7. IF the user confirms an edit with an empty value, THEN THE Task_List SHALL display an inline validation message indicating the field is required and SHALL NOT update the Task description.
8. IF the user confirms an edit with a value exceeding 200 characters, THEN THE Task_List SHALL display an inline validation message indicating the 200-character limit and SHALL NOT update the Task description.
9. WHEN the user activates the completion toggle for a Task, THE Task_List SHALL toggle the Task status between incomplete and complete, applying a distinct visual treatment (e.g., strikethrough) to completed Tasks.
10. WHEN the user activates the delete control for a Task, THE Task_List SHALL remove that Task from the list permanently without requiring additional confirmation.
11. WHEN any Task is added, edited, toggled, or deleted, THE Task_List SHALL write the updated task collection to Local_Storage within 500ms.
12. WHEN the Dashboard is loaded, THE Task_List SHALL read the persisted task collection from Local_Storage and render all saved Tasks within 1 second.
13. IF Local_Storage is unavailable or the stored task data cannot be parsed, THEN THE Task_List SHALL render an empty list and display a non-blocking error indicator to the user.

---

### Requirement 7: Duplicate Task Prevention

**User Story:** As a user, I want the dashboard to prevent me from adding duplicate tasks, so that my task list stays clean and free of redundant entries.

#### Acceptance Criteria

1. WHEN the user activates the add button, THE Task_List SHALL trim whitespace from the new task description and compare it against all existing Task descriptions (also trimmed) using a case-insensitive comparison.
2. IF the trimmed new task description matches any existing trimmed Task description (case-insensitive), THEN THE Task_List SHALL display an inline validation message adjacent to the input field indicating a duplicate entry and SHALL NOT create a new Task. The input field SHALL remain active and retain its current text.
3. WHEN the user confirms a task edit, THE Task_List SHALL trim whitespace from the updated description and compare it against all other existing Task descriptions (also trimmed, excluding the Task being edited) using a case-insensitive comparison.
4. IF the trimmed updated description matches any other existing trimmed Task description (case-insensitive), THEN THE Task_List SHALL display an inline validation message adjacent to the edit field indicating a duplicate entry and SHALL NOT save the edit. The edit field SHALL remain active and retain the entered text.

---

### Requirement 8: Task Sorting

**User Story:** As a user, I want to sort my tasks by status or alphabetically, so that I can prioritize and navigate my list more easily.

#### Acceptance Criteria

1. THE Task_List SHALL provide a sort control that exposes the following Sort_Order options: Default, Status, and Alphabetical.
2. WHEN the user selects the Status Sort_Order, THE Task_List SHALL render incomplete Tasks before complete Tasks. Within each status group, Tasks SHALL be ordered by insertion order (earliest to latest added).
3. WHEN the user selects the Alphabetical Sort_Order, THE Task_List SHALL render Tasks in ascending order by description using a case-insensitive comparison, with digits sorted before letters. Tasks with identical descriptions (after case normalization) SHALL fall back to insertion order.
4. WHEN the user selects the Default Sort_Order, THE Task_List SHALL render Tasks in their original insertion order (earliest to latest added).
5. THE sort control SHALL NOT modify the underlying persisted order of tasks; sorting is a display-only operation applied at render time.
6. WHEN a new Task is added while a non-Default Sort_Order is active, THE Task_List SHALL re-apply the active Sort_Order to include the new Task in the correct position within 300ms. This 300ms bound applies per individual Task addition, even when the user is rapidly adding multiple Tasks in succession.

---

### Requirement 9: Quick Links Management

**User Story:** As a user, I want to add and remove shortcut buttons to my favorite websites, so that I can open them quickly without leaving the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a text input field for a link label (1–50 characters), a text input field for a URL (1–2048 characters), and an add button.
2. WHEN the user activates the add button with both a non-empty label (1–50 characters) and a valid URL beginning with "http://" or "https://", THE Quick_Links SHALL render a new shortcut button with the provided label within 300ms.
3. WHEN the user activates a Quick_Links shortcut button that was successfully created and persisted, THE Dashboard SHALL open the associated URL in a new browser tab.
4. IF the user activates the add button with an empty label, a label exceeding 50 characters, an empty URL, or a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL display an inline validation message adjacent to the invalid field indicating the specific failure and SHALL NOT create a new shortcut.
5. WHEN the user activates the delete control on a shortcut button, THE Quick_Links SHALL remove that shortcut from the display within 300ms.
6. WHEN any shortcut is added or removed, THE Quick_Links SHALL write the updated shortcut collection to Local_Storage.
7. WHEN the Dashboard is loaded, THE Quick_Links SHALL read the persisted shortcut collection from Local_Storage and render all saved shortcuts within 500ms.
8. IF Local_Storage is unavailable or the stored shortcut data cannot be parsed, THEN THE Quick_Links SHALL render an empty shortcut list and display a non-blocking error indicator to the user.
9. IF a Local_Storage write fails after a shortcut has already been rendered to the user, THEN THE Quick_Links SHALL keep the shortcut visible in the UI but SHALL display a non-blocking warning that the shortcut may not persist across page reloads.

---

### Requirement 10: Light/Dark Mode Toggle

**User Story:** As a user, I want to switch between light and dark visual themes, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control that switches the Theme between light mode and dark mode. THE toggle control SHALL visually indicate the currently active Theme (e.g., sun icon for light, moon icon for dark).
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected Theme to the entire page by updating a data attribute or class on the root element within 300ms.
3. WHEN the Theme is switched, THE Dashboard SHALL persist the selected Theme value to Local_Storage, overwriting any previously saved value using a dedicated key.
4. WHEN the Dashboard is loaded, THE Dashboard SHALL first attempt to read the saved Theme from Local_Storage and apply it before any visible content is rendered, to prevent a flash of unstyled content. Only if that read fails SHALL THE Dashboard apply the light Theme as a fallback.
5. IF no Theme has been saved, THEN THE Dashboard SHALL apply the light Theme as the default and reflect this in the toggle control's visual state.
6. IF Local_Storage read fails during load, THEN THE Dashboard SHALL apply the light Theme as a fallback without interrupting the page load or displaying an error to the user. This fallback is exempt from the 300ms timing constraint — reliability during error recovery takes priority over speed.

---

### Requirement 11: Time-of-Day Visual Theme

**User Story:** As a user, I want the Dashboard's color palette to subtly shift with the time of day, so that the visual mood reinforces the natural rhythm of my day.

#### Acceptance Criteria

1. WHEN the current local hour is between 05:00 and 11:59 (Morning), THE Dashboard SHALL apply a warm color palette (amber and soft orange accent tones) to background and accent elements.
2. WHEN the current local hour is between 12:00 and 17:59 (Afternoon), THE Dashboard SHALL apply a bright and cooler color palette (sky blue and teal accent tones) to background and accent elements.
3. WHEN the current local hour is between 18:00 and 20:59 (Evening), THE Dashboard SHALL apply a dusky color palette (muted purple and rose accent tones) to background and accent elements.
4. WHEN the current local hour is between 21:00 and 04:59 (Night), THE Dashboard SHALL apply a deep, dark color palette (deep navy and midnight tones) to background and accent elements.
5. WHEN the Dashboard is loaded, THE Dashboard SHALL determine the current Time_Period and apply the corresponding palette within 1 second of load completion.
6. WHILE the Dashboard is open and the Clock crosses a Time_Period boundary, THE Dashboard SHALL transition to the new Time_Period palette within 1 second of the boundary crossing.
7. WHERE dark mode is active, THE Dashboard SHALL apply the dark Theme variant of the current Time_Period palette, combining the dark mode base colors with the Time_Period accent tones.

---

### Requirement 12: File Structure and Technology Constraints

**User Story:** As a developer, I want the project to follow a defined file structure and technology constraints, so that the codebase is predictable and maintainable without external dependencies.

#### Acceptance Criteria

1. THE Dashboard SHALL be delivered as exactly one HTML file named `index.html` at the project root.
2. THE Dashboard SHALL reference exactly one CSS file located inside a `css/` directory and SHALL NOT link any other external stylesheets.
3. THE Dashboard SHALL reference exactly one JavaScript file located inside a `js/` directory and SHALL NOT link any other external scripts.
4. THE Dashboard SHALL use only Vanilla JavaScript. No external frameworks, libraries, build tools, CDN `<script>` tags for third-party code, or third-party `import` statements are permitted. No external framework or library files SHALL be present in the project directory, even if unused by the dashboard code.
5. THE Dashboard SHALL use only the browser's Local_Storage API for data persistence. The Dashboard SHALL NOT make any `fetch`, `XMLHttpRequest`, `WebSocket`, or other network requests to backend endpoints.
6. THE Dashboard SHALL function correctly — meaning all features render and operate without JavaScript errors or broken layouts — in current stable releases of Chrome, Firefox, Edge, and Safari.

---

### Requirement 13: Typography and Visual Design

**User Story:** As a user, I want the Dashboard to use intentional typography and generous spacing, so that the interface feels calm, personal, and easy to read.

#### Acceptance Criteria

1. THE Dashboard SHALL use a distinct, characterful web font for the Clock display and Greeting heading, loaded via a `<link>` tag referencing a public font CDN (e.g., Google Fonts).
2. THE Dashboard SHALL use a clean, readable web font (minimum 14px rendered size) for task descriptions, button labels, and body text, distinct from the display font.
3. THE Dashboard SHALL apply a card-based layout where each major component (Greeting/Clock, Timer, Task_List, Quick_Links) is rendered inside a visually distinct container with padding of at least 16px and border-radius of at least 8px.
4. WHEN the user hovers over an interactive button or control, THE Dashboard SHALL display a visible state change (e.g., background color shift or shadow) within 100ms.
5. WHEN a Task is marked as complete, THE Dashboard SHALL apply a distinct visual treatment (e.g., strikethrough text and reduced opacity) that is visually distinguishable from incomplete Tasks.
6. THE Dashboard SHALL NOT use CSS transitions or animations exceeding 300ms duration for any interactive state change or theme transition.
