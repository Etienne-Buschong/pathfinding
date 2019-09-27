const PathfindingManager = require('./PathfindingManager');
const pathfindingManager = new PathfindingManager();
requestAnimationFrame(loop);
function loop() {
    pathfindingManager.loop();
    requestAnimationFrame(loop);
}