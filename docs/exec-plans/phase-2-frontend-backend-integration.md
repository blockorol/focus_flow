# Phase 2 - Frontend MVP, backend hardening, and integration

Status: frontend MVP with mocks is complete, backend hardening is complete through step 2.5, and Focus page UI copy/card interaction polish is complete on 2026-09-14.

## Goal

Build a visible mock-first frontend MVP, then harden the backend runtime, then connect the frontend to the real backend.

The frontend should be reviewable early through a successful mock happy path. Backend hardening happens after the first frontend pass, and real frontend/backend integration happens after both sides are stable enough to connect.

## Non-goals

- No job-search-specific Specification UI or API.
- No weakly typed public Specification CRUD.
- No new backend persistence model unless explicitly approved.
- No Redis, queues, Kafka, Kubernetes, microservices, GraphQL, event sourcing, CQRS, or other infrastructure outside the agreed scope.
- No frontend container for local development.
- No random color proliferation in UI code.
- No backend npm wrappers for Go development commands.

## Assumptions

- The BE full MVP working tree remains the backend base.
- The OpenAPI contract remains the frontend/backend contract source of truth.
- Frontend API boundary uses generated OpenAPI TypeScript types. Frontend screens and app logic use separate frontend models, with conversion to/from API DTOs inside the API boundary.
- The frontend runs locally with Node.js.
- The backend runs locally through Docker Compose.
- Local PostgreSQL runs in Docker Compose, not as a host-installed service.
- Mock mode is a frontend development/runtime option for reviewing happy-path UI before real backend integration.
- The first visual pass uses a practical app layout: sidebar, cards, and forms.
- UI code should be component-based and use functional colors/tokens.

## Open questions requiring user input

No blocking questions at this planning checkpoint.

## API contract changes

No API contract changes are planned for the first frontend mock-first steps.

If frontend work reveals missing response fields, missing error responses, or awkward request shapes, stop before changing the public contract and discuss the contract change first.

## Migration changes

No database migrations are planned in this phase.

If backend hardening reveals a persistence model issue, stop before changing the schema and discuss it first.

## Implementation sequence

### 1. Frontend MVP with mocks

#### 1.1 Frontend design foundation

