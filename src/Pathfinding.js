const Grid = require('./Grid');
const { GridView, NodeColor } = require('./GridView');
const GridInputController = require('./GridInputController');
const { SettingsInputController, SelectionType } = require('./SettingsInputController');
const { NodeType } = require('./Node');
const AStar = require('./AStar');
const { manhattanDistance } = require('./heuristics');

class Pathfinding {

    constructor() {
        this.container = document.getElementById('canvas');
        this.grid = new Grid();
        this.gridView = new GridView(this.grid);
        this.gridInputController = new GridInputController(this.container);
        this.userInputController = new SettingsInputController();
        this.path = null;
    }

    loop() {
        this.update();
        this.draw();
    }

    update() {
        if (this.gridInputController.hoverPosition) {
            this.gridView.markForRedraw = true;
            const x = this.gridInputController.hoverPosition.x;
            const y = this.gridInputController.hoverPosition.y;
            const pos = this.gridView.coordsToGridPosition(x, y);
            this.grid.focusNode(pos.x, pos.y);
            if (this.gridInputController.mouseDown) {
                const selectionType = this.userInputController.currentSelectionMode.value;
                const nodeType = this.selectionTypeToNodeType(selectionType);
                this.grid.setNodeType(pos.x, pos.y, nodeType);
            }
        } else {
            this.gridView.markForRedraw = true;
            this.grid.unfocusNode();
        }
        if (this.userInputController.startPathfinding) {
            const astar = new AStar(this.grid, manhattanDistance);
            this.path = astar.astar();
            this.userInputController.startPathfinding = false;
        }

    }

    draw() {
        this.gridView.draw(this.selectionTypeToNodeColor(this.userInputController.currentSelectionMode.value));
        if (this.path) {
            this.gridView.highlightWalkingPath(this.path);
        }
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

module.exports = Pathfinding;