(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const NaivePrioritySet = require('./NaivePrioritySet');

function cmpByFValue(a, b) {
    return a.fScore > b.fScore ? 1: a.fScore === b.fScore ? 0: -1;
}

class AStar {

    constructor(grid, heuristic) {
        this.grid = grid;
        this.start = this.grid.startNode;
        this.target = this.grid.targetNode;
        this.openSet = new NaivePrioritySet(cmpByFValue);
        this.openSet.add(this.start);
        this.closedSet = [];
        this.heuristic = heuristic;
        this.path = new Map();
        this.extendNodes();
        this.start.gScore = 0;
        this.start.fScore = heuristic(this.target, this.start);
    }

    extendNodes() {
        this.grid.nodes.forEach(node => {
            node.gScore = Number.MAX_SAFE_INTEGER;
            node.fScore = Number.MAX_SAFE_INTEGER;
        });
    }

    generatePath(currentNode) {
        const completePath = [ currentNode ];
        let current = currentNode;
        while(this.path.has(current)) {
            current = this.path.get(current);
            completePath.unshift(current);
        }
        return completePath;
    }

    astar() {
        if (!this.start || !this.target) {
            throw new Error('Start or target is missing!');
        }
        const start = Date.now();
        while(this.openSet.length() > 0) {
            // get element with lowest fScore
            const currentNode = this.openSet.getFirst();
            if (currentNode === this.target) {
                // reconstruct path, we are finished
                return { solution: this.generatePath(currentNode), elapsedTime: Date.now() - start };
            }
            // transfer the currentNode from the open to the closed set
            this.openSet.remove(currentNode);
            this.closedSet.push(currentNode);
            // update all neighbours of current element
            for (let neighbour of this.grid.getNeighbours(currentNode)) {
                // this element was already visited, skip it
                if (this.closedSet.indexOf(el => el === neighbour) !== -1) {
                    continue;
                }
                // Since we are in a grid we have distance 1 between all nodes!
                // This is subject to change when employing an actual graph!
                const possibleNewGStore = currentNode.gScore + 1;
                // the path to the neighbour node from the current node is shorter
                // update path, gScore and fScore of neighbour element
                if (possibleNewGStore < neighbour.gScore) {
                    this.path.set(neighbour, currentNode);
                    neighbour.gScore = possibleNewGStore;
                    neighbour.fScore = neighbour.gScore + this.heuristic(this.target, neighbour);
                    // if neighbour is not in the open set add it
                    if (!this.openSet.has(neighbour)) {
                        this.openSet.add(neighbour);
                    }
                }
            }
        }
        return { solution: null, elapsedTime: Date.now() - start };
    }
}

module.exports = AStar;
},{"./NaivePrioritySet":5}],2:[function(require,module,exports){
const {Node, NodeType} = require('./Node');

class Grid {

    constructor() {
        this.startNode = null;
        this.targetNode = null;
        // in px
        this.nodeSize = 15;
        // count of elements
        this.obstacleSize = 3;
        // pro mille
        this.obstacleDensity = 40 / 1000;

        this.directions = {
            LEFT: {x: -1, y: 0},
            RIGHT: {x: 1, y: 0},
            UP: {x: 0, y: -1},
            DOWN: {x: 0, y: 1}
        }
    }

    setDimensions(rowSize, colSize) {
        this.rowSize = rowSize;
        this.colSize = colSize;
    }

    rebuildGrid() {
        this.nodes = [];
        for (let i = 0; i < this.colSize; i += 1) {
            for (let j = 0; j < this.rowSize; j += 1) {
                const n = new Node(j, i);
                this.nodes.push(n);
            }
        }
    }

    generateRandomWalls() {
        this.rebuildGrid();
        for (let node of this.nodes) {
            const random = Math.random();
            if (random < this.obstacleDensity) {
                const startX = node.posX;
                const startY = node.posY;
                for (let j = startY, cubeY = 0; cubeY < this.obstacleSize && j < this.colSize; j++, cubeY++) {
                    for (let i = startX, cubeX = 0; cubeX < this.obstacleSize && i < this.rowSize; i++, cubeX++) {
                        this.getNode(i, j).nodeType = NodeType.WALL;
                    }
                }
            }
        }
    }

    getNode(x, y) {
        return this.nodes[y * this.rowSize + x];
    }

    setNodeType(x, y, type) {
        const foundNode = this.getNode(x, y);
        foundNode.nodeType = type;

        // special cases start and target since we need to potentially remove other starts, subject to change
        if (type === NodeType.START) {
            if (this.startNode && this.startNode !== foundNode) {
                this.startNode.nodeType = NodeType.UNSELECTED;
            }
            this.startNode = foundNode;
        }

        if (type === NodeType.TARGET) {
            if (this.targetNode && this.targetNode !== foundNode) {
                this.targetNode.nodeType = NodeType.UNSELECTED;
            }
            this.targetNode = foundNode;
        }
    }

    getNeighbours(node, diagonalAllowed = false) {
        const neighbours = [];
        for (let direction of Object.keys(this.directions)) {
            const x = this.directions[direction].x;
            const y = this.directions[direction].y;
            const newX = node.posX + x;
            const newY = node.posY + y;
            if (newX > -1 && newX < this.rowSize && newY > -1 && newY < this.colSize) {
                const neighbour = this.getNode(newX, newY);
                if (neighbour.nodeType !== NodeType.WALL) {
                    neighbours.push(neighbour);
                }
            }
        }
        return neighbours;
    }

}

module.exports = Grid;
},{"./Node":6}],3:[function(require,module,exports){
class EventController {

    constructor(container) {
        this.container = container;
        this.setupHoverEvent();
        this.setupClickEvent();
        this.hoverPosition = null;
        this.mouseDown = false;
    }

    setupHoverEvent() {
        this.container.addEventListener('mousemove', (event) => {
            this.hoverPosition = this.getRelativeCoordinates(event);
        });
        this.container.addEventListener('mouseleave', () => {
            this.hoverPosition = null;
        });
    }

    setupClickEvent() {
        this.container.addEventListener('mousedown', () => {
            this.mouseDown = true;
        });
        this.container.addEventListener('mouseup', () => {
           this.mouseDown = false;
        });
    }

    getRelativeCoordinates(event) {
        const boundingRect = event.target.getBoundingClientRect();
        const x = event.clientX - boundingRect.left;
        const y = event.clientY - boundingRect.top;
        return { x, y };
    }
}

module.exports = EventController;
},{}],4:[function(require,module,exports){
const NodeColor = Object.freeze({
    UNSELECTED: 'white',
    START: 'yellow',
    TARGET: 'green',
    WALL: 'black',
    REMOVE: 'red',
    WALKED: 'orange'
});

class GridView {

    constructor(grid) {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementsByClassName('content')[0];
        this.grid = grid;
        this.markDirty = false;
        this.focusedNode = null;
        this.setupView();
        this.registerOnResize();

    }

    setupView() {
        this.adjustCanvasSize();
        const gridSize = this.determineGridSize();
        this.grid.setDimensions(gridSize.rowSize, gridSize.colSize);
        this.grid.rebuildGrid();
        this.grid.generateRandomWalls();
    }

    registerOnResize() {
        window.addEventListener('resize', () => {
            this.setupView();
        });
    }

    adjustCanvasSize() {
        this.canvas.width = this.containerWidth - this.containerWidth % this.grid.nodeSize;
        this.canvas.height = this.containerHeight - this.containerHeight % this.grid.nodeSize;
    }

    determineGridSize() {
        return {
            rowSize: Math.trunc(this.canvasWidth / this.grid.nodeSize),
            colSize: Math.trunc(this.canvasHeight / this.grid.nodeSize)
        }
    }

    get containerWidth() {
        return this.container.offsetWidth;
    }

    get containerHeight() {
        return this.container.offsetHeight;
    }

    get canvasWidth() {
        return this.canvas.width;
    }

    get canvasHeight() {
        return this.canvas.height;
    }

    coordsToGridPosition(x, y) {
        return { x: Math.trunc(x / this.grid.nodeSize), y: Math.trunc(y / this.grid.nodeSize) };
    }

    gridPositionToCoords(x, y) {
        return { x: x * this.grid.nodeSize, y: y * this.grid.nodeSize };
    }

    setFocusedNode(x, y) {
        const pos = this.coordsToGridPosition(x, y);
        const node = this.grid.getNode(pos.x, pos.y);
        this.focusedNode = node;
    }

    clearFocusedNode() {
        this.focusedNode = null;
    }

    clearCanvas(color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctx.restore();
    }

    drawNodes() {
        for (let node of this.grid.nodes) {
            const pos = this.gridPositionToCoords(node.posX, node.posY);
            this.drawFilledNode(pos, NodeColor[node.nodeType]);
        }
    }

    drawFocusedNode(focusColor) {
        if (this.focusedNode) {
            const pos = this.gridPositionToCoords(this.focusedNode.posX, this.focusedNode.posY);
            this.drawFilledNode(pos, focusColor);
        }
    }

    drawFilledNode(nodePos, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(nodePos.x, nodePos.y, this.grid.nodeSize, this.grid.nodeSize);
        this.ctx.restore();
    }

    drawStrokeNode(nodePos, color = 'black') {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeRect(nodePos.x, nodePos.y, this.grid.nodeSize, this.grid.nodeSize);
        this.ctx.restore();
    }

    drawWalkingPath(path) {
        for (let node of path.slice(1, path.length - 1)) {
            const pos = this.gridPositionToCoords(node.posX, node.posY);
            this.drawFilledNode(pos, NodeColor.WALKED);
        }
    }
}

module.exports = {GridView, NodeColor};
},{}],5:[function(require,module,exports){
class NaivePrioritySet {

    constructor(cmpFunction) {
        this.content = [];
        this.cmpFunction = cmpFunction;
    }

    add(element) {
        this.content.push(element);
        this.content.sort(this.cmpFunction);
    }

    remove(element) {
        const index = this.findIndex(element);
        this.content.splice(index, 1);
        this.content.sort(this.cmpFunction);
    }

    getFirst() {
        return this.content[0];
    }

    has(element) {
        return this.findIndex(element) !== -1;
    }

    findIndex(element) {
        return this.content.findIndex(el => el === element);
    }

    length() {
        return this.content.length;
    }

}

module.exports = NaivePrioritySet;
},{}],6:[function(require,module,exports){
class Node {
    
    constructor(posX, posY) {
        this.posX = posX;
        this.posY = posY;
        this.nodeType = NodeType.UNSELECTED;
    }

}

const NodeType = Object.freeze({
    UNSELECTED: 'UNSELECTED',
    START: 'START',
    TARGET: 'TARGET',
    WALL: 'WALL'
});

module.exports = {
    Node,
    NodeType
};
},{}],7:[function(require,module,exports){
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
},{"./AStar":1,"./Grid":2,"./GridInputController":3,"./GridView":4,"./Node":6,"./SettingsInputController":8,"./heuristics":9}],8:[function(require,module,exports){
const SelectionType = Object.freeze({
    START: 'START',
    TARGET: 'TARGET',
    WALL: 'WALL',
    REMOVE: 'REMOVE'
});

class SettingsInputController {

    constructor() {
        this.controlContainer = document.getElementsByClassName('header-left')[0];
        this.bindModeButtons();
        this.currentModeSelection = null;
        this.selectInputMode(SelectionType.START);
        this.setupKeybindings();
    }

    bindModeButtons() {
        this.modeKnobs = {};
        Array.from(this.controlContainer.children).forEach(child => {
            this.modeKnobs[child.getAttribute('type')] = child;
        });
    }

    setupKeybindings() {
        window.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW':
                    this.selectInputMode(SelectionType.WALL);
                    break;
                case 'KeyT':
                    this.selectInputMode(SelectionType.TARGET);
                    break;
                case 'KeyS':
                    this.selectInputMode(SelectionType.START);
                    break;
                case 'KeyR':
                    this.selectInputMode(SelectionType.REMOVE);
                    break;
                case 'KeyA':
                    this.startPathfinding = true;
                    break;
            }
        })
    }

    selectInputMode(selectionType) {
        if (this.currentModeSelection) {
            this.currentModeSelection.element.classList.remove('header__node-container_selected');
        }
        this.currentModeSelection = { value: SelectionType[selectionType], element: this.modeKnobs[selectionType] };
        this.currentModeSelection.element.classList.add('header__node-container_selected');
    }
}

