# Net Diagram Ultimate

A network diagram editor built with vanilla PHP and JavaScript. Design, visualize, and test network topologies entirely in the browser — no frameworks, no build tools, no SPA runtime.

## Features

- **Drag-and-drop diagram editor** — place routers, switches, modems, antennas, and computers on a canvas
- **Bidirectional links** — connect devices with paired lines that delete together
- **Device management** — create, edit, clone, and delete devices with type-specific properties (SSID, frequency, mode, VLAN, ports)
- **Real-time ping** — test connectivity to any device from the context menu
- **Serial ping (Ping en Serie)** — ping multiple IP addresses in parallel using Web Workers, with infinite loop support
- **Ping Trace (Trazado de Ping)** — select a source and destination device; the system finds the shortest path through interconnected devices and pings each hop sequentially with visual tracking
- **Canvas boxes & notes** — organize your diagram with colored bounding boxes and free-text notes
- **Export to PNG** — save the diagram as an image
- **Mobile support** — tap-to-context-menu, touch-friendly selectors, locked drag on touch devices
- **Legacy data compatible** — reads from and writes to the original `netdiagram` database schema; supports migration to v2

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8+ (native, no framework) |
| Database | MySQL / MariaDB |
| Frontend | Vanilla JavaScript (ES6+), CSS3 |
| Realtime | `fetch()` API, Web Workers |
| Diagram | Absolute-positioned DOM elements |
| Icons | Custom SVG (black line-art) |

## Project Structure

```
net-diagram-ultimate/
├── public/                     # Web root
│   ├── index.php               # Front controller (all routes)
│   ├── .htaccess               # URL rewriting
│   └── assets/
│       ├── css/
│       │   └── main.css        # All styles (~1050 lines)
│       ├── js/
│       │   ├── libs/           # Third-party (html2canvas, canvas2image)
│       │   ├── modules/        # JS modules (IIFE pattern)
│       │   │   ├── api.js          # Fetch wrapper with BASE_PATH
│       │   │   ├── dom-helpers.js  # DOM utilities + IP input component
│       │   │   ├── state.js        # Diagram state (dirty flag, ID counters)
│       │   │   ├── devices.js      # Device DOM element creation
│       │   │   ├── forms.js        # Dynamic create/edit forms
│       │   │   ├── drag.js         # Drag & drop (mouse + touch)
│       │   │   ├── links.js        # Line creation + paired deletion
│       │   │   ├── boxes.js        # Bounding box creation
│       │   │   ├── context-menu.js # Right-click / tap context menus
│       │   │   ├── keyboard.js     # Keyboard shortcuts + save
│       │   │   ├── modals.js       # Modal open/close
│       │   │   ├── editor.js       # Main editor wiring
│       │   │   ├── export.js       # PNG export
│       │   │   ├── ping.js         # Single-device ping
│       │   │   ├── ping-serie.js   # Parallel serial ping
│       │   │   └── ping-trace.js   # Path-finding ping trace
│       │   └── workers/
│       │       └── ping-worker.js  # Web Worker for parallel pings
│       └── img/
│           └── devices/        # SVG device icons
├── src/                        # PHP backend
│   ├── config.php              # App + DB configuration
│   ├── Database.php            # MySQL connection (mysqli)
│   ├── Router.php              # Simple HTTP router (get/post/put/patch/delete)
│   ├── Request.php             # Request parser (JSON, FormData, query params)
│   ├── Response.php            # JSON response + redirect helper
│   ├── Session.php             # Session management
│   ├── Auth.php                # Authentication
│   ├── Validator.php           # Input validation
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── DiagramController.php
│   │   ├── DeviceController.php
│   │   ├── CanvasController.php
│   │   └── PingController.php
│   └── models/
│       ├── Device.php          # Device CRUD + saveBatch
│       ├── Diagram.php         # Diagram CRUD + clone/clear
│       └── SerieIp.php         # IP series CRUD
├── views/
│   ├── login.php               # Login page
│   ├── main-menu.php           # Dashboard + diagram list
│   ├── diagram-editor.php      # Main editor view
│   └── layouts/
│       ├── auth.php            # Layout for login
│       └── base.php            # Layout for main views
├── .env.example                # Environment template
├── .htaccess                   # Root-level rewrite
├── netdiagram.sql              # Original v1 schema
├── netdiagram_v2.sql           # Clean v2 schema (new installations)
└── migrate_v2.sql              # v1 → v2 migration script
```

## Installation

1. **Clone** the repository into your web server directory (e.g., `C:\Laragon\www\net-diagram-ultimate`)

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and base URL.

3. **Import the database**
   - For a **new installation**: import `netdiagram_v2.sql`
   - For **migration** from an existing v1 database: import `migrate_v2.sql`

4. **Set up rewrite rules**
   - Apache: the included `.htaccess` files handle rewriting automatically
   - Nginx: configure a similar rewrite to `public/index.php`

5. **Access**
   ```
   http://localhost/net-diagram-ultimate
   ```

The health-check endpoint is available at `http://localhost/net-diagram-ultimate/health`.

## API Endpoints

All API routes return JSON. Authentication is session-based.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Authenticate |
| `GET`  | `/api/diagrams` | List user diagrams |
| `POST` | `/api/diagrams` | Create diagram |
| `GET`  | `/api/diagrams/{id}` | Load diagram data |
| `PUT`  | `/api/diagrams/{id}` | Update diagram name/size |
| `DELETE` | `/api/diagrams/{id}` | Delete diagram |
| `POST` | `/api/diagrams/{id}/clone` | Clone diagram |
| `POST` | `/api/diagrams/{id}/clear` | Clear all objects |
| `POST` | `/api/diagrams/{id}/save-batch` | Save all objects (lines, devices, notes, boxes) |
| `POST` | `/api/ping` | Ping an IP address |
| `GET`  | `/api/ip-serie` | List serial ping IPs |
| `POST` | `/api/ip-serie` | Add serial ping IP |
| `PUT`  | `/api/ip-serie/{id}` | Update serial ping entry |
| `DELETE` | `/api/ip-serie/{id}` | Delete serial ping entry |

## Database Schema (v2)

The v2 schema replaces the legacy `style` column (serialized CSS) with native columns:

- **`diagrams_lines`**: `pos_x`, `pos_y`, `line_width`, `line_angle` — line position as individual values
- **`diagrams_objects`**: type-specific tables with native columns
- **`diagrams_boxes`**: `pos_x`, `pos_y`, `box_width`, `box_height`, `color`, `border_color`
- **`diagrams_notes`**: `pos_x`, `pos_y`, `text`
- **`diagrams_anthenas`**: retains legacy `apClient` field for backward compatibility

## Design Decisions

- **No framework, no build step** — plain PHP classes with a minimal router; vanilla JS modules loaded via script tags
- **`BASE_PATH` global** — supports both virtual host (`/`) and subdirectory (`/net-diagram-ultimate`) deployments
- **DOM-based diagram** — objects are positioned `<div>` elements, not `<canvas>` rendering; lines are thin rotated divs
- **Paired lines** — every connection creates two `<div>` elements with cross-referencing `data-id` / `data-brother` attributes
- **Web Workers for parallel pings** — each IP gets its own worker for truly parallel execution
- **BFS for trace routing** — ping trace uses breadth-first search to find the shortest path through interconnected devices
- **IP input as 4-octet fields** — each octet is a separate `<input>`, auto-advancing on 3 digits or `.` key, storing as `192.168.1.1` in a hidden field
