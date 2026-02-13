import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
 
const app = express();
app.use(cors());
app.use(express.json());
 
// MCP server as child process
let mcpProcess = null;
 
function startMCPServer() {
    mcpProcess = spawn('node', ['../student-info-mcp/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
 
    mcpProcess.stderr.on('data', (data) => {
        console.log('MCP Server', data.toString());
    });
}
 
// LOGGING MIDDLEWARE - logt ELKE request
app.use((req, res, next) => {
    console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('   Params:', req.params);
    console.log('   Query:', req.query);
    next();
});
 
// Simulate MCP calls
async function callMCPTool(toolName, args) {
    if(toolName === 'get_restaurant_menu'){
        const restaurants =         {
            "restod": {
                menu: "Spaghetti Bolognese, Pizza Margherita, Caesar Salad",
                price: "€4,50"
            },
            "restoe":{
                menu: "Grilled Chicken, Veggie Burger, Greek Salad",
                price: "€5,00"
            },
            "restof": {
                menu: "Fish and Chips, Veggie Wrap, Tomato Soup",
                price: "€4,00"
            }
        }
 
        const rest = restaurants[args.restaurant.toLowerCase()];
        return rest ? `${args.restaurant} menu: ${rest.menu} (${rest.price})` : "Restaurant not found";
    }
 
    if(toolName == 'get_campus_info'){
        const info = {
            library: "Open: 8u-22u, 500 studieplekken beschikbaar",
            sporthal: "Open tot 21u, badminton banen vrij",
            parking: "P1: 45 plaatsen vrij, P2: vol"
        }
 
        return info[args.facility] || "Facility not found";
    }
}
 
// Rest API endpoints
app.get('/api/restaurant/:name', async (req, res) => {
    try{
        const result = await callMCPTool('get_restaurant_menu', {
            restaurant: req.params.name
        });
        res.json({ success: true, data: result});
 
    }catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
 
app.get('/api/campus/:facility', async (req, res) => {
    try{
        const result = await callMCPTool('get_campus_info', {
            facility: req.params.facility
        });
 
        res.json({ success: true, data: result});
    }catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
 
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mcp: mcpProcess ? 'running' : 'not running'});
});
 
// OpenAPI spec endpoint
app.get('/openapi.json', (req, res) => {
    res.json({
        "openapi": "3.0.0",
        "info": {
            "title": "Student Info API",
            "version": "1.0.0"
        },
        "servers": [
            { "url": "https://0rhcv7k5-3000.euw.devtunnels.ms" }
        ],
        "paths": {
            "/api/restaurant/{name}": {
                "get": {
                    "summary": "Get restaurant menu",
                    "operationId": "api_restaurant_item_get",
                    "parameters": [{
                        "name": "name",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" }
                    }],
                    "responses": {
                        "200": {
                            "description": "Success",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": { "type": "boolean" },
                                            "data": { "type": "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/campus/{facility}": {
                "get": {
                    "summary": "Get campus facility info",
                    "operationId": "api_campus_facility_item_get",
                    "parameters": [{
                        "name": "facility",
                        "in": "path",
                        "required": true,
                        "schema": { "type": "string" }
                    }],
                    "responses": {
                        "200": {
                            "description": "Success",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "success": { "type": "boolean" },
                                            "data": { "type": "string" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});
 
 
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Server running on http://localhost:${PORT}`);
    startMCPServer();
});
 