- [x] **Goal:** create the shared UI foundation before building screens.
- **Files/packages expected to change:** frontend styling files, shared UI components, component tests.
- **Implementation notes:** add functional color/tokens; define simple spacing/radius/shadow conventions; add shared primitives such as `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `EmptyState`, `ErrorState`, and `LoadingState`.
- **Commands/checks:** frontend typecheck; frontend component/smoke tests; frontend lint/build if stable at this point.
- **Acceptance criteria:** screens can be built from shared components; UI colors come from functional tokens/classes rather than ad hoc colors; no product data flow is implemented yet.

#### 1.2 API client boundary and mock mode

- [x] **Goal:** create a typed frontend API boundary with selectable mock and real modes.
- **Files/packages expected to change:** frontend API client modules, mock client/data modules, frontend env documentation/tests.
- **Implementation notes:** support mock mode through an environment variable such as `NEXT_PUBLIC_API_MODE=mock`; keep real client shell typed by generated OpenAPI types; configure cookie-capable requests for real mode; normalize typed errors for unauthorized, not found, conflict, and generic failures.
- **Commands/checks:** API client tests; mock client tests; frontend typecheck.
- **Acceptance criteria:** frontend code calls one app-level API boundary; mock mode returns successful happy-path data; real mode can later point at the backend without changing screens.

#### 1.3 Auth UI mock-first

- [x] **Goal:** build the visible login/session/logout flow against mock mode.
- **Files/packages expected to change:** frontend auth pages/components, session state, tests.
- **Implementation notes:** add login page; fake successful login in mock mode; session state; logout; redirect unauthenticated users to login; protected layout.
- **Commands/checks:** login happy-path test; logout test; protected redirect test; frontend typecheck; manual browser check.
- **Acceptance criteria:** user can log in through mock mode, see the protected app shell, and log out.

#### 1.4 App shell

- [x] **Goal:** create the main application layout.
- **Files/packages expected to change:** frontend layout/routes, sidebar components, navigation components, tests.
- **Implementation notes:** add sidebar layout, main content area, basic navigation, user/session area, and minimal responsive behavior without complex mobile UI.
- **Commands/checks:** render tests; frontend typecheck; manual browser layout check.
- **Acceptance criteria:** authenticated mock users land inside a sidebar-based app shell with stable navigation and content slots.

#### 1.5 Flows UI

- [x] **Goal:** display and create root Focuses as Flows.
- **Files/packages expected to change:** frontend Flow components/pages/forms, mock client behavior, tests.
- **Implementation notes:** add Flow list, Flow cards, create Flow form, empty state, basic loading/error/success states, and a simple `Load more` shape for cursor pagination.
- **Commands/checks:** Flow render test; create Flow happy-path test; empty-state test; frontend typecheck; manual browser check.
- **Acceptance criteria:** mock mode shows Flow cards and supports a successful create Flow action.

#### 1.6 Focus page UI

- [x] **Goal:** display one Focus aggregate and its children.
- **Files/packages expected to change:** frontend Focus page/components/forms, mock client behavior, tests.
- **Implementation notes:** add Focus details, breadcrumbs, child Focus cards/list, create child Focus form, and display status, tags, description, feedback, and color.
- **Commands/checks:** Focus details render test; create child happy-path test; missing Focus state test; frontend typecheck; manual browser check.
- **Acceptance criteria:** mock mode allows opening a Flow/Focus, seeing child Focuses, and creating a child Focus.

#### 1.7 Focus edit UI

- [x] **Goal:** edit generic Focus fields.
- **Files/packages expected to change:** frontend Focus edit form/components, mock client behavior, tests.
- **Implementation notes:** support editing name, status, tags, description, feedback, and color; support clearing nullable fields; show not-found and conflict errors.
- **Commands/checks:** edit happy-path test; clear-fields test; conflict error display test; frontend typecheck; manual browser check.
- **Acceptance criteria:** mock mode supports successful Focus edits and displays expected error states for `404` and `409`.

#### 1.8 Goals UI

- [x] **Goal:** display and manage Goals for a Focus.
- **Files/packages expected to change:** frontend Goal components/forms, mock client behavior, tests.
- **Implementation notes:** add Goal list, create Goal form, edit Goal form, delete Goal action, progress display, and simple link/unlink UI if it fits without making the step too large.
- **Commands/checks:** Goal render test; create Goal happy-path test; progress display test; delete Goal test; frontend typecheck; manual browser check.
- **Acceptance criteria:** mock mode shows Goals, supports successful create/edit/delete behavior, and displays computed progress.

#### 1.9 Frontend visual polish

- [x] **Goal:** improve the first UI pass without changing product behavior.
- **Files/packages expected to change:** frontend styling/components only.
- **Implementation notes:** improve spacing, cards, empty/loading/error states, focus/hover states, active sidebar states, and visual hierarchy; keep colors routed through tokens/functional classes.
- **Commands/checks:** frontend lint; frontend typecheck; frontend tests; frontend production build; manual UI pass.
- **Acceptance criteria:** the mock-first frontend is coherent enough for product review and remains component-based.

#### 1.10 Shared modal foundation and Flow creation modal

- [x] **Goal:** replace always-visible Flow creation with an explicit modal action.
- **Files/packages expected to change:** shared UI modal component, Flow dashboard, Flow create form, tests.
- **Implementation notes:** add a reusable modal primitive, keep forms separate from their shell, add a `Create Flow` page action, and close the modal after successful creation.
- **Commands/checks:** frontend typecheck; frontend lint; frontend tests; frontend production build; generated API type isolation check.
- **Acceptance criteria:** Flow creation opens from a button, renders in a modal, still creates through the frontend API boundary, and no generated API DTOs leak outside `frontend/src/api`.

#### 1.11 Focus edit and child Focus creation modals

- [x] **Goal:** move Focus edit and child Focus creation out of the page column into explicit modal actions.
- **Files/packages expected to change:** Focus dashboard, Focus edit form, child Focus create form, tests.
- **Implementation notes:** keep the Focus summary as the primary read surface, add `Edit Focus` and `Create child Focus` actions, close modals after successful save/create, and keep form components shell-free.
- **Commands/checks:** frontend typecheck; frontend lint; frontend tests; frontend production build; generated API type isolation check.
- **Acceptance criteria:** Focus page reads as data-first, with edit/create actions opening modals instead of occupying persistent page space.

#### 1.12 Goal creation and editing modals

- [x] **Goal:** move Goal creation and editing into modals.
- **Files/packages expected to change:** Goals panel, Goal create form, Goal card, tests.
- **Implementation notes:** add `Create Goal` as a section action, replace inline Goal editing with `Edit Goal` modal behavior, and keep link/unlink controls visible on cards for quick review.
- **Commands/checks:** frontend typecheck; frontend lint; frontend tests; frontend production build; generated API type isolation check.
- **Acceptance criteria:** Goal cards remain display-focused, and create/edit actions happen in modal editors.

#### 1.13 Focus color accent pass

- [x] **Goal:** use Focus color as a visual accent instead of rendering color text in normal Focus page display.
- **Files/packages expected to change:** Focus summary, child Focus card, functional styling helpers/tokens, tests.
- **Implementation notes:** use `#0f766e` as the fallback action/accent color, apply `focus.color` only to safe visual accents such as a left border, and avoid displaying raw color strings in read-only Focus page views.
- **Commands/checks:** frontend typecheck; frontend lint; frontend tests; frontend production build.
- **Acceptance criteria:** color markers improve Focus page scanability without exposing raw hex values in normal read views.

#### 1.14 UI copy and card interaction polish

- [x] **Goal:** make the mock-first UI feel like product UI.
- **Files/packages expected to change:** Flow dashboard/cards, Focus dashboard/cards, Goal cards, app shell copy, tests if behavior changes.
- **Implementation notes:** remove mock/debug copy from primary views, make cards more directly actionable, improve empty-state actions, and preserve functional color usage. Focus page polish includes a path-aware Focus header, header-level color accent, modal actions for edit/add flows, compact Goal rows, expandable linked Focus details, and delete confirmation.
- **Commands/checks:** frontend typecheck; frontend lint; frontend tests; frontend production build; manual UI pass.
- **Acceptance criteria:** the UI is clearer for manual review while keeping mock mode as a development feature behind configuration.
Completion notes:

