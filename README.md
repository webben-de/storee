# Storee

> **Know where everything is. Always.**

Storee is a local-first Angular PWA for tracking *where* you store physical objects. No more searching every drawer — just open Storee and find it in seconds.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | NX 22 (Angular preset) |
| Framework | Angular 21 (standalone components) |
| Styling | Tailwind CSS v3 |
| Linting / Formatting | Biome |
| Database | IndexedDB via Dexie.js v4 |
| State | NgRx Signals (`signalStore`) |
| Auth | PIN lock — Web Crypto API (SHA-256) |
| i18n | Transloco (EN + DE) |
| Navigation | Angular Router (lazy-loaded feature libs) |
| Graph view | D3.js (tree layout) |
| PWA | @angular/service-worker + Web App Manifest |

All data stays on-device (IndexedDB). Manual JSON backup/restore available in Settings.

---

## Workspace Structure

```
storee/
├── src/                          ← Angular app shell (routing, layout)
└── libs/
    ├── data-access/
    │   ├── db/                   ← Dexie schema, migrations, backup helpers
    │   ├── locations/            ← LocationStore (signalStore + liveQuery)
    │   ├── objects/              ← ObjectStore (signalStore + move history)
    │   └── settings/             ← SettingsStore (theme, language, PIN hash)
    ├── feature-home/             ← Root location list
    ├── feature-search/           ← Full-text search
    ├── feature-graph/            ← D3 interactive tree
    ├── feature-locations/        ← Location detail + create/edit
    ├── feature-objects/          ← Object detail + create/edit + move
    ├── feature-settings/         ← PIN, theme, language, backup/restore
    ├── feature-lock/             ← PIN keypad lock screen
    ├── ui/                       ← Shared Tailwind components
    └── util/
        ├── auth/                 ← hashPin, verifyPin, AuthGuard, session lock
        └── i18n/                 ← Transloco setup + HttpLoader
```

---

## Routes

| Route | Feature |
|---|---|
| `/` | Home — root locations |
| `/search` | Full-text search |
| `/graph` | D3 storage tree |
| `/settings` | Settings |
| `/location/new?parent=:id` | Create location |
| `/location/:id` | Location detail |
| `/location/:id/edit` | Edit location |
| `/object/new?location=:id` | Create object |
| `/object/:id` | Object detail + move history |
| `/object/:id/edit` | Edit object |
| `/lock` | PIN lock screen |

All routes except `/lock` are protected by `AuthGuard` (redirects to `/lock` when PIN is set and session is locked).

---

## Data Model

```
Location    id, parent_id, name, description, icon, gps_lat/lng, image_uri, sort_order, created_at, updated_at
Object      id, location_id, name, description, category, tags[], image_uri, gps_lat/lng, quantity, created_at, updated_at
ObjectHistory  id, object_id, from_location_id, to_location_id, moved_at
Settings    key, value  (pin_hash | language | theme)
```

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm start          # or: pnpm exec nx serve storee

# Production build
pnpm build          # or: pnpm exec nx build storee

# Lint with Biome
pnpm lint

# Format with Biome
pnpm format
```

---

## Key Architecture Decisions

- **Dexie `liveQuery` → NgRx Signals**: DB changes automatically propagate to UI without manual subscription management.
- **Biome replaces ESLint + Prettier**: single tool, zero config sprawl, faster.
- **Lazy-loaded feature libs**: each screen group is a separate NX lib loaded on demand — keeps the initial bundle small.
- **Base64 images in IndexedDB**: avoids File System Access API complexity; works offline without extra permissions.
- **`@storee/*` path aliases**: all libs are importable as `@storee/feature-home`, `@storee/util-auth`, etc.

---

## Roadmap Ideas

- [ ] NFC / QR code labels — scan a tag to open the location in Storee
- [ ] Shared storage with family (optional cloud sync)
- [ ] Reminder / expiry dates for objects
- [ ] Electron desktop wrapper

---

## License

MIT


[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-standalone-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve storee
```

To create a production bundle:

```sh
npx nx build storee
```

To see all available targets to run for a project, run:

```sh
npx nx show project storee
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-standalone-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