module.exports = { SettingsInputController, SelectionType };
},{}],9:[function(require,module,exports){
function manhattanDistance(targetNode, currentNode) {
    return Math.abs(targetNode.posX - currentNode.posX) + Math.abs(targetNode.posY - currentNode.posY);
}

module.exports = {
    manhattanDistance
};
},{}],10:[function(require,module,exports){
const PathfindingManager = require('./PathfindingManager');
const pathfindingManager = new PathfindingManager();
requestAnimationFrame(loop);
function loop() {
    pathfindingManager.loop();
    requestAnimationFrame(loop);
}
},{"./PathfindingManager":7}]},{},[1,2,3,4,9,10,5,6,7,8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQVN0YXIuanMiLCJzcmMvR3JpZC5qcyIsInNyYy9HcmlkSW5wdXRDb250cm9sbGVyLmpzIiwic3JjL0dyaWRWaWV3LmpzIiwic3JjL05haXZlUHJpb3JpdHlTZXQuanMiLCJzcmMvTm9kZS5qcyIsInNyYy9QYXRoZmluZGluZ01hbmFnZXIuanMiLCJzcmMvU2V0dGluZ3NJbnB1dENvbnRyb2xsZXIuanMiLCJzcmMvaGV1cmlzdGljcy5qcyIsInNyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3QgTmFpdmVQcmlvcml0eVNldCA9IHJlcXVpcmUoJy4vTmFpdmVQcmlvcml0eVNldCcpO1xyXG5cclxuZnVuY3Rpb24gY21wQnlGVmFsdWUoYSwgYikge1xyXG4gICAgcmV0dXJuIGEuZlNjb3JlID4gYi5mU2NvcmUgPyAxOiBhLmZTY29yZSA9PT0gYi5mU2NvcmUgPyAwOiAtMTtcclxufVxyXG5cclxuY2xhc3MgQVN0YXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGdyaWQsIGhldXJpc3RpYykge1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5zdGFydCA9IHRoaXMuZ3JpZC5zdGFydE5vZGU7XHJcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0aGlzLmdyaWQudGFyZ2V0Tm9kZTtcclxuICAgICAgICB0aGlzLm9wZW5TZXQgPSBuZXcgTmFpdmVQcmlvcml0eVNldChjbXBCeUZWYWx1ZSk7XHJcbiAgICAgICAgdGhpcy5vcGVuU2V0LmFkZCh0aGlzLnN0YXJ0KTtcclxuICAgICAgICB0aGlzLmNsb3NlZFNldCA9IFtdO1xyXG4gICAgICAgIHRoaXMuaGV1cmlzdGljID0gaGV1cmlzdGljO1xyXG4gICAgICAgIHRoaXMucGF0aCA9IG5ldyBNYXAoKTtcclxuICAgICAgICB0aGlzLmV4dGVuZE5vZGVzKCk7XHJcbiAgICAgICAgdGhpcy5zdGFydC5nU2NvcmUgPSAwO1xyXG4gICAgICAgIHRoaXMuc3RhcnQuZlNjb3JlID0gaGV1cmlzdGljKHRoaXMudGFyZ2V0LCB0aGlzLnN0YXJ0KTtcclxuICAgIH1cclxuXHJcbiAgICBleHRlbmROb2RlcygpIHtcclxuICAgICAgICB0aGlzLmdyaWQubm9kZXMuZm9yRWFjaChub2RlID0+IHtcclxuICAgICAgICAgICAgbm9kZS5nU2NvcmUgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcclxuICAgICAgICAgICAgbm9kZS5mU2NvcmUgPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZVBhdGgoY3VycmVudE5vZGUpIHtcclxuICAgICAgICBjb25zdCBjb21wbGV0ZVBhdGggPSBbIGN1cnJlbnROb2RlIF07XHJcbiAgICAgICAgbGV0IGN1cnJlbnQgPSBjdXJyZW50Tm9kZTtcclxuICAgICAgICB3aGlsZSh0aGlzLnBhdGguaGFzKGN1cnJlbnQpKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnQgPSB0aGlzLnBhdGguZ2V0KGN1cnJlbnQpO1xyXG4gICAgICAgICAgICBjb21wbGV0ZVBhdGgudW5zaGlmdChjdXJyZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbXBsZXRlUGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBhc3RhcigpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3RhcnQgfHwgIXRoaXMudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3RhcnQgb3IgdGFyZ2V0IGlzIG1pc3NpbmchJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICB3aGlsZSh0aGlzLm9wZW5TZXQubGVuZ3RoKCkgPiAwKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCBlbGVtZW50IHdpdGggbG93ZXN0IGZTY29yZVxyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Tm9kZSA9IHRoaXMub3BlblNldC5nZXRGaXJzdCgpO1xyXG4gICAgICAgICAgICBpZiAoY3VycmVudE5vZGUgPT09IHRoaXMudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZWNvbnN0cnVjdCBwYXRoLCB3ZSBhcmUgZmluaXNoZWRcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IHNvbHV0aW9uOiB0aGlzLmdlbmVyYXRlUGF0aChjdXJyZW50Tm9kZSksIGVsYXBzZWRUaW1lOiBEYXRlLm5vdygpIC0gc3RhcnQgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyB0cmFuc2ZlciB0aGUgY3VycmVudE5vZGUgZnJvbSB0aGUgb3BlbiB0byB0aGUgY2xvc2VkIHNldFxyXG4gICAgICAgICAgICB0aGlzLm9wZW5TZXQucmVtb3ZlKGN1cnJlbnROb2RlKTtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZWRTZXQucHVzaChjdXJyZW50Tm9kZSk7XHJcbiAgICAgICAgICAgIC8vIHVwZGF0ZSBhbGwgbmVpZ2hib3VycyBvZiBjdXJyZW50IGVsZW1lbnRcclxuICAgICAgICAgICAgZm9yIChsZXQgbmVpZ2hib3VyIG9mIHRoaXMuZ3JpZC5nZXROZWlnaGJvdXJzKGN1cnJlbnROb2RlKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcyBlbGVtZW50IHdhcyBhbHJlYWR5IHZpc2l0ZWQsIHNraXAgaXRcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNsb3NlZFNldC5pbmRleE9mKGVsID0+IGVsID09PSBuZWlnaGJvdXIpICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gU2luY2Ugd2UgYXJlIGluIGEgZ3JpZCB3ZSBoYXZlIGRpc3RhbmNlIDEgYmV0d2VlbiBhbGwgbm9kZXMhXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHN1YmplY3QgdG8gY2hhbmdlIHdoZW4gZW1wbG95aW5nIGFuIGFjdHVhbCBncmFwaCFcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBvc3NpYmxlTmV3R1N0b3JlID0gY3VycmVudE5vZGUuZ1Njb3JlICsgMTtcclxuICAgICAgICAgICAgICAgIC8vIHRoZSBwYXRoIHRvIHRoZSBuZWlnaGJvdXIgbm9kZSBmcm9tIHRoZSBjdXJyZW50IG5vZGUgaXMgc2hvcnRlclxyXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlIHBhdGgsIGdTY29yZSBhbmQgZlNjb3JlIG9mIG5laWdoYm91ciBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAocG9zc2libGVOZXdHU3RvcmUgPCBuZWlnaGJvdXIuZ1Njb3JlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoLnNldChuZWlnaGJvdXIsIGN1cnJlbnROb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvdXIuZ1Njb3JlID0gcG9zc2libGVOZXdHU3RvcmU7XHJcbiAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3VyLmZTY29yZSA9IG5laWdoYm91ci5nU2NvcmUgKyB0aGlzLmhldXJpc3RpYyh0aGlzLnRhcmdldCwgbmVpZ2hib3VyKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBuZWlnaGJvdXIgaXMgbm90IGluIHRoZSBvcGVuIHNldCBhZGQgaXRcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3BlblNldC5oYXMobmVpZ2hib3VyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wZW5TZXQuYWRkKG5laWdoYm91cik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHNvbHV0aW9uOiBudWxsLCBlbGFwc2VkVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0IH07XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQVN0YXI7IiwiY29uc3Qge05vZGUsIE5vZGVUeXBlfSA9IHJlcXVpcmUoJy4vTm9kZScpO1xuXG5jbGFzcyBHcmlkIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnN0YXJ0Tm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IG51bGw7XG4gICAgICAgIC8vIGluIHB4XG4gICAgICAgIHRoaXMubm9kZVNpemUgPSAxNTtcbiAgICAgICAgLy8gY291bnQgb2YgZWxlbWVudHNcbiAgICAgICAgdGhpcy5vYnN0YWNsZVNpemUgPSAzO1xuICAgICAgICAvLyBwcm8gbWlsbGVcbiAgICAgICAgdGhpcy5vYnN0YWNsZURlbnNpdHkgPSA0MCAvIDEwMDA7XG5cbiAgICAgICAgdGhpcy5kaXJlY3Rpb25zID0ge1xuICAgICAgICAgICAgTEVGVDoge3g6IC0xLCB5OiAwfSxcbiAgICAgICAgICAgIFJJR0hUOiB7eDogMSwgeTogMH0sXG4gICAgICAgICAgICBVUDoge3g6IDAsIHk6IC0xfSxcbiAgICAgICAgICAgIERPV046IHt4OiAwLCB5OiAxfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0RGltZW5zaW9ucyhyb3dTaXplLCBjb2xTaXplKSB7XG4gICAgICAgIHRoaXMucm93U2l6ZSA9IHJvd1NpemU7XG4gICAgICAgIHRoaXMuY29sU2l6ZSA9IGNvbFNpemU7XG4gICAgfVxuXG4gICAgcmVidWlsZEdyaWQoKSB7XG4gICAgICAgIHRoaXMubm9kZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbFNpemU7IGkgKz0gMSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLnJvd1NpemU7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSBuZXcgTm9kZShqLCBpKTtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGVzLnB1c2gobik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZW5lcmF0ZVJhbmRvbVdhbGxzKCkge1xuICAgICAgICB0aGlzLnJlYnVpbGRHcmlkKCk7XG4gICAgICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ub2Rlcykge1xuICAgICAgICAgICAgY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgIGlmIChyYW5kb20gPCB0aGlzLm9ic3RhY2xlRGVuc2l0eSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IG5vZGUucG9zWDtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydFkgPSBub2RlLnBvc1k7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IHN0YXJ0WSwgY3ViZVkgPSAwOyBjdWJlWSA8IHRoaXMub2JzdGFjbGVTaXplICYmIGogPCB0aGlzLmNvbFNpemU7IGorKywgY3ViZVkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gc3RhcnRYLCBjdWJlWCA9IDA7IGN1YmVYIDwgdGhpcy5vYnN0YWNsZVNpemUgJiYgaSA8IHRoaXMucm93U2l6ZTsgaSsrLCBjdWJlWCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdldE5vZGUoaSwgaikubm9kZVR5cGUgPSBOb2RlVHlwZS5XQUxMO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Tm9kZSh4LCB5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzW3kgKiB0aGlzLnJvd1NpemUgKyB4XTtcbiAgICB9XG5cbiAgICBzZXROb2RlVHlwZSh4LCB5LCB0eXBlKSB7XG4gICAgICAgIGNvbnN0IGZvdW5kTm9kZSA9IHRoaXMuZ2V0Tm9kZSh4LCB5KTtcbiAgICAgICAgZm91bmROb2RlLm5vZGVUeXBlID0gdHlwZTtcblxuICAgICAgICAvLyBzcGVjaWFsIGNhc2VzIHN0YXJ0IGFuZCB0YXJnZXQgc2luY2Ugd2UgbmVlZCB0byBwb3RlbnRpYWxseSByZW1vdmUgb3RoZXIgc3RhcnRzLCBzdWJqZWN0IHRvIGNoYW5nZVxuICAgICAgICBpZiAodHlwZSA9PT0gTm9kZVR5cGUuU1RBUlQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0Tm9kZSAmJiB0aGlzLnN0YXJ0Tm9kZSAhPT0gZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydE5vZGUubm9kZVR5cGUgPSBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGFydE5vZGUgPSBmb3VuZE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gTm9kZVR5cGUuVEFSR0VUKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50YXJnZXROb2RlICYmIHRoaXMudGFyZ2V0Tm9kZSAhPT0gZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXROb2RlLm5vZGVUeXBlID0gTm9kZVR5cGUuVU5TRUxFQ1RFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IGZvdW5kTm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldE5laWdoYm91cnMobm9kZSwgZGlhZ29uYWxBbGxvd2VkID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgbmVpZ2hib3VycyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBkaXJlY3Rpb24gb2YgT2JqZWN0LmtleXModGhpcy5kaXJlY3Rpb25zKSkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZGlyZWN0aW9uc1tkaXJlY3Rpb25dLng7XG4gICAgICAgICAgICBjb25zdCB5ID0gdGhpcy5kaXJlY3Rpb25zW2RpcmVjdGlvbl0ueTtcbiAgICAgICAgICAgIGNvbnN0IG5ld1ggPSBub2RlLnBvc1ggKyB4O1xuICAgICAgICAgICAgY29uc3QgbmV3WSA9IG5vZGUucG9zWSArIHk7XG4gICAgICAgICAgICBpZiAobmV3WCA+IC0xICYmIG5ld1ggPCB0aGlzLnJvd1NpemUgJiYgbmV3WSA+IC0xICYmIG5ld1kgPCB0aGlzLmNvbFNpemUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZWlnaGJvdXIgPSB0aGlzLmdldE5vZGUobmV3WCwgbmV3WSk7XG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm91ci5ub2RlVHlwZSAhPT0gTm9kZVR5cGUuV0FMTCkge1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvdXJzLnB1c2gobmVpZ2hib3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5laWdoYm91cnM7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JpZDsiLCJjbGFzcyBFdmVudENvbnRyb2xsZXIge1xuXG4gICAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICB0aGlzLnNldHVwSG92ZXJFdmVudCgpO1xuICAgICAgICB0aGlzLnNldHVwQ2xpY2tFdmVudCgpO1xuICAgICAgICB0aGlzLmhvdmVyUG9zaXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIH1cblxuICAgIHNldHVwSG92ZXJFdmVudCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhvdmVyUG9zaXRpb24gPSB0aGlzLmdldFJlbGF0aXZlQ29vcmRpbmF0ZXMoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNldHVwQ2xpY2tFdmVudCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2V0UmVsYXRpdmVDb29yZGluYXRlcyhldmVudCkge1xuICAgICAgICBjb25zdCBib3VuZGluZ1JlY3QgPSBldmVudC50YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHggPSBldmVudC5jbGllbnRYIC0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgICAgIGNvbnN0IHkgPSBldmVudC5jbGllbnRZIC0gYm91bmRpbmdSZWN0LnRvcDtcbiAgICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudENvbnRyb2xsZXI7IiwiY29uc3QgTm9kZUNvbG9yID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgVU5TRUxFQ1RFRDogJ3doaXRlJyxcbiAgICBTVEFSVDogJ3llbGxvdycsXG4gICAgVEFSR0VUOiAnZ3JlZW4nLFxuICAgIFdBTEw6ICdibGFjaycsXG4gICAgUkVNT1ZFOiAncmVkJyxcbiAgICBXQUxLRUQ6ICdvcmFuZ2UnXG59KTtcblxuY2xhc3MgR3JpZFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IoZ3JpZCkge1xuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NvbnRlbnQnKVswXTtcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcbiAgICAgICAgdGhpcy5tYXJrRGlydHkgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5mb2N1c2VkTm9kZSA9IG51bGw7XG4gICAgICAgIHRoaXMuc2V0dXBWaWV3KCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJPblJlc2l6ZSgpO1xuXG4gICAgfVxuXG4gICAgc2V0dXBWaWV3KCkge1xuICAgICAgICB0aGlzLmFkanVzdENhbnZhc1NpemUoKTtcbiAgICAgICAgY29uc3QgZ3JpZFNpemUgPSB0aGlzLmRldGVybWluZUdyaWRTaXplKCk7XG4gICAgICAgIHRoaXMuZ3JpZC5zZXREaW1lbnNpb25zKGdyaWRTaXplLnJvd1NpemUsIGdyaWRTaXplLmNvbFNpemUpO1xuICAgICAgICB0aGlzLmdyaWQucmVidWlsZEdyaWQoKTtcbiAgICAgICAgdGhpcy5ncmlkLmdlbmVyYXRlUmFuZG9tV2FsbHMoKTtcbiAgICB9XG5cbiAgICByZWdpc3Rlck9uUmVzaXplKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR1cFZpZXcoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWRqdXN0Q2FudmFzU2l6ZSgpIHtcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmNvbnRhaW5lcldpZHRoIC0gdGhpcy5jb250YWluZXJXaWR0aCAlIHRoaXMuZ3JpZC5ub2RlU2l6ZTtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5jb250YWluZXJIZWlnaHQgLSB0aGlzLmNvbnRhaW5lckhlaWdodCAlIHRoaXMuZ3JpZC5ub2RlU2l6ZTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVHcmlkU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvd1NpemU6IE1hdGgudHJ1bmModGhpcy5jYW52YXNXaWR0aCAvIHRoaXMuZ3JpZC5ub2RlU2l6ZSksXG4gICAgICAgICAgICBjb2xTaXplOiBNYXRoLnRydW5jKHRoaXMuY2FudmFzSGVpZ2h0IC8gdGhpcy5ncmlkLm5vZGVTaXplKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRhaW5lcldpZHRoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGNvbnRhaW5lckhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLm9mZnNldEhlaWdodDtcbiAgICB9XG5cbiAgICBnZXQgY2FudmFzV2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICB9XG5cbiAgICBnZXQgY2FudmFzSGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW52YXMuaGVpZ2h0O1xuICAgIH1cblxuICAgIGNvb3Jkc1RvR3JpZFBvc2l0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHsgeDogTWF0aC50cnVuYyh4IC8gdGhpcy5ncmlkLm5vZGVTaXplKSwgeTogTWF0aC50cnVuYyh5IC8gdGhpcy5ncmlkLm5vZGVTaXplKSB9O1xuICAgIH1cblxuICAgIGdyaWRQb3NpdGlvblRvQ29vcmRzKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHsgeDogeCAqIHRoaXMuZ3JpZC5ub2RlU2l6ZSwgeTogeSAqIHRoaXMuZ3JpZC5ub2RlU2l6ZSB9O1xuICAgIH1cblxuICAgIHNldEZvY3VzZWROb2RlKHgsIHkpIHtcbiAgICAgICAgY29uc3QgcG9zID0gdGhpcy5jb29yZHNUb0dyaWRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMuZ3JpZC5nZXROb2RlKHBvcy54LCBwb3MueSk7XG4gICAgICAgIHRoaXMuZm9jdXNlZE5vZGUgPSBub2RlO1xuICAgIH1cblxuICAgIGNsZWFyRm9jdXNlZE5vZGUoKSB7XG4gICAgICAgIHRoaXMuZm9jdXNlZE5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIGNsZWFyQ2FudmFzKGNvbG9yKSB7XG4gICAgICAgIHRoaXMuY3R4LnNhdmUoKTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhc1dpZHRoLCB0aGlzLmNhbnZhc0hlaWdodCk7XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICBkcmF3Tm9kZXMoKSB7XG4gICAgICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ncmlkLm5vZGVzKSB7XG4gICAgICAgICAgICBjb25zdCBwb3MgPSB0aGlzLmdyaWRQb3NpdGlvblRvQ29vcmRzKG5vZGUucG9zWCwgbm9kZS5wb3NZKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZpbGxlZE5vZGUocG9zLCBOb2RlQ29sb3Jbbm9kZS5ub2RlVHlwZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0ZvY3VzZWROb2RlKGZvY3VzQ29sb3IpIHtcbiAgICAgICAgaWYgKHRoaXMuZm9jdXNlZE5vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHBvcyA9IHRoaXMuZ3JpZFBvc2l0aW9uVG9Db29yZHModGhpcy5mb2N1c2VkTm9kZS5wb3NYLCB0aGlzLmZvY3VzZWROb2RlLnBvc1kpO1xuICAgICAgICAgICAgdGhpcy5kcmF3RmlsbGVkTm9kZShwb3MsIGZvY3VzQ29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJhd0ZpbGxlZE5vZGUobm9kZVBvcywgY29sb3IpIHtcbiAgICAgICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3Qobm9kZVBvcy54LCBub2RlUG9zLnksIHRoaXMuZ3JpZC5ub2RlU2l6ZSwgdGhpcy5ncmlkLm5vZGVTaXplKTtcbiAgICAgICAgdGhpcy5jdHgucmVzdG9yZSgpO1xuICAgIH1cblxuICAgIGRyYXdTdHJva2VOb2RlKG5vZGVQb3MsIGNvbG9yID0gJ2JsYWNrJykge1xuICAgICAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VSZWN0KG5vZGVQb3MueCwgbm9kZVBvcy55LCB0aGlzLmdyaWQubm9kZVNpemUsIHRoaXMuZ3JpZC5ub2RlU2l6ZSk7XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICBkcmF3V2Fsa2luZ1BhdGgocGF0aCkge1xuICAgICAgICBmb3IgKGxldCBub2RlIG9mIHBhdGguc2xpY2UoMSwgcGF0aC5sZW5ndGggLSAxKSkge1xuICAgICAgICAgICAgY29uc3QgcG9zID0gdGhpcy5ncmlkUG9zaXRpb25Ub0Nvb3Jkcyhub2RlLnBvc1gsIG5vZGUucG9zWSk7XG4gICAgICAgICAgICB0aGlzLmRyYXdGaWxsZWROb2RlKHBvcywgTm9kZUNvbG9yLldBTEtFRCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge0dyaWRWaWV3LCBOb2RlQ29sb3J9OyIsImNsYXNzIE5haXZlUHJpb3JpdHlTZXQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNtcEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gW107XHJcbiAgICAgICAgdGhpcy5jbXBGdW5jdGlvbiA9IGNtcEZ1bmN0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZChlbGVtZW50KSB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50LnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50LnNvcnQodGhpcy5jbXBGdW5jdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKGVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZmluZEluZGV4KGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuY29udGVudC5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIHRoaXMuY29udGVudC5zb3J0KHRoaXMuY21wRnVuY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEZpcnN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnRbMF07XHJcbiAgICB9XHJcblxyXG4gICAgaGFzKGVsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5maW5kSW5kZXgoZWxlbWVudCkgIT09IC0xO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbmRJbmRleChlbGVtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudC5maW5kSW5kZXgoZWwgPT4gZWwgPT09IGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50Lmxlbmd0aDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTmFpdmVQcmlvcml0eVNldDsiLCJjbGFzcyBOb2RlIHtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihwb3NYLCBwb3NZKSB7XG4gICAgICAgIHRoaXMucG9zWCA9IHBvc1g7XG4gICAgICAgIHRoaXMucG9zWSA9IHBvc1k7XG4gICAgICAgIHRoaXMubm9kZVR5cGUgPSBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgIH1cblxufVxuXG5jb25zdCBOb2RlVHlwZSA9IE9iamVjdC5mcmVlemUoe1xuICAgIFVOU0VMRUNURUQ6ICdVTlNFTEVDVEVEJyxcbiAgICBTVEFSVDogJ1NUQVJUJyxcbiAgICBUQVJHRVQ6ICdUQVJHRVQnLFxuICAgIFdBTEw6ICdXQUxMJ1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIE5vZGUsXG4gICAgTm9kZVR5cGVcbn07IiwiY29uc3QgR3JpZCA9IHJlcXVpcmUoJy4vR3JpZCcpO1xuY29uc3QgeyBHcmlkVmlldywgTm9kZUNvbG9yIH0gPSByZXF1aXJlKCcuL0dyaWRWaWV3Jyk7XG5jb25zdCBHcmlkSW5wdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi9HcmlkSW5wdXRDb250cm9sbGVyJyk7XG5jb25zdCB7IFNldHRpbmdzSW5wdXRDb250cm9sbGVyLCBTZWxlY3Rpb25UeXBlIH0gPSByZXF1aXJlKCcuL1NldHRpbmdzSW5wdXRDb250cm9sbGVyJyk7XG5jb25zdCB7IE5vZGVUeXBlIH0gPSByZXF1aXJlKCcuL05vZGUnKTtcbmNvbnN0IEFTdGFyID0gcmVxdWlyZSgnLi9BU3RhcicpO1xuY29uc3QgeyBtYW5oYXR0YW5EaXN0YW5jZSB9ID0gcmVxdWlyZSgnLi9oZXVyaXN0aWNzJyk7XG5cbmNsYXNzIFBhdGhmaW5kaW5nTWFuYWdlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG4gICAgICAgIHRoaXMuZ3JpZCA9IG5ldyBHcmlkKCk7XG4gICAgICAgIHRoaXMuZ3JpZFZpZXcgPSBuZXcgR3JpZFZpZXcodGhpcy5ncmlkKTtcbiAgICAgICAgdGhpcy5ncmlkSW5wdXRDb250cm9sbGVyID0gbmV3IEdyaWRJbnB1dENvbnRyb2xsZXIodGhpcy5jb250YWluZXIpO1xuICAgICAgICB0aGlzLnNldHRpbmdzSW5wdXRDb250cm9sbGVyID0gbmV3IFNldHRpbmdzSW5wdXRDb250cm9sbGVyKCk7XG4gICAgICAgIHRoaXMucGF0aCA9IG51bGw7XG4gICAgfVxuXG4gICAgbG9vcCgpIHtcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgfVxuXG4gICAgdXBkYXRlKCkge1xuICAgICAgICBpZiAodGhpcy5ncmlkSW5wdXRDb250cm9sbGVyLmhvdmVyUG9zaXRpb24pIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLmdyaWRJbnB1dENvbnRyb2xsZXIuaG92ZXJQb3NpdGlvbi54O1xuICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMuZ3JpZElucHV0Q29udHJvbGxlci5ob3ZlclBvc2l0aW9uLnk7XG4gICAgICAgICAgICB0aGlzLmdyaWRWaWV3LnNldEZvY3VzZWROb2RlKHgsIHkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZElucHV0Q29udHJvbGxlci5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3Rpb25UeXBlID0gdGhpcy5zZXR0aW5nc0lucHV0Q29udHJvbGxlci5jdXJyZW50TW9kZVNlbGVjdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBub2RlVHlwZSA9IHRoaXMuc2VsZWN0aW9uVHlwZVRvTm9kZVR5cGUoc2VsZWN0aW9uVHlwZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zID0gdGhpcy5ncmlkVmlldy5jb29yZHNUb0dyaWRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWQuc2V0Tm9kZVR5cGUocG9zLngsIHBvcy55LCBub2RlVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRWaWV3LmNsZWFyRm9jdXNlZE5vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zZXR0aW5nc0lucHV0Q29udHJvbGxlci5zdGFydFBhdGhmaW5kaW5nKSB7XG4gICAgICAgICAgICBjb25zdCBhc3RhciA9IG5ldyBBU3Rhcih0aGlzLmdyaWQsIG1hbmhhdHRhbkRpc3RhbmNlKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGFzdGFyLmFzdGFyKCk7XG4gICAgICAgICAgICB0aGlzLnBhdGggPSByZXN1bHQuc29sdXRpb247XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzSW5wdXRDb250cm9sbGVyLnN0YXJ0UGF0aGZpbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyYXcoKSB7XG4gICAgICAgIHRoaXMuZ3JpZFZpZXcuY2xlYXJDYW52YXMoJ3doaXRlc21va2UnKTtcbiAgICAgICAgdGhpcy5ncmlkVmlldy5kcmF3Tm9kZXMoKTtcbiAgICAgICAgdGhpcy5ncmlkVmlldy5kcmF3Rm9jdXNlZE5vZGUoXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvblR5cGVUb05vZGVDb2xvcih0aGlzLnNldHRpbmdzSW5wdXRDb250cm9sbGVyLmN1cnJlbnRNb2RlU2VsZWN0aW9uLnZhbHVlKSk7XG4gICAgICAgIGlmICh0aGlzLnBhdGgpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZFZpZXcuZHJhd1dhbGtpbmdQYXRoKHRoaXMucGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncmlkVmlldy5tYXJrRGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpbnZhbGlkYXRlUGF0aCgpIHtcbiAgICAgICAgdGhpcy5wYXRoID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZWxlY3Rpb25UeXBlVG9Ob2RlVHlwZShzZWxlY3Rpb25UeXBlKSB7XG4gICAgICAgIHN3aXRjaCAoc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlNUQVJUOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlVHlwZS5TVEFSVDtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5SRU1PVkU6XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVUeXBlLlVOU0VMRUNURUQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuVEFSR0VUOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlVHlwZS5UQVJHRVQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuV0FMTDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZVR5cGUuV0FMTDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdGlvblR5cGVUb05vZGVDb2xvcihzZWxlY3Rpb25UeXBlKSB7XG4gICAgICAgIHN3aXRjaCAoc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlNUQVJUOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlQ29sb3IuU1RBUlQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuUkVNT1ZFOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlQ29sb3IuUkVNT1ZFO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlRBUkdFVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLlRBUkdFVDtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5XQUxMOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlQ29sb3IuV0FMTDtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGhmaW5kaW5nTWFuYWdlcjsiLCJjb25zdCBTZWxlY3Rpb25UeXBlID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgU1RBUlQ6ICdTVEFSVCcsXG4gICAgVEFSR0VUOiAnVEFSR0VUJyxcbiAgICBXQUxMOiAnV0FMTCcsXG4gICAgUkVNT1ZFOiAnUkVNT1ZFJ1xufSk7XG5cbmNsYXNzIFNldHRpbmdzSW5wdXRDb250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2xDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdoZWFkZXItbGVmdCcpWzBdO1xuICAgICAgICB0aGlzLmJpbmRNb2RlQnV0dG9ucygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRNb2RlU2VsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZWxlY3RJbnB1dE1vZGUoU2VsZWN0aW9uVHlwZS5TVEFSVCk7XG4gICAgICAgIHRoaXMuc2V0dXBLZXliaW5kaW5ncygpO1xuICAgIH1cblxuICAgIGJpbmRNb2RlQnV0dG9ucygpIHtcbiAgICAgICAgdGhpcy5tb2RlS25vYnMgPSB7fTtcbiAgICAgICAgQXJyYXkuZnJvbSh0aGlzLmNvbnRyb2xDb250YWluZXIuY2hpbGRyZW4pLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb2RlS25vYnNbY2hpbGQuZ2V0QXR0cmlidXRlKCd0eXBlJyldID0gY2hpbGQ7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNldHVwS2V5YmluZGluZ3MoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBzd2l0Y2goZXZlbnQuY29kZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ0tleVcnOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdElucHV0TW9kZShTZWxlY3Rpb25UeXBlLldBTEwpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdLZXlUJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJbnB1dE1vZGUoU2VsZWN0aW9uVHlwZS5UQVJHRVQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdLZXlTJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJbnB1dE1vZGUoU2VsZWN0aW9uVHlwZS5TVEFSVCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ0tleVInOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdElucHV0TW9kZShTZWxlY3Rpb25UeXBlLlJFTU9WRSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ0tleUEnOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0UGF0aGZpbmRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBzZWxlY3RJbnB1dE1vZGUoc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50TW9kZVNlbGVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50TW9kZVNlbGVjdGlvbi5lbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hlYWRlcl9fbm9kZS1jb250YWluZXJfc2VsZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRNb2RlU2VsZWN0aW9uID0geyB2YWx1ZTogU2VsZWN0aW9uVHlwZVtzZWxlY3Rpb25UeXBlXSwgZWxlbWVudDogdGhpcy5tb2RlS25vYnNbc2VsZWN0aW9uVHlwZV0gfTtcbiAgICAgICAgdGhpcy5jdXJyZW50TW9kZVNlbGVjdGlvbi5lbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2hlYWRlcl9fbm9kZS1jb250YWluZXJfc2VsZWN0ZWQnKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0geyBTZXR0aW5nc0lucHV0Q29udHJvbGxlciwgU2VsZWN0aW9uVHlwZSB9OyIsImZ1bmN0aW9uIG1hbmhhdHRhbkRpc3RhbmNlKHRhcmdldE5vZGUsIGN1cnJlbnROb2RlKSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnModGFyZ2V0Tm9kZS5wb3NYIC0gY3VycmVudE5vZGUucG9zWCkgKyBNYXRoLmFicyh0YXJnZXROb2RlLnBvc1kgLSBjdXJyZW50Tm9kZS5wb3NZKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBtYW5oYXR0YW5EaXN0YW5jZVxyXG59OyIsImNvbnN0IFBhdGhmaW5kaW5nTWFuYWdlciA9IHJlcXVpcmUoJy4vUGF0aGZpbmRpbmdNYW5hZ2VyJyk7XG5jb25zdCBwYXRoZmluZGluZ01hbmFnZXIgPSBuZXcgUGF0aGZpbmRpbmdNYW5hZ2VyKCk7XG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XG5mdW5jdGlvbiBsb29wKCkge1xuICAgIHBhdGhmaW5kaW5nTWFuYWdlci5sb29wKCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufSJdfQ==