- Added a custom Focus page header with the Focus label, path/breadcrumb, title, description, and right-side vertical actions.
- Replaced the non-root `Back to Flows` affordance with a Focus path; root Flows keep `Back to Flows`.
- Moved the Focus color accent to the full header block and removed raw color/date/debug copy from normal read views.
- Renamed child Focus and Goal creation actions to `Add child Focus` and `Add Goal`.
- Moved create/edit forms into wider top-positioned modals.
- Changed Goal cards to collapsed one-line rows with type and mini progress by default, with details expanding on click.
- Consolidated linked Focus display into one expandable details section with clickable Focus links and mini status meters.
- Added a delete confirmation prompt for Goal deletion.

### 2. Backend hardening

#### 2.1 Docker Compose runtime verification

- [x] **Goal:** verify the real backend and local PostgreSQL runtime.
- **Files/packages expected to change:** docs or scripts only if verification exposes a gap.
- **Implementation notes:** start backend and PostgreSQL through `docker-compose.local.yml`; confirm backend uses `postgres:5432`; verify health; verify local CORS for `http://localhost:3000`.
- **Commands/checks:** `docker compose -f docker-compose.local.yml up --build`; `GET /v1/health`; CORS preflight/manual browser check.
- **Acceptance criteria:** backend and PostgreSQL start through Compose and the health endpoint is reachable.

#### 2.2 Local migrations verification

- [x] **Goal:** verify local and disposable migration flows.
- **Files/packages expected to change:** docs/scripts only if needed.
- **Implementation notes:** apply goose migrations to local Compose PostgreSQL; check status; validate rollback/reapply on disposable test DB, not development data.
- **Commands/checks:** migration up/status commands; `npm run test:database:local`.
- **Acceptance criteria:** migrations apply locally and disposable `up/down/up` validation passes.

#### 2.3 Real HTTP auth verification

- [x] **Goal:** verify auth behavior against the running backend.
- **Files/packages expected to change:** smoke scripts/tests/docs if useful.
- **Implementation notes:** verify login, me, refresh, logout, protected route without cookie, and protected route with cookie.
- **Commands/checks:** curl/PowerShell HTTP scenarios or a lightweight local smoke script.
- **Acceptance criteria:** real backend auth behavior matches the OpenAPI contract and service tests.

#### 2.4 Real HTTP CRUD verification

- [x] **Goal:** verify real backend CRUD behavior through HTTP.
- **Files/packages expected to change:** smoke scripts/tests/docs if useful.
- **Implementation notes:** verify create/list Flow, create child Focus, get Focus with children, update Focus, missing parent `404`, hierarchy conflict `409`, create Goal, link/unlink Goal, delete Goal, and delete Focus subtree.
- **Commands/checks:** curl/PowerShell HTTP scenarios or a lightweight local smoke script.
- **Acceptance criteria:** the generic backend happy path and expected error paths work through HTTP, not only storage tests.

#### 2.5 Backend error behavior cleanup

- [x] **Goal:** make expected backend errors predictable at the API boundary.
- **Files/packages expected to change:** backend API handlers/mappers/tests; OpenAPI only if a missing response is discovered and approved.
- **Implementation notes:** inspect invalid JSON/body behavior, invalid UUID behavior, invalid query params, invalid cursor behavior, and unexpected storage errors.
- **Commands/checks:** handler tests; real HTTP smoke tests.
- **Acceptance criteria:** expected domain/client errors do not leak as raw `500` responses.

#### 2.6 Docker build verification

- [ ] **Goal:** verify the backend production Docker build path.
- **Files/packages expected to change:** Dockerfile/docs only if an actual repository issue is found.
- **Implementation notes:** check backend Docker build after local HTTPS interception issues are resolved; do not add certificate workarounds; keep Go image version tags without digest pinning unless a later policy changes this.
- **Commands/checks:** `npm run check:docker`; optional direct `docker build -f backend/Dockerfile backend`.
- **Acceptance criteria:** backend Docker image builds without repository-level TLS/certificate workarounds.

#### 2.7 Backend docs checkpoint

- [ ] **Goal:** ensure backend runtime docs match the verified workflow.
- **Files/packages expected to change:** README and repository docs.
- **Implementation notes:** document local backend/PostgreSQL startup, env vars, migrations, disposable DB tests, smoke checks, and known issues.
- **Commands/checks:** `git diff --check`; docs review.
- **Acceptance criteria:** a developer can follow docs to run and verify the backend locally.

#### 2.8 Backend final checks

- [ ] **Goal:** complete backend hardening validation.
- **Files/packages expected to change:** none unless a check exposes a defect.
- **Commands/checks:** contract lint; generated drift check after checkpoint/commit; Go tests; Go vet; staticcheck; backend builds; migration validation; disposable DB tests; Docker build.
- **Acceptance criteria:** backend runtime and validation checks pass or any external blocker is documented.

### 3. Frontend and backend integration

#### 3.1 Real API client switch

