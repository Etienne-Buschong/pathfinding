const PathfindingManager = require('./PathfindingManager');
const pathfindingManager = new PathfindingManager();
requestAnimationFrame(loop);
function loop(timestamp) {
    pathfindingManager.loop(timestamp);
    requestAnimationFrame(loop);
}