/**
 * Pathfinder Utility
 * Ports A* logic from Python to JS for client-side navigation.
 */

// Heuristic function (Euclidean distance)
const heuristic = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const findPath = (graph, startId, endId) => {
    if (!graph || !graph.nodes || !graph.edges) return null;

    const nodes = graph.nodes;
    const edges = graph.edges;

    // Create a map for fast node lookup
    const nodeMap = {};
    nodes.forEach(n => nodeMap[n.id] = n);

    const startNode = nodeMap[startId];
    const endNode = nodeMap[endId];

    if (!startNode || !endNode) {
        console.error("Start or End node not found");
        return null;
    }

    const openSet = [startId];
    const cameFrom = {};

    const gScore = {}; // Cost from start to node
    const fScore = {}; // Estimated total cost (g + h)

    nodes.forEach(n => {
        gScore[n.id] = Infinity;
        fScore[n.id] = Infinity;
    });

    gScore[startId] = 0;
    fScore[startId] = heuristic(startNode, endNode);

    while (openSet.length > 0) {
        // Get node in openSet with lowest fScore
        let current = openSet.reduce((prev, curr) =>
            (fScore[curr] < fScore[prev] ? curr : prev)
        );

        if (current === endId) {
            return reconstructPath(cameFrom, current, nodeMap);
        }

        // Remove current from openSet
        openSet.splice(openSet.indexOf(current), 1);

        // Find neighbors
        const neighbors = edges
            .filter(e => e.source === current || e.target === current)
            .map(e => (e.source === current ? e.target : e.source));

        for (const neighbor of neighbors) {
            // Calculate distance
            const neighborNode = nodeMap[neighbor];
            const currentNode = nodeMap[current];
            const dist = heuristic(currentNode, neighborNode);

            const tentativeGScore = gScore[current] + dist;

            if (tentativeGScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + heuristic(neighborNode, endNode);

                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return null; // No path found
};

const reconstructPath = (cameFrom, current, nodeMap) => {
    const totalPath = [nodeMap[current]];
    while (current in cameFrom) {
        current = cameFrom[current];
        totalPath.unshift(nodeMap[current]);
    }
    return totalPath;
};

// Helper: Convert graph coordinates to canvas coordinates
export const scalePath = (path, scaleX, scaleY) => {
    return path.map(node => ({
        x: node.x * scaleX,
        y: node.y * scaleY
    }));
};