- [ ] **Goal:** switch the frontend API boundary from mock mode to real backend mode without rewriting screens.
- **Files/packages expected to change:** frontend API client boundary, env docs, tests.
- **Implementation notes:** configure `NEXT_PUBLIC_API_BASE_URL`; use `credentials: "include"`; keep mock/real selection centralized.
- **Commands/checks:** client tests; frontend typecheck.
- **Acceptance criteria:** the frontend can target the real backend through configuration.

#### 3.2 CORS and cookie integration

- [ ] **Goal:** verify browser auth transport between local frontend and backend.
- **Files/packages expected to change:** frontend/backend config/docs only if verification exposes a gap.
- **Implementation notes:** run frontend at `localhost:3000` and backend at `localhost:8080`; verify login sets the HttpOnly cookie, browser requests send it, and logout clears it.
- **Commands/checks:** manual browser check; browser network tab; backend logs if needed.
- **Acceptance criteria:** standard local development works without manual CORS troubleshooting.

#### 3.3 Auth flow integration

- [ ] **Goal:** connect frontend auth screens to the real backend.
- **Files/packages expected to change:** frontend auth client/hooks/components/tests.
- **Implementation notes:** login page uses backend login; app shell loads `/v1/auth/me`; refresh behavior is connected where needed; logout uses backend logout.
- **Commands/checks:** manual happy path; frontend tests with mocked fetch for state coverage; frontend typecheck.
- **Acceptance criteria:** real backend auth flow works from the browser.

#### 3.4 Flows integration

- [ ] **Goal:** connect Flow screens to backend persistence.
- **Files/packages expected to change:** frontend Flow data hooks/components/tests.
- **Implementation notes:** list Flows from backend; create Flow persists; reload keeps data; `Load more` works when enough data exists.
- **Commands/checks:** manual browser check; API client tests; frontend typecheck.
- **Acceptance criteria:** Flow UI works against real backend data.

#### 3.5 Focus integration

- [ ] **Goal:** connect Focus details, children, and editing to backend persistence.
- **Files/packages expected to change:** frontend Focus data hooks/components/tests.
- **Implementation notes:** open Focus from Flow; fetch details; show children; create child persists; edit Focus persists; display `404` and `409` states.
- **Commands/checks:** manual happy path; error-path tests; frontend typecheck.
- **Acceptance criteria:** Focus UI works against real backend data and handles expected errors.

#### 3.6 Goals integration

- [ ] **Goal:** connect Goal screens to backend persistence.
- **Files/packages expected to change:** frontend Goal data hooks/components/tests.
- **Implementation notes:** list, create, edit, and delete Goals; link/unlink Goal to Focus; display backend-derived progress; verify reload persistence.
- **Commands/checks:** manual happy path; frontend rendering tests; frontend typecheck.
- **Acceptance criteria:** Goal UI works against real backend data and displays computed progress.

#### 3.7 Integration cleanup

- [ ] **Goal:** clean up temporary shortcuts and document the integrated local workflow.
- **Files/packages expected to change:** frontend cleanup, README/docs, tests.
- **Implementation notes:** keep mock mode as an explicit feature; remove temporary UI shortcuts if any were introduced; document how to run frontend and backend together.
- **Commands/checks:** frontend lint/typecheck/tests/build; backend checks; disposable DB tests; manual end-to-end pass.
- **Acceptance criteria:** local end-to-end happy path works and the repository explains how to run it.

## Phase-level acceptance criteria

- [x] Mock-first frontend can be reviewed in the browser.
- [x] Frontend UI is built from shared components and functional colors/tokens.
- [x] Mock mode covers the successful happy path for auth, Flows, Focuses, and Goals.
- [x] Backend runtime has been verified through Docker Compose.
- [x] Backend migrations have been verified against local/disposable PostgreSQL.
- [x] Real HTTP backend auth and CRUD smoke checks pass.
- [ ] Frontend can switch from mock mode to real backend mode through configuration.
- [ ] Browser cookie auth and CORS work in the standard local topology.
- [ ] Frontend and backend happy path works end to end.
- [ ] Docs describe how to run and verify the integrated local setup.

## Rollback and recovery

- Keep each numbered substep commit-sized and independently reviewable.
- Keep OpenAPI changes and generated artifacts together.
- Keep mock mode isolated behind the frontend API boundary so UI work can continue if backend runtime is temporarily blocked.
- Do not hand-edit generated files to repair drift.
- Do not add repository certificate workarounds if Docker/npm network access fails.
- Do not change database schema without a reviewed migration and explicit approval when the model changes.

## Step 1.1 completion notes

- Added frontend functional design tokens in `frontend/src/app/globals.css` for app background, surfaces, borders, text, action, danger, warning, success, info, radius, and card shadow.
- Added shared UI primitives under `frontend/src/ui/`: `Button`, `Input`, `Textarea`, `Select`, `Field`, `FieldLabel`, `Card`, `Badge`, `EmptyState`, `ErrorState`, `LoadingState`, and `cn`.
- Updated the placeholder home page to render a small design-foundation preview using the shared components, without adding product data flow.
- Added server-render smoke tests for the UI primitives and `cn` helper.
- Updated Vitest config so frontend `.test.tsx` files are included.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.

## Step 1.2 completion notes

