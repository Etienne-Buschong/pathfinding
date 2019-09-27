const Pathfinding = require('./Pathfinding');
const pathfinding = new Pathfinding();
requestAnimationFrame(loop);
function loop() {
    pathfinding.loop();
    requestAnimationFrame(loop);
}