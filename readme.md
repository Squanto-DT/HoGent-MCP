# Student Info MCP Server

MCP server voor KU Leuven campus info — restaurants, faciliteiten, etc.  
Gebouwd om te connecteren met een M365 Agents Toolkit declarative agent.

## Quick Start

### Stap 1: Installeer dependencies

```bash
npm install
```

### Stap 2: Build

```bash
npm run build
```

### Stap 3: Start de server

```bash
npm start
```

Je ziet: `✅ MCP server (HTTP) running on http://localhost:3000/mcp`

### Stap 4: Test of het werkt

```bash
curl http://localhost:3000/health
```

Verwachte output: `{"status":"ok","server":"student-info-mcp-server"}`

## Connecteren met Agents Toolkit via Dev Tunnel

### 1. Installeer devtunnel

```bash
winget install Microsoft.devtunnel
```

### 2. Login

```bash
devtunnel user login
```

### 3. Start tunnel (in een tweede terminal)

```bash
devtunnel host -p 3000 --allow-anonymous
```

Noteer de publieke URL, bijv: `https://abc123-3000.euw.devtunnels.ms`

### 4. Koppel aan Declarative Agent

1. Open VS Code → Microsoft 365 Agents Toolkit
2. Create a new Declarative Agent
3. Add Action → Start with an MCP Server
4. Vul in: `https://abc123-3000.euw.devtunnels.ms/mcp`
5. De toolkit detecteert automatisch je tools

## Beschikbare Tools

| Tool | Beschrijving |
|------|-------------|
| `student_get_restaurant_menu` | Dagmenu ophalen (alma, gasthuisberg, camino) |
| `student_get_campus_info` | Faciliteit info (library, sporthal, parking, printer) |

## Transport Modes

```bash
# HTTP (default) — voor devtunnel + agents toolkit
npm start

# stdio — voor lokaal testen met MCP Inspector
TRANSPORT=stdio npm start
```

## Project Structuur

```
student-info-mcp-server/
├── package.json        # Dependencies en scripts
├── tsconfig.json       # TypeScript configuratie
├── src/
│   └── index.ts        # Server + tools + transport
└── dist/               # Build output (na npm run build)
```