- Added a typed frontend application API boundary under `frontend/src/api/` with separate frontend models and generated OpenAPI DTO usage isolated to the API boundary.
- Added `AppAPIError` normalization for unauthorized, not-found, conflict, and unexpected API failures.
- Added `RealFocusFlowAPI` as a screen-facing wrapper around `openapi-fetch` with `credentials: "include"` preserved for cookie auth.
- Added `MockFocusFlowAPI` with in-memory happy-path behavior for auth/session, Flows, Focuses, Goals, links, updates, deletion, cursor pagination, and expected `404`/`409` paths.
- Added API mode selection through `NEXT_PUBLIC_API_MODE`, defaulting to real mode unless set to `mock`.
- Updated `frontend/.env.example` to include `NEXT_PUBLIC_API_MODE=mock` for visual frontend review.
- Kept the legacy `createAPIClient` and `getHealth` exports available through the new boundary.
- Added tests for real transport credentials/error normalization, API mode selection, mock happy-path behavior, and API DTO/frontend model mapping.
- Verified generated OpenAPI types are only imported by the API boundary files that directly talk to the generated client or map DTOs.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.

## Step 1.3 completion notes

- Added a browser API singleton so mock mode preserves one in-memory API instance during the client session.
- Added `AuthProvider` and `useAuth` for frontend session state, login, logout, and refresh actions.
- Added `/login` with a mock-first sign-in form using shared UI primitives.
- Wrapped the home preview in `AuthGate` so unauthenticated users are redirected to `/login`.
- Added a session summary and logout action to the protected preview.
- Added pure auth routing and login-error helpers so redirect/error behavior can be tested without a browser test dependency.
- Updated Vitest config to resolve the same `@/*` source alias used by TypeScript and Next.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- Manual browser clicking is still a review action for this checkpoint.

## Step 1.4 completion notes

- Added reusable app shell components under `frontend/src/app-shell/`: `AppShell`, `Sidebar`, `PageHeader`, navigation items, and active-route helper.
- Replaced the temporary protected home layout with `AppShell` and `PageHeader` while keeping product data screens deferred.
- Kept sidebar navigation stable for current and near-future sections; future-only items are visually disabled and marked `Soon`.
- Kept session/logout display inside the protected shell.
- Added app shell tests for navigation active-state logic, sidebar rendering, disabled future items, and page header actions.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- Product Flow, Focus, and Goal screens remain deferred to the next frontend steps.

## Step 1.5 completion notes

- Added Flow UI components under `frontend/src/flows/`: `FlowDashboard`, `FlowCard`, `CreateFlowForm`, and Flow status/date helpers.
- Replaced the home placeholder with the mock-backed Flow dashboard inside the protected app shell.
- Added mock Flow listing through the frontend API boundary with children/goals included for card counts.
- Added successful create Flow behavior through the frontend API boundary, followed by a list refresh.
- Added loading, error, empty, success, and `Load more` UI states for the Flow dashboard shape.
- Kept generated OpenAPI DTOs isolated to the frontend API boundary; Flow UI consumes frontend models only.
- Added Flow card, Flow form, and status helper tests.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- Focus pages, Focus edit behavior, and Goal screens remain deferred to the next frontend steps.

## Step 1.6 completion notes

- Added `/focuses/[focusId]` as a protected Focus details route inside the app shell.
- Added Focus UI components under `frontend/src/focuses/`: `FocusDashboard`, `FocusSummary`, `ChildFocusCard`, and `CreateChildFocusForm`.
- Updated Flow cards so they navigate to the Focus aggregate page.
- Loaded one Focus aggregate through the frontend API boundary with child Focuses and Goals included for display counts.
- Added child Focus creation through the frontend API boundary using the current Focus as `parentId`, followed by a details reload.
- Displayed Focus status, tags, description, feedback, color marker, child count, Goal count, loading state, error state, and empty child state.
- Kept generated OpenAPI DTOs isolated to the frontend API boundary; Focus UI consumes frontend models only.
- Added Focus summary, child card, and child creation form tests.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- Focus edit behavior and Goal management UI remain deferred to the next frontend steps.

## Step 1.7 completion notes

- Added `FocusEditForm` for generic Focus fields: name, status, tags, description, feedback, and color.
- Added update request building that sends empty nullable fields through `clearFields` for description, feedback, and color.
- Kept hierarchy/parent changes out of the edit form.
- Wired the Focus details page to save edits through the frontend API boundary and reload the Focus aggregate.
- Preserved not-found and conflict error display paths through the existing API error normalization and form error state.
- Kept generated OpenAPI DTOs isolated to the frontend API boundary; Focus edit UI consumes frontend models only.
- Added Focus edit form and update input builder tests.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- Goal management UI remains deferred to the next frontend step.

## Step 1.8 completion notes

- Added Goal UI components under `frontend/src/goals/`: `GoalsPanel`, `CreateGoalForm`, `GoalCard`, `GoalProgress`, and Goal request builders.
- Wired the Focus details page to create, edit, delete, link, and unlink Goals through the frontend API boundary.
- Displayed Goal type, description, manual status override, derived progress percentages, and grouped status counts.
- Added simple link/unlink controls for direct child Focuses.
- Used `clearFields` to clear `statusOverride` when Goal status returns to derived mode.
- Kept generated OpenAPI DTOs isolated to the frontend API boundary; Goal UI consumes frontend models only.
- Added Goal form builder, progress, card, and create form tests.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The next frontend step is visual polish without product behavior changes.

## Step 1.9 completion notes

- Polished the frontend app background, shell surface, sidebar, session summary, page header, shared cards, and form controls using functional tokens.
- Added raised surface and stronger border tokens plus hover card shadow tokens.
- Improved sidebar active and hover states without changing navigation behavior.
- Improved form field label weight and input hover/focus affordances.
- Improved Flow, child Focus, and Goal card hover/focus affordances.
- Reworked the Focus page layout so the Focus summary sits above the two-column work area, with forms separated from child Focuses and Goals.
- Replaced a non-ASCII date separator in Focus summary copy with an ASCII separator to avoid repository text encoding surprises.
- Kept product behavior unchanged and did not touch the OpenAPI contract, API clients, backend, or data models.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.

## Step 2.1 completion notes

- Verified `docker-compose.local.yml` config.
- Built the backend image through Docker Compose without repository-level TLS or certificate workarounds.
- Started local PostgreSQL 17 and backend through `docker compose -f docker-compose.local.yml up --build -d`.
- Verified PostgreSQL reached healthy state and the backend container started.
- Verified backend logs report API startup on port `8080` and a successful database startup ping.
- Verified `GET http://localhost:8080/v1/health` returns `{"status":"ok"}`.
- Verified CORS preflight from `http://localhost:3000` returns `204`, allows credentials, allows expected methods, and returns `Access-Control-Allow-Origin: http://localhost:3000`.
- Verified a normal health request with `Origin: http://localhost:3000` returns the same allowed origin and credentials headers.

Validation:

- `docker compose -f docker-compose.local.yml config --quiet`.
- `docker compose -f docker-compose.local.yml up --build -d`.
- `docker compose -f docker-compose.local.yml ps`.
- `docker compose -f docker-compose.local.yml logs --tail 80 backend`.
- `Invoke-RestMethod -Uri http://localhost:8080/v1/health -Method Get`.
- `curl.exe -i -X OPTIONS http://localhost:8080/v1/health -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: GET"`.
- `curl.exe -i http://localhost:8080/v1/health -H "Origin: http://localhost:3000"`.
- `git diff --check`.

Notes:

- Docker commands needed to run outside the sandbox because the sandbox could not access the Docker Desktop Linux engine pipe.
- A PowerShell `Invoke-WebRequest` OPTIONS check failed with a local client `NullReferenceException`; the same CORS preflight succeeded through `curl.exe`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.
- Compose services were left running for the next backend verification steps.

## Step 2.2 completion notes

- Verified local goose migration status against the PostgreSQL service from `docker-compose.local.yml`.
- Applied local migrations through the backend image wrapper with `DATABASE_URL` pointing at the Compose `postgres` service.
- Verified local migration status after applying `000001_initial_schema.sql`; the local development database is at version `1`.
- Verified disposable migration flow through `docker-compose.test.yml` and `scripts/test-database-local.mjs`.
- Verified disposable `up/down/up` migration behavior and PostgreSQL storage integration tests.
- Confirmed the disposable test Compose project was removed after validation.

Validation:

- `docker compose -f docker-compose.local.yml run --rm --no-deps backend /app/bin/migrate status`.
- `docker compose -f docker-compose.local.yml run --rm --no-deps backend /app/bin/migrate up`.
- `docker compose -f docker-compose.local.yml run --rm --no-deps backend /app/bin/migrate status`.
- `npm run test:database:local`.
- `docker compose -f docker-compose.local.yml ps`.
- `git diff --check`.

Notes:

- Docker commands needed to run outside the sandbox because the sandbox could not access the Docker Desktop Linux engine pipe.
- The local development PostgreSQL named volume now contains the applied schema version `1`.
- Compose services were left running for the next backend verification steps.

## Step 2.3 completion notes

- Verified real HTTP auth behavior against the backend running from `docker-compose.local.yml`.
- Verified `GET /v1/auth/me` without a cookie returns `401`.
- Verified invalid credentials on `POST /v1/auth/login` return `401`.
- Verified valid login with local Compose credentials returns `200`, a session body, and a `focusflow_session` HttpOnly cookie.
- Verified `GET /v1/auth/me` with the cookie returns `200` and the configured local user.
- Verified `POST /v1/auth/refresh` with the cookie returns `200`, a refreshed session body, and a renewed session cookie.
- Verified `POST /v1/auth/logout` returns `204` and expires the session cookie.
- Verified `GET /v1/auth/me` after logout returns `401`.
- Verified protected user route `GET /v1/flows` returns `401` without a cookie and `200` with a valid cookie.

Validation:

- `curl.exe -sS -i http://localhost:8080/v1/auth/me -H "Origin: http://localhost:3000"`.
- `curl.exe -sS -i -X POST http://localhost:8080/v1/auth/login -H "Origin: http://localhost:3000" -H "Content-Type: application/json" --data-binary "@<bad-login-json>"`.
- `curl.exe -sS -i -c <cookie-jar> -X POST http://localhost:8080/v1/auth/login -H "Origin: http://localhost:3000" -H "Content-Type: application/json" --data-binary "@<good-login-json>"`.
- `curl.exe -sS -i -b <cookie-jar> http://localhost:8080/v1/auth/me -H "Origin: http://localhost:3000"`.
- `curl.exe -sS -i -b <cookie-jar> -c <cookie-jar> -X POST http://localhost:8080/v1/auth/refresh -H "Origin: http://localhost:3000"`.
- `curl.exe -sS -i -b <cookie-jar> -c <cookie-jar> -X POST http://localhost:8080/v1/auth/logout -H "Origin: http://localhost:3000"`.
- `curl.exe -sS -i -b <cookie-jar> http://localhost:8080/v1/auth/me -H "Origin: http://localhost:3000"`.
- `curl.exe -sS -i http://localhost:8080/v1/flows -H "Origin: http://localhost:3000"`.
- `curl.exe -sS -i -b <cookie-jar> "http://localhost:8080/v1/flows?limit=10" -H "Origin: http://localhost:3000"`.
- `git diff --check`.

Notes:

- Temporary JSON request bodies and cookie jars were created under the system temp directory and removed after the checks.
- Direct inline JSON passed to `curl.exe` through PowerShell produced invalid JSON because of shell quoting, so the auth checks used temporary request body files.
- A repeated `include` query parameter shape on `GET /v1/flows` returns a generated parser `400`; this is deferred to the backend error behavior cleanup step if it needs a friendlier response or contract clarification.
- Compose services were left running for the next backend verification steps.

## Step 2.4 completion notes

- Verified real backend CRUD behavior through HTTP against the backend running from `docker-compose.local.yml`.
- Verified valid-cookie creation and listing of a root Flow.
- Verified creating a child Focus under a Flow.
- Verified `POST /v1/focuses` with a missing parent returns `404`.
- Verified `GET /v1/focuses/{id}?include=children,goals&depth=1` returns the created child Focus in the aggregate.
- Verified `PATCH /v1/focuses/{id}` updates status and feedback, clears nullable description, and sets `finishedAt` for terminal status.
- Verified hierarchy conflict protection by trying to move a parent Flow under its child and receiving `409`.
- Verified creating a Goal with a linked Focus and derived progress.
- Verified listing Goals for a Focus.
- Verified linking and unlinking a Goal to another Focus.
- Verified updating a Goal and clearing `statusOverride` through `clearFields`.
- Verified deleting a Goal and receiving `404` on a follow-up read.
- Verified deleting the root Flow subtree and receiving `404` for both the root Flow and child Focus.
- Verified backend and PostgreSQL containers remained healthy after the smoke run.

Validation:

- Temporary Node HTTP smoke script using `fetch`, an in-memory cookie, and local Compose credentials.
- `docker compose -f docker-compose.local.yml ps`.
- `docker compose -f docker-compose.local.yml logs --tail 120 backend`.
- `git diff --check`.

Notes:

- The temporary smoke script was written under `.tmp/`, executed, and removed after the check.
- Compose services were left running for the next backend verification steps.

## Step 2.5 completion notes

- Added generated-router and strict-handler error hooks in the backend HTTP adapter so request parsing errors return JSON error responses instead of `text/plain` `http.Error` bodies.
- Added API-boundary query validation for OpenAPI-described query constraints: `limit` range, `depth` range, non-empty `cursor`, supported comma-separated `include` values, and repeated scalar query parameters.
- Kept the OpenAPI contract unchanged. The existing parameter schema already defines these input constraints; this step only made runtime behavior match them more predictably.
- Added handler tests for invalid JSON, invalid UUID path values, invalid pagination/depth/cursor/include query values, and repeated scalar `include`.
- Verified the rebuilt Docker Compose backend returns JSON `400` with `bad_request` for invalid JSON, invalid UUID, invalid query values, unsupported include, and repeated include.
- Verified expected domain errors still use their existing JSON responses, including missing parent `404` with `not_found`.

Validation:

- `gofmt -w internal/api`.
- `go test ./...`.
- `go vet ./...`.
- `go tool staticcheck ./...`.
- `go build -o .tmp/check-backend/api.exe ./cmd/api`.
- `docker compose -f docker-compose.local.yml up --build -d`.
- Temporary Node HTTP smoke script using `fetch`, an in-memory cookie, and local Compose credentials.
- `docker compose -f docker-compose.local.yml ps`.
- `docker compose -f docker-compose.local.yml logs --tail 80 backend`.
- `git diff --check`.

Notes:

- The temporary HTTP smoke script was written under `.tmp/`, executed, and removed after the check.
- The local Docker Compose backend and PostgreSQL services were left running for the next backend verification step.

## Step 1.10 completion notes

- Added a shared `Modal` primitive under `frontend/src/ui/` with dialog semantics, overlay styling, title/description slots, close action, and reusable content area.
- Exported the modal from the shared UI package.
- Refactored `CreateFlowForm` into a shell-free form component so it can be used inside modal layouts.
- Replaced the always-visible Flow creation column with a `Create Flow` page action that opens the modal.
- Added a `Create Flow` action to the empty Flows state.
- Closed the modal after a successful Flow creation and preserved the existing frontend API boundary behavior.
- Replaced mock-specific primary page copy with product-facing copy for the Flows dashboard.
- Added modal rendering tests and kept the existing Flow creation form rendering test.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.

## Step 1.11 completion notes

- Refactored `FocusEditForm` into a shell-free form component so the Focus page can control where the editor is shown.
- Refactored `CreateChildFocusForm` into a shell-free form component for modal usage.
- Added `Edit Focus` as a Focus page header action.
- Added `Create child Focus` as a Child Focuses section action and as an empty-state action.
- Added modal wrappers for Focus editing and child Focus creation on the Focus details page.
- Closed the relevant modal after a successful Focus save or child Focus creation.
- Removed the persistent left-column edit/create forms so the Focus page reads as data-first.
- Replaced mock-specific Focus loading copy with product-facing copy.
- Kept generated OpenAPI DTOs isolated to the frontend API boundary.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run src/focuses/focus-edit-form.test.tsx src/focuses/create-child-focus-form.test.tsx`.
- `npm --prefix frontend run build`.
- `npm --prefix frontend test -- --run`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.

## Step 1.12 completion notes

- Refactored `CreateGoalForm` into a shell-free form component for modal usage.
- Added `EditGoalForm` as a dedicated Goal edit form component.
- Replaced the always-visible Goal creation form with a `Create Goal` section action and modal.
- Replaced inline Goal editing inside `GoalCard` with an `Edit Goal` modal launched from the card.
- Kept Goal cards display-focused while preserving delete and link/unlink actions.
- Added expandable linked Focus display inside Goal cards.
- Rendered linked Focuses as clickable items with status badges and mini status meters that navigate to their Focus page.
- Reworked Goal progress into one segmented visual bar with grouped status chips for done, in-progress, planned, and cancelled states.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run src/focuses/focus-summary.test.tsx src/focuses/child-focus-card.test.tsx src/goals/create-goal-form.test.tsx src/goals/edit-goal-form.test.tsx src/goals/goal-card.test.tsx src/goals/goal-progress.test.tsx`.
- `npm --prefix frontend run build`.
- `npm --prefix frontend test -- --run`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.

## Step 1.13 completion notes

- Replaced the large Focus summary card with a compact Focus info panel.
- Removed duplicated Focus title from the Focus info panel; the Focus name remains in the page header.
- Removed `Created` and `Updated` date copy from the Focus page summary.
- Moved status and tags into the compact Focus info panel.
- Kept empty feedback hidden in the Focus info panel.
- Removed the raw color value and `Color marker` copy from read-only Focus page display.
- Applied the Focus color as a left-border visual accent on the Focus info panel.
- Applied child Focus colors as left-border visual accents on child Focus cards, with `#0f766e` as the fallback accent.
- Added a status selector to the Focus info panel so status can be changed without opening the edit modal.
- Removed the `Child Focuses` title from the Focus page while keeping the `Create child Focus` action.
- Made child Focus cards clickable as a whole and route to the child Focus page.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run src/focuses/focus-summary.test.tsx src/focuses/child-focus-card.test.tsx src/goals/create-goal-form.test.tsx src/goals/edit-goal-form.test.tsx src/goals/goal-card.test.tsx src/goals/goal-progress.test.tsx`.
- `npm --prefix frontend run build`.
- `npm --prefix frontend test -- --run`.
- `rg -n "generated/schema|components\\['schemas'\\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.

## Step 1.14 completion notes

- Added a custom Focus page header with the Focus label, root-aware path/breadcrumb, title, description, and right-side vertical actions.
- Replaced the non-root `Back to Flows` affordance with a Focus path; root Flows keep `Back to Flows`.
- Moved the Focus color accent to the full header block and removed raw color/date/debug copy from normal read views.
- Renamed child Focus and Goal creation actions to `Add child Focus` and `Add Goal`.
- Moved create/edit forms into wider top-positioned modals.
- Changed Goal cards to collapsed one-line rows with type and mini progress by default, with details expanding on click.
- Consolidated linked Focus display into one expandable details section with clickable Focus links and mini status meters.
- Added a delete confirmation prompt for Goal deletion.
- Kept generated OpenAPI DTO usage isolated to `frontend/src/api`.

Validation:

- `npm --prefix frontend run typecheck`.
- `npm --prefix frontend run lint`.
- `npm --prefix frontend test -- --run src/focuses/focus-summary.test.tsx src/focuses/child-focus-card.test.tsx src/focuses/create-child-focus-form.test.tsx src/goals/create-goal-form.test.tsx src/goals/edit-goal-form.test.tsx src/goals/goal-card.test.tsx src/goals/goal-progress.test.tsx`.
- `npm --prefix frontend test -- --run`.
- `npm --prefix frontend run build`.
- `rg -n "generated/schema|components\['schemas'\]" frontend/src --glob "!api/generated/**"` showed generated OpenAPI usage only in `frontend/src/api/mappers.ts` and `frontend/src/api/real.ts`.
- `git diff --check`.

Notes:

- Vitest and Next build needed to run outside the sandbox on this Windows machine because the sandbox blocked child process spawning with `spawn EPERM`.
- The frontend dev server was not started because port `3000` was already in use by the user's local frontend session.