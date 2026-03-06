import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

async function main() {
    console.log("Connecting to Stitch MCP...");
    const transport = new SSEClientTransport(
        new URL("https://stitch.googleapis.com/mcp"),
        {
            headers: {
                "X-Goog-Api-Key": "AQ.Ab8RN6LR6JqZBVhy5cUVLCYyxJplRyDPHH-_VFrzay8iULIJeQ"
            }
        }
    );

    const client = new Client(
        { name: "antigravity-client", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    console.log("Connected!");

    console.log("Fetching tools...");
    const tools = await client.listTools();
    console.log("Tools:", tools.tools.map(t => t.name));

    console.log("Running list_projects...");
    try {
        const projects = await client.callTool({
            name: "list_projects",
            arguments: {}
        });
        console.log("Projects:", JSON.stringify(projects, null, 2));

        if (projects.content && projects.content[0] && Array.isArray(JSON.parse(projects.content[0].text))) {
            const projList = JSON.parse(projects.content[0].text);
            const targetProj = projList.find(p => typeof p === 'string' ? p.toLowerCase().includes('neptune') : p.name.toLowerCase().includes('neptune')) || projList[0];
            const projId = typeof targetProj === 'string' ? targetProj : targetProj.id || targetProj;

            console.log("\nRunning list_screens for project:", projId);
            const screens = await client.callTool({
                name: "list_screens",
                arguments: { projectId: projId }
            });
            console.log("Screens:", JSON.stringify(screens, null, 2));
        }

    } catch (e) {
        console.error("Tool execution failed:", e.message);
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
