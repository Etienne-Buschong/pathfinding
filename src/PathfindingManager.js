const Grid = require('./Grid');
const { GridView, NodeColor } = require('./GridView');
const GridInputController = require('./GridInputController');
const { SettingsInputController, SelectionType } = require('./SettingsInputController');
const { NodeType } = require('./Node');
const AStar = require('./AStar');
const { manhattanDistance } = require('./heuristics');

class PathfindingManager {

    constructor() {
        this.container = document.getElementById('canvas');
        this.grid = new Grid();
        this.gridView = new GridView(this.grid);
        this.gridInputController = new GridInputController(this.container);
        this.settingsInputController = new SettingsInputController();
        this.path = null;
    }

    loop() {
        this.update();
        this.draw();
    }

    update() {
        if (this.gridInputController.hoverPosition) {
            const x = this.gridInputController.hoverPosition.x;
            const y = this.gridInputController.hoverPosition.y;
            this.gridView.setFocusedNode(x, y);
            if (this.gridInputController.mouseDown) {
                const selectionType = this.settingsInputController.currentModeSelection.value;
                const nodeType = this.selectionTypeToNodeType(selectionType);
                const pos = this.gridView.coordsToGridPosition(x, y);
                this.grid.setNodeType(pos.x, pos.y, nodeType);
            }
        } else {
            this.gridView.clearFocusedNode();
        }
        if (this.settingsInputController.startPathfinding) {
            const astar = new AStar(this.grid, manhattanDistance);
            const result = astar.astar();
            this.path = result.solution;
            this.settingsInputController.startPathfinding = false;
        }
    }

    draw() {
        this.gridView.clearCanvas('whitesmoke');
        this.gridView.drawNodes();
        this.gridView.drawFocusedNode(
            this.selectionTypeToNodeColor(this.settingsInputController.currentModeSelection.value));
        if (this.path) {
            this.gridView.drawWalkingPath(this.path);
        }
        this.gridView.markDirty = false;
    }

    invalidatePath() {
        this.path = null;
    }

    selectionTypeToNodeType(selectionType) {
        switch (selectionType) {
            case SelectionType.START:
                return NodeType.START;
            case SelectionType.REMOVE:
                return NodeType.UNSELECTED;
            case SelectionType.TARGET:
                return NodeType.TARGET;
            case SelectionType.WALL:
                return NodeType.WALL;
        }
    }

    selectionTypeToNodeColor(selectionType) {
        switch (selectionType) {
            case SelectionType.START:
                return NodeColor.START;
            case SelectionType.REMOVE:
                return NodeColor.REMOVE;
            case SelectionType.TARGET:
                return NodeColor.TARGET;
            case SelectionType.WALL:
                return NodeColor.WALL;
        }
    }

}

module.exports = PathfindingManager;