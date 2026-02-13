import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { z } from "zod";

// ============================================================
// 1. CREATE SERVER
// ============================================================

const server = new McpServer({
  name: "student-info-mcp-server",
  version: "1.0.0",
});

// ============================================================
// 2. MOCK DATA (vervang later met echte API calls)
// ============================================================

const restaurantMenus: Record<string, { menu: string; price: string }> = {
  alma: {
    menu: "Spaghetti bolognese, Vegetarische curry, Kip tikka masala",
    price: "€4.50",
  },
  gasthuisberg: {
    menu: "Vis met aardappelen, Veggie burger, Tomatensoep",
    price: "€4.00",
  },
  camino: {
    menu: "Pasta pesto, Caesar salade, Chili con carne",
    price: "€5.00",
  },
};

const campusFacilities: Record<string, string> = {
  library: "Open: 8u-22u, 500 studieplekken, gratis wifi",
  sporthal: "Open tot 21u, badminton en zaalvoetbal beschikbaar",
  parking: "P1: 45 vrije plaatsen, P2: vol, P3: 12 vrije plaatsen",
  printer: "Gebouw A verdieping 0: beschikbaar, Gebouw C verdieping 1: storing",
};

// ============================================================
// 3. REGISTER TOOLS
// ============================================================

server.registerTool(
  "student_get_restaurant_menu",
  {
    title: "Get Restaurant Menu",
    description: `Haal het dagmenu op voor een HoGent restaurant.

Beschikbare restaurants: alma, gasthuisberg, camino.
Retourneert het menu met prijzen.

Args:
  - restaurant (string): Naam van het restaurant (bijv. "alma")

Returns:
  Menu items en prijs als tekst, of een foutmelding als het restaurant niet gevonden is.`,
    inputSchema: {
      restaurant: z
        .string()
        .min(1, "Restaurant naam is verplicht")
        .describe("Restaurant naam, bijv. 'alma', 'gasthuisberg', 'camino'"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ restaurant }) => {
    const key = restaurant.toLowerCase().trim();
    const data = restaurantMenus[key];

    if (!data) {
      const available = Object.keys(restaurantMenus).join(", ");
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Restaurant '${restaurant}' niet gevonden. Beschikbare restaurants: ${available}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `🍽️ ${restaurant.charAt(0).toUpperCase() + restaurant.slice(1)} — Dagmenu\n\n${data.menu}\n\nPrijs: ${data.price}`,
        },
      ],
    };
  }
);

server.registerTool(
  "student_get_campus_info",
  {
    title: "Get Campus Facility Info",
    description: `Haal informatie op over een campusfaciliteit.

Beschikbare faciliteiten: library, sporthal, parking, printer.
Retourneert openingsuren, beschikbaarheid en status.

Args:
  - facility (string): Naam van de faciliteit (bijv. "library")

Returns:
  Status en informatie over de faciliteit.`,
    inputSchema: {
      facility: z
        .string()
        .min(1, "Faciliteit naam is verplicht")
        .describe("Faciliteit: 'library', 'sporthal', 'parking', 'printer'"),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ facility }) => {
    const key = facility.toLowerCase().trim();
    const data = campusFacilities[key];

    if (!data) {
      const available = Object.keys(campusFacilities).join(", ");
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Faciliteit '${facility}' niet gevonden. Beschikbaar: ${available}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `🏫 ${facility.charAt(0).toUpperCase() + facility.slice(1)}\n\n${data}`,
        },
      ],
    };
  }
);

// ============================================================
// 4. TRANSPORT — kies via environment variable
//    TRANSPORT=http  → Streamable HTTP (voor devtunnel + agents toolkit)
//    TRANSPORT=stdio → stdio (voor lokaal testen met MCP Inspector)
// ============================================================

async function runHTTP() {
  const app = express();
  app.use(express.json());

  // MCP endpoint
  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "student-info-mcp-server" });
  });

  const port = parseInt(process.env.PORT || "3000");
  const httpServer = app.listen(port, () => {
    console.log(`✅ MCP server (HTTP) running on http://localhost:${port}/mcp`);
    console.log(`   Health check: http://localhost:${port}/health`);
    console.log("");
    console.log(`📡 Om te connecteren met Agents Toolkit:`);
    console.log(`   1. Start een devtunnel:  devtunnel host -p ${port} --allow-anonymous`);
    console.log(`   2. Gebruik de devtunnel URL + /mcp in de toolkit`);
  });

  httpServer.on("error", (err) => {
    console.error("Server error:", err);
  });

  process.on("SIGINT", () => {
    console.log("\n🛑 Server shutting down...");
    httpServer.close();
    process.exit(0);
  });
}

async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP server (stdio) running");
}

// Start based on TRANSPORT env var (default: http)
const transportType = process.env.TRANSPORT || "http";

if (transportType === "stdio") {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}