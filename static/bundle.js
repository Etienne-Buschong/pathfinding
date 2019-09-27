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
        while(this.openSet.length() > 0) {
            const currentNode = this.openSet.getFirst();
            if (currentNode === this.target) {
                // reconstruct path
                return this.generatePath(currentNode);
            }
            this.openSet.remove(currentNode);
            this.closedSet.push(currentNode);
            for (let neighbour of this.grid.getNeighbours(currentNode)) {
                if (this.closedSet.indexOf(el => el === neighbour) !== -1) {
                    continue;
                }
                // Since we are in a grid we have distance 1 between all nodes!
                // This is subject to change when employing an actual graph!
                const possibleNewGStore = currentNode.gScore + 1;
                if (possibleNewGStore < neighbour.gScore) {
                    this.path.set(neighbour, currentNode);
                    neighbour.gScore = possibleNewGStore;
                    neighbour.fScore = neighbour.gScore + this.heuristic(this.target, neighbour);
                    if (!this.openSet.has(neighbour)) {
                        this.openSet.add(neighbour);
                    }
                }
            }
        }
        return null;
    }
}

module.exports = AStar;
},{"./NaivePrioritySet":5}],2:[function(require,module,exports){
const { Node, NodeType } = require('./Node');

class Grid {

    constructor() {
        this.focusedNode = null;
        this.startNode = null;
        this.targetNode = null;
        this.directions = {
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 },
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 }
        }
    }

    rebuildGrid(rowSize, colSize) {
        this.rowSize = rowSize;
        this.colSize = colSize;
        this.nodes = [];
        for (let i = 0; i < this.colSize; i += 1) {
            for (let j = 0; j < this.rowSize; j += 1) {
                const n = new Node(j, i);
                this.nodes.push(n); 
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

    focusNode(x, y) {
        const foundNode = this.getNode(x, y);
        if (foundNode.focused) {
            return;
        }
        if (this.focusedNode) {
            this.focusedNode.focused = false;
        }
        foundNode.focused = true;
        this.focusedNode = foundNode;
    }

    unfocusNode() {
        if (this.focusedNode) {
            this.focusedNode.focused = false;
            this.focusedNode = null;
        }
    }

    getNeighbours(node) {
        const neighbours = [];
        for(let direction of Object.keys(this.directions)) {
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
        this.markForRedraw = false;
        // @todo use min padding for canvas => visually more appealing
        this.minPadding = this.nodeSize;
        this.setupView();
        this.registerOnResize();
    }

    setupView() {
        const rem =
            parseInt(window.getComputedStyle(document.body).getPropertyValue('font-size'));
        this.nodeSize = rem * 4;
        this.adjustCanvasSize();
        const gridSize = this.determineGridSize();
        this.grid.rebuildGrid(gridSize.rowSize, gridSize.colSize);
    }

    registerOnResize() {
        window.addEventListener('resize', () => {
            this.setupView();
        });
    }

    adjustCanvasSize() {
        this.canvas.width = this.containerWidth - this.containerWidth % this.nodeSize;
        this.canvas.height = this.containerHeight - this.containerHeight % this.nodeSize;
    }

    determineGridSize() {
        return {
            rowSize: Math.trunc(this.canvasWidth / this.nodeSize),
            colSize: Math.trunc(this.canvasHeight / this.nodeSize)
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
        return {x: Math.trunc(x / this.nodeSize), y: Math.trunc(y / this.nodeSize)};
    }

    gridPositionToCoords(x, y) {
        return {x: x * this.nodeSize, y: y * this.nodeSize};
    }

    draw(focusColor) {
        if (!this.markForRedraw) return;
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        for (let node of this.grid.nodes) {
            const pos = this.gridPositionToCoords(node.posX, node.posY);
            this.drawStrokeNode(pos);
            if (node.focused) {
                this.drawFilledNode(pos, focusColor);
            } else {
                this.drawFilledNode(pos, NodeColor[node.nodeType]);
            }
        }
        this.markForRedraw = false;
    }

    drawFilledNode(nodePos, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(nodePos.x + 1, nodePos.y + 1, this.nodeSize - 2, this.nodeSize - 2);
        this.ctx.restore();
    }

    drawStrokeNode(nodePos, color = 'black') {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeRect(nodePos.x, nodePos.y, this.nodeSize, this.nodeSize);
        this.ctx.restore();
    }

    highlightWalkingPath(path) {
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
        this.focused = false;
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
        this.bindKnobs();
        this.currentSelectionMode = null;
        this.selectInputMode(SelectionType.START);
        this.setupKeybindings();
        this.startPathfinding = false;
    }

    bindKnobs() {
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
        if (this.currentSelectionMode) {
            this.currentSelectionMode.element.classList.remove('header__node-container_selected');
        }
        this.currentSelectionMode = { value: SelectionType[selectionType], element: this.modeKnobs[selectionType] };
        this.currentSelectionMode.element.classList.add('header__node-container_selected');
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
const Pathfinding = require('./Pathfinding');
const pathfinding = new Pathfinding();
requestAnimationFrame(loop);
function loop() {
    pathfinding.loop();
    requestAnimationFrame(loop);
}
},{"./Pathfinding":7}]},{},[1,2,3,4,9,10,5,6,7,8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvQVN0YXIuanMiLCJzcmMvR3JpZC5qcyIsInNyYy9HcmlkSW5wdXRDb250cm9sbGVyLmpzIiwic3JjL0dyaWRWaWV3LmpzIiwic3JjL05haXZlUHJpb3JpdHlTZXQuanMiLCJzcmMvTm9kZS5qcyIsInNyYy9QYXRoZmluZGluZy5qcyIsInNyYy9TZXR0aW5nc0lucHV0Q29udHJvbGxlci5qcyIsInNyYy9oZXVyaXN0aWNzLmpzIiwic3JjL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IE5haXZlUHJpb3JpdHlTZXQgPSByZXF1aXJlKCcuL05haXZlUHJpb3JpdHlTZXQnKTtcclxuXHJcbmZ1bmN0aW9uIGNtcEJ5RlZhbHVlKGEsIGIpIHtcclxuICAgIHJldHVybiBhLmZTY29yZSA+IGIuZlNjb3JlID8gMTogYS5mU2NvcmUgPT09IGIuZlNjb3JlID8gMDogLTE7XHJcbn1cclxuXHJcbmNsYXNzIEFTdGFyIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihncmlkLCBoZXVyaXN0aWMpIHtcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuc3RhcnQgPSB0aGlzLmdyaWQuc3RhcnROb2RlO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGhpcy5ncmlkLnRhcmdldE5vZGU7XHJcbiAgICAgICAgdGhpcy5vcGVuU2V0ID0gbmV3IE5haXZlUHJpb3JpdHlTZXQoY21wQnlGVmFsdWUpO1xyXG4gICAgICAgIHRoaXMub3BlblNldC5hZGQodGhpcy5zdGFydCk7XHJcbiAgICAgICAgdGhpcy5jbG9zZWRTZXQgPSBbXTtcclxuICAgICAgICB0aGlzLmhldXJpc3RpYyA9IGhldXJpc3RpYztcclxuICAgICAgICB0aGlzLnBhdGggPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgdGhpcy5leHRlbmROb2RlcygpO1xyXG4gICAgICAgIHRoaXMuc3RhcnQuZ1Njb3JlID0gMDtcclxuICAgICAgICB0aGlzLnN0YXJ0LmZTY29yZSA9IGhldXJpc3RpYyh0aGlzLnRhcmdldCwgdGhpcy5zdGFydCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXh0ZW5kTm9kZXMoKSB7XHJcbiAgICAgICAgdGhpcy5ncmlkLm5vZGVzLmZvckVhY2gobm9kZSA9PiB7XHJcbiAgICAgICAgICAgIG5vZGUuZ1Njb3JlID0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XHJcbiAgICAgICAgICAgIG5vZGUuZlNjb3JlID0gTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVQYXRoKGN1cnJlbnROb2RlKSB7XHJcbiAgICAgICAgY29uc3QgY29tcGxldGVQYXRoID0gWyBjdXJyZW50Tm9kZSBdO1xyXG4gICAgICAgIGxldCBjdXJyZW50ID0gY3VycmVudE5vZGU7XHJcbiAgICAgICAgd2hpbGUodGhpcy5wYXRoLmhhcyhjdXJyZW50KSkge1xyXG4gICAgICAgICAgICBjdXJyZW50ID0gdGhpcy5wYXRoLmdldChjdXJyZW50KTtcclxuICAgICAgICAgICAgY29tcGxldGVQYXRoLnVuc2hpZnQoY3VycmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjb21wbGV0ZVBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgYXN0YXIoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0IHx8ICF0aGlzLnRhcmdldCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0YXJ0IG9yIHRhcmdldCBpcyBtaXNzaW5nIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aGlsZSh0aGlzLm9wZW5TZXQubGVuZ3RoKCkgPiAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdGhpcy5vcGVuU2V0LmdldEZpcnN0KCk7XHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZSA9PT0gdGhpcy50YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlY29uc3RydWN0IHBhdGhcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlUGF0aChjdXJyZW50Tm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vcGVuU2V0LnJlbW92ZShjdXJyZW50Tm9kZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VkU2V0LnB1c2goY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBuZWlnaGJvdXIgb2YgdGhpcy5ncmlkLmdldE5laWdoYm91cnMoY3VycmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jbG9zZWRTZXQuaW5kZXhPZihlbCA9PiBlbCA9PT0gbmVpZ2hib3VyKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIFNpbmNlIHdlIGFyZSBpbiBhIGdyaWQgd2UgaGF2ZSBkaXN0YW5jZSAxIGJldHdlZW4gYWxsIG5vZGVzIVxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBzdWJqZWN0IHRvIGNoYW5nZSB3aGVuIGVtcGxveWluZyBhbiBhY3R1YWwgZ3JhcGghXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NzaWJsZU5ld0dTdG9yZSA9IGN1cnJlbnROb2RlLmdTY29yZSArIDE7XHJcbiAgICAgICAgICAgICAgICBpZiAocG9zc2libGVOZXdHU3RvcmUgPCBuZWlnaGJvdXIuZ1Njb3JlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoLnNldChuZWlnaGJvdXIsIGN1cnJlbnROb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvdXIuZ1Njb3JlID0gcG9zc2libGVOZXdHU3RvcmU7XHJcbiAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3VyLmZTY29yZSA9IG5laWdoYm91ci5nU2NvcmUgKyB0aGlzLmhldXJpc3RpYyh0aGlzLnRhcmdldCwgbmVpZ2hib3VyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMub3BlblNldC5oYXMobmVpZ2hib3VyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9wZW5TZXQuYWRkKG5laWdoYm91cik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFTdGFyOyIsImNvbnN0IHsgTm9kZSwgTm9kZVR5cGUgfSA9IHJlcXVpcmUoJy4vTm9kZScpO1xuXG5jbGFzcyBHcmlkIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmZvY3VzZWROb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdGFydE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLmRpcmVjdGlvbnMgPSB7XG4gICAgICAgICAgICBMRUZUOiB7IHg6IC0xLCB5OiAwIH0sXG4gICAgICAgICAgICBSSUdIVDogeyB4OiAxLCB5OiAwIH0sXG4gICAgICAgICAgICBVUDogeyB4OiAwLCB5OiAtMSB9LFxuICAgICAgICAgICAgRE9XTjogeyB4OiAwLCB5OiAxIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlYnVpbGRHcmlkKHJvd1NpemUsIGNvbFNpemUpIHtcbiAgICAgICAgdGhpcy5yb3dTaXplID0gcm93U2l6ZTtcbiAgICAgICAgdGhpcy5jb2xTaXplID0gY29sU2l6ZTtcbiAgICAgICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29sU2l6ZTsgaSArPSAxKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucm93U2l6ZTsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IG5ldyBOb2RlKGosIGkpO1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZXMucHVzaChuKTsgXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXROb2RlKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXNbeSAqIHRoaXMucm93U2l6ZSArIHhdO1xuICAgIH1cblxuICAgIHNldE5vZGVUeXBlKHgsIHksIHR5cGUpIHtcbiAgICAgICAgY29uc3QgZm91bmROb2RlID0gdGhpcy5nZXROb2RlKHgsIHkpO1xuICAgICAgICBmb3VuZE5vZGUubm9kZVR5cGUgPSB0eXBlO1xuXG4gICAgICAgIC8vIHNwZWNpYWwgY2FzZXMgc3RhcnQgYW5kIHRhcmdldCBzaW5jZSB3ZSBuZWVkIHRvIHBvdGVudGlhbGx5IHJlbW92ZSBvdGhlciBzdGFydHMsIHN1YmplY3QgdG8gY2hhbmdlXG4gICAgICAgIGlmICh0eXBlID09PSBOb2RlVHlwZS5TVEFSVCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RhcnROb2RlICYmIHRoaXMuc3RhcnROb2RlICE9PSBmb3VuZE5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0Tm9kZS5ub2RlVHlwZSA9IE5vZGVUeXBlLlVOU0VMRUNURUQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnN0YXJ0Tm9kZSA9IGZvdW5kTm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSBOb2RlVHlwZS5UQVJHRVQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRhcmdldE5vZGUgJiYgdGhpcy50YXJnZXROb2RlICE9PSBmb3VuZE5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldE5vZGUubm9kZVR5cGUgPSBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy50YXJnZXROb2RlID0gZm91bmROb2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9jdXNOb2RlKHgsIHkpIHtcbiAgICAgICAgY29uc3QgZm91bmROb2RlID0gdGhpcy5nZXROb2RlKHgsIHkpO1xuICAgICAgICBpZiAoZm91bmROb2RlLmZvY3VzZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5mb2N1c2VkTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5mb2N1c2VkTm9kZS5mb2N1c2VkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZm91bmROb2RlLmZvY3VzZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmZvY3VzZWROb2RlID0gZm91bmROb2RlO1xuICAgIH1cblxuICAgIHVuZm9jdXNOb2RlKCkge1xuICAgICAgICBpZiAodGhpcy5mb2N1c2VkTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5mb2N1c2VkTm9kZS5mb2N1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmZvY3VzZWROb2RlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldE5laWdoYm91cnMobm9kZSkge1xuICAgICAgICBjb25zdCBuZWlnaGJvdXJzID0gW107XG4gICAgICAgIGZvcihsZXQgZGlyZWN0aW9uIG9mIE9iamVjdC5rZXlzKHRoaXMuZGlyZWN0aW9ucykpIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLmRpcmVjdGlvbnNbZGlyZWN0aW9uXS54O1xuICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMuZGlyZWN0aW9uc1tkaXJlY3Rpb25dLnk7XG4gICAgICAgICAgICBjb25zdCBuZXdYID0gbm9kZS5wb3NYICsgeDtcbiAgICAgICAgICAgIGNvbnN0IG5ld1kgPSBub2RlLnBvc1kgKyB5O1xuICAgICAgICAgICAgaWYgKG5ld1ggPiAtMSAmJiBuZXdYIDwgdGhpcy5yb3dTaXplICYmIG5ld1kgPiAtMSAmJiBuZXdZIDwgdGhpcy5jb2xTaXplKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmVpZ2hib3VyID0gdGhpcy5nZXROb2RlKG5ld1gsIG5ld1kpO1xuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvdXIubm9kZVR5cGUgIT09IE5vZGVUeXBlLldBTEwpIHtcbiAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3Vycy5wdXNoKG5laWdoYm91cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWlnaGJvdXJzO1xuICAgIH1cbiAgICBcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcmlkOyIsImNsYXNzIEV2ZW50Q29udHJvbGxlciB7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgIHRoaXMuc2V0dXBIb3ZlckV2ZW50KCk7XG4gICAgICAgIHRoaXMuc2V0dXBDbGlja0V2ZW50KCk7XG4gICAgICAgIHRoaXMuaG92ZXJQb3NpdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgfVxuXG4gICAgc2V0dXBIb3ZlckV2ZW50KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaG92ZXJQb3NpdGlvbiA9IHRoaXMuZ2V0UmVsYXRpdmVDb29yZGluYXRlcyhldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWxlYXZlJywgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5ob3ZlclBvc2l0aW9uID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0dXBDbGlja0V2ZW50KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBnZXRSZWxhdGl2ZUNvb3JkaW5hdGVzKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGJvdW5kaW5nUmVjdCA9IGV2ZW50LnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgeCA9IGV2ZW50LmNsaWVudFggLSBib3VuZGluZ1JlY3QubGVmdDtcbiAgICAgICAgY29uc3QgeSA9IGV2ZW50LmNsaWVudFkgLSBib3VuZGluZ1JlY3QudG9wO1xuICAgICAgICByZXR1cm4geyB4LCB5IH07XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50Q29udHJvbGxlcjsiLCJjb25zdCBOb2RlQ29sb3IgPSBPYmplY3QuZnJlZXplKHtcbiAgICBVTlNFTEVDVEVEOiAnd2hpdGUnLFxuICAgIFNUQVJUOiAneWVsbG93JyxcbiAgICBUQVJHRVQ6ICdncmVlbicsXG4gICAgV0FMTDogJ2JsYWNrJyxcbiAgICBSRU1PVkU6ICdyZWQnLFxuICAgIFdBTEtFRDogJ29yYW5nZSdcbn0pO1xuXG5jbGFzcyBHcmlkVmlldyB7XG5cbiAgICBjb25zdHJ1Y3RvcihncmlkKSB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY29udGVudCcpWzBdO1xuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xuICAgICAgICB0aGlzLm1hcmtGb3JSZWRyYXcgPSBmYWxzZTtcbiAgICAgICAgLy8gQHRvZG8gdXNlIG1pbiBwYWRkaW5nIGZvciBjYW52YXMgPT4gdmlzdWFsbHkgbW9yZSBhcHBlYWxpbmdcbiAgICAgICAgdGhpcy5taW5QYWRkaW5nID0gdGhpcy5ub2RlU2l6ZTtcbiAgICAgICAgdGhpcy5zZXR1cFZpZXcoKTtcbiAgICAgICAgdGhpcy5yZWdpc3Rlck9uUmVzaXplKCk7XG4gICAgfVxuXG4gICAgc2V0dXBWaWV3KCkge1xuICAgICAgICBjb25zdCByZW0gPVxuICAgICAgICAgICAgcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkuZ2V0UHJvcGVydHlWYWx1ZSgnZm9udC1zaXplJykpO1xuICAgICAgICB0aGlzLm5vZGVTaXplID0gcmVtICogNDtcbiAgICAgICAgdGhpcy5hZGp1c3RDYW52YXNTaXplKCk7XG4gICAgICAgIGNvbnN0IGdyaWRTaXplID0gdGhpcy5kZXRlcm1pbmVHcmlkU2l6ZSgpO1xuICAgICAgICB0aGlzLmdyaWQucmVidWlsZEdyaWQoZ3JpZFNpemUucm93U2l6ZSwgZ3JpZFNpemUuY29sU2l6ZSk7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJPblJlc2l6ZSgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBWaWV3KCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFkanVzdENhbnZhc1NpemUoKSB7XG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5jb250YWluZXJXaWR0aCAtIHRoaXMuY29udGFpbmVyV2lkdGggJSB0aGlzLm5vZGVTaXplO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmNvbnRhaW5lckhlaWdodCAtIHRoaXMuY29udGFpbmVySGVpZ2h0ICUgdGhpcy5ub2RlU2l6ZTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVHcmlkU2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJvd1NpemU6IE1hdGgudHJ1bmModGhpcy5jYW52YXNXaWR0aCAvIHRoaXMubm9kZVNpemUpLFxuICAgICAgICAgICAgY29sU2l6ZTogTWF0aC50cnVuYyh0aGlzLmNhbnZhc0hlaWdodCAvIHRoaXMubm9kZVNpemUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgY29udGFpbmVyV2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5vZmZzZXRXaWR0aDtcbiAgICB9XG5cbiAgICBnZXQgY29udGFpbmVySGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGdldCBjYW52YXNXaWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FudmFzLndpZHRoO1xuICAgIH1cblxuICAgIGdldCBjYW52YXNIZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbnZhcy5oZWlnaHQ7XG4gICAgfVxuXG4gICAgY29vcmRzVG9HcmlkUG9zaXRpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4ge3g6IE1hdGgudHJ1bmMoeCAvIHRoaXMubm9kZVNpemUpLCB5OiBNYXRoLnRydW5jKHkgLyB0aGlzLm5vZGVTaXplKX07XG4gICAgfVxuXG4gICAgZ3JpZFBvc2l0aW9uVG9Db29yZHMoeCwgeSkge1xuICAgICAgICByZXR1cm4ge3g6IHggKiB0aGlzLm5vZGVTaXplLCB5OiB5ICogdGhpcy5ub2RlU2l6ZX07XG4gICAgfVxuXG4gICAgZHJhdyhmb2N1c0NvbG9yKSB7XG4gICAgICAgIGlmICghdGhpcy5tYXJrRm9yUmVkcmF3KSByZXR1cm47XG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhc1dpZHRoLCB0aGlzLmNhbnZhc0hlaWdodCk7XG4gICAgICAgIGZvciAobGV0IG5vZGUgb2YgdGhpcy5ncmlkLm5vZGVzKSB7XG4gICAgICAgICAgICBjb25zdCBwb3MgPSB0aGlzLmdyaWRQb3NpdGlvblRvQ29vcmRzKG5vZGUucG9zWCwgbm9kZS5wb3NZKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0cm9rZU5vZGUocG9zKTtcbiAgICAgICAgICAgIGlmIChub2RlLmZvY3VzZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdGaWxsZWROb2RlKHBvcywgZm9jdXNDb2xvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0ZpbGxlZE5vZGUocG9zLCBOb2RlQ29sb3Jbbm9kZS5ub2RlVHlwZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFya0ZvclJlZHJhdyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGRyYXdGaWxsZWROb2RlKG5vZGVQb3MsIGNvbG9yKSB7XG4gICAgICAgIHRoaXMuY3R4LnNhdmUoKTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gY29sb3I7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxSZWN0KG5vZGVQb3MueCArIDEsIG5vZGVQb3MueSArIDEsIHRoaXMubm9kZVNpemUgLSAyLCB0aGlzLm5vZGVTaXplIC0gMik7XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICBkcmF3U3Ryb2tlTm9kZShub2RlUG9zLCBjb2xvciA9ICdibGFjaycpIHtcbiAgICAgICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlUmVjdChub2RlUG9zLngsIG5vZGVQb3MueSwgdGhpcy5ub2RlU2l6ZSwgdGhpcy5ub2RlU2l6ZSk7XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICBoaWdobGlnaHRXYWxraW5nUGF0aChwYXRoKSB7XG4gICAgICAgIGZvciAobGV0IG5vZGUgb2YgcGF0aC5zbGljZSgxLCBwYXRoLmxlbmd0aCAtIDEpKSB7XG4gICAgICAgICAgICBjb25zdCBwb3MgPSB0aGlzLmdyaWRQb3NpdGlvblRvQ29vcmRzKG5vZGUucG9zWCwgbm9kZS5wb3NZKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd0ZpbGxlZE5vZGUocG9zLCBOb2RlQ29sb3IuV0FMS0VEKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7R3JpZFZpZXcsIE5vZGVDb2xvcn07IiwiY2xhc3MgTmFpdmVQcmlvcml0eVNldCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY21wRnVuY3Rpb24pIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBbXTtcclxuICAgICAgICB0aGlzLmNtcEZ1bmN0aW9uID0gY21wRnVuY3Rpb247XHJcbiAgICB9XHJcblxyXG4gICAgYWRkKGVsZW1lbnQpIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnQucHVzaChlbGVtZW50KTtcclxuICAgICAgICB0aGlzLmNvbnRlbnQuc29ydCh0aGlzLmNtcEZ1bmN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUoZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5maW5kSW5kZXgoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50LnNvcnQodGhpcy5jbXBGdW5jdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Rmlyc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudFswXTtcclxuICAgIH1cclxuXHJcbiAgICBoYXMoZWxlbWVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRJbmRleChlbGVtZW50KSAhPT0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgZmluZEluZGV4KGVsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50LmZpbmRJbmRleChlbCA9PiBlbCA9PT0gZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYWl2ZVByaW9yaXR5U2V0OyIsImNsYXNzIE5vZGUge1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKHBvc1gsIHBvc1kpIHtcbiAgICAgICAgdGhpcy5wb3NYID0gcG9zWDtcbiAgICAgICAgdGhpcy5wb3NZID0gcG9zWTtcbiAgICAgICAgdGhpcy5mb2N1c2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMubm9kZVR5cGUgPSBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgIH1cblxufVxuXG5jb25zdCBOb2RlVHlwZSA9IE9iamVjdC5mcmVlemUoe1xuICAgIFVOU0VMRUNURUQ6ICdVTlNFTEVDVEVEJyxcbiAgICBTVEFSVDogJ1NUQVJUJyxcbiAgICBUQVJHRVQ6ICdUQVJHRVQnLFxuICAgIFdBTEw6ICdXQUxMJ1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIE5vZGUsXG4gICAgTm9kZVR5cGVcbn07IiwiY29uc3QgR3JpZCA9IHJlcXVpcmUoJy4vR3JpZCcpO1xuY29uc3QgeyBHcmlkVmlldywgTm9kZUNvbG9yIH0gPSByZXF1aXJlKCcuL0dyaWRWaWV3Jyk7XG5jb25zdCBHcmlkSW5wdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi9HcmlkSW5wdXRDb250cm9sbGVyJyk7XG5jb25zdCB7IFNldHRpbmdzSW5wdXRDb250cm9sbGVyLCBTZWxlY3Rpb25UeXBlIH0gPSByZXF1aXJlKCcuL1NldHRpbmdzSW5wdXRDb250cm9sbGVyJyk7XG5jb25zdCB7IE5vZGVUeXBlIH0gPSByZXF1aXJlKCcuL05vZGUnKTtcbmNvbnN0IEFTdGFyID0gcmVxdWlyZSgnLi9BU3RhcicpO1xuY29uc3QgeyBtYW5oYXR0YW5EaXN0YW5jZSB9ID0gcmVxdWlyZSgnLi9oZXVyaXN0aWNzJyk7XG5cbmNsYXNzIFBhdGhmaW5kaW5nIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5ncmlkID0gbmV3IEdyaWQoKTtcbiAgICAgICAgdGhpcy5ncmlkVmlldyA9IG5ldyBHcmlkVmlldyh0aGlzLmdyaWQpO1xuICAgICAgICB0aGlzLmdyaWRJbnB1dENvbnRyb2xsZXIgPSBuZXcgR3JpZElucHV0Q29udHJvbGxlcih0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgIHRoaXMudXNlcklucHV0Q29udHJvbGxlciA9IG5ldyBTZXR0aW5nc0lucHV0Q29udHJvbGxlcigpO1xuICAgICAgICB0aGlzLnBhdGggPSBudWxsO1xuICAgIH1cblxuICAgIGxvb3AoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZ3JpZElucHV0Q29udHJvbGxlci5ob3ZlclBvc2l0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRWaWV3Lm1hcmtGb3JSZWRyYXcgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZ3JpZElucHV0Q29udHJvbGxlci5ob3ZlclBvc2l0aW9uLng7XG4gICAgICAgICAgICBjb25zdCB5ID0gdGhpcy5ncmlkSW5wdXRDb250cm9sbGVyLmhvdmVyUG9zaXRpb24ueTtcbiAgICAgICAgICAgIGNvbnN0IHBvcyA9IHRoaXMuZ3JpZFZpZXcuY29vcmRzVG9HcmlkUG9zaXRpb24oeCwgeSk7XG4gICAgICAgICAgICB0aGlzLmdyaWQuZm9jdXNOb2RlKHBvcy54LCBwb3MueSk7XG4gICAgICAgICAgICBpZiAodGhpcy5ncmlkSW5wdXRDb250cm9sbGVyLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvblR5cGUgPSB0aGlzLnVzZXJJbnB1dENvbnRyb2xsZXIuY3VycmVudFNlbGVjdGlvbk1vZGUudmFsdWU7XG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZVR5cGUgPSB0aGlzLnNlbGVjdGlvblR5cGVUb05vZGVUeXBlKHNlbGVjdGlvblR5cGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZC5zZXROb2RlVHlwZShwb3MueCwgcG9zLnksIG5vZGVUeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZFZpZXcubWFya0ZvclJlZHJhdyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmdyaWQudW5mb2N1c05vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy51c2VySW5wdXRDb250cm9sbGVyLnN0YXJ0UGF0aGZpbmRpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzdGFyID0gbmV3IEFTdGFyKHRoaXMuZ3JpZCwgbWFuaGF0dGFuRGlzdGFuY2UpO1xuICAgICAgICAgICAgdGhpcy5wYXRoID0gYXN0YXIuYXN0YXIoKTtcbiAgICAgICAgICAgIHRoaXMudXNlcklucHV0Q29udHJvbGxlci5zdGFydFBhdGhmaW5kaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGRyYXcoKSB7XG4gICAgICAgIHRoaXMuZ3JpZFZpZXcuZHJhdyh0aGlzLnNlbGVjdGlvblR5cGVUb05vZGVDb2xvcih0aGlzLnVzZXJJbnB1dENvbnRyb2xsZXIuY3VycmVudFNlbGVjdGlvbk1vZGUudmFsdWUpKTtcbiAgICAgICAgaWYgKHRoaXMucGF0aCkge1xuICAgICAgICAgICAgdGhpcy5ncmlkVmlldy5oaWdobGlnaHRXYWxraW5nUGF0aCh0aGlzLnBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaW52YWxpZGF0ZVBhdGgoKSB7XG4gICAgICAgIHRoaXMucGF0aCA9IG51bGw7XG4gICAgfVxuXG4gICAgc2VsZWN0aW9uVHlwZVRvTm9kZVR5cGUoc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHNlbGVjdGlvblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5TVEFSVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZVR5cGUuU1RBUlQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuUkVNT1ZFOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlRBUkdFVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZVR5cGUuVEFSR0VUO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLldBTEw6XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVUeXBlLldBTEw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3Rpb25UeXBlVG9Ob2RlQ29sb3Ioc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHNlbGVjdGlvblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5TVEFSVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLlNUQVJUO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlJFTU9WRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLlJFTU9WRTtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5UQVJHRVQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVDb2xvci5UQVJHRVQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuV0FMTDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLldBTEw7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYXRoZmluZGluZzsiLCJjb25zdCBTZWxlY3Rpb25UeXBlID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgU1RBUlQ6ICdTVEFSVCcsXG4gICAgVEFSR0VUOiAnVEFSR0VUJyxcbiAgICBXQUxMOiAnV0FMTCcsXG4gICAgUkVNT1ZFOiAnUkVNT1ZFJ1xufSk7XG5cbmNsYXNzIFNldHRpbmdzSW5wdXRDb250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnRyb2xDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdoZWFkZXItbGVmdCcpWzBdO1xuICAgICAgICB0aGlzLmJpbmRLbm9icygpO1xuICAgICAgICB0aGlzLmN1cnJlbnRTZWxlY3Rpb25Nb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZWxlY3RJbnB1dE1vZGUoU2VsZWN0aW9uVHlwZS5TVEFSVCk7XG4gICAgICAgIHRoaXMuc2V0dXBLZXliaW5kaW5ncygpO1xuICAgICAgICB0aGlzLnN0YXJ0UGF0aGZpbmRpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBiaW5kS25vYnMoKSB7XG4gICAgICAgIHRoaXMubW9kZUtub2JzID0ge307XG4gICAgICAgIEFycmF5LmZyb20odGhpcy5jb250cm9sQ29udGFpbmVyLmNoaWxkcmVuKS5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgICAgICAgIHRoaXMubW9kZUtub2JzW2NoaWxkLmdldEF0dHJpYnV0ZSgndHlwZScpXSA9IGNoaWxkO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXR1cEtleWJpbmRpbmdzKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgc3dpdGNoKGV2ZW50LmNvZGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdLZXlXJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJbnB1dE1vZGUoU2VsZWN0aW9uVHlwZS5XQUxMKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnS2V5VCc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0SW5wdXRNb2RlKFNlbGVjdGlvblR5cGUuVEFSR0VUKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnS2V5Uyc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0SW5wdXRNb2RlKFNlbGVjdGlvblR5cGUuU1RBUlQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdLZXlSJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RJbnB1dE1vZGUoU2VsZWN0aW9uVHlwZS5SRU1PVkUpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdLZXlBJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydFBhdGhmaW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgc2VsZWN0SW5wdXRNb2RlKHNlbGVjdGlvblR5cGUpIHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFNlbGVjdGlvbk1vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNlbGVjdGlvbk1vZGUuZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdoZWFkZXJfX25vZGUtY29udGFpbmVyX3NlbGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50U2VsZWN0aW9uTW9kZSA9IHsgdmFsdWU6IFNlbGVjdGlvblR5cGVbc2VsZWN0aW9uVHlwZV0sIGVsZW1lbnQ6IHRoaXMubW9kZUtub2JzW3NlbGVjdGlvblR5cGVdIH07XG4gICAgICAgIHRoaXMuY3VycmVudFNlbGVjdGlvbk1vZGUuZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoZWFkZXJfX25vZGUtY29udGFpbmVyX3NlbGVjdGVkJyk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgU2V0dGluZ3NJbnB1dENvbnRyb2xsZXIsIFNlbGVjdGlvblR5cGUgfTsiLCJmdW5jdGlvbiBtYW5oYXR0YW5EaXN0YW5jZSh0YXJnZXROb2RlLCBjdXJyZW50Tm9kZSkge1xyXG4gICAgcmV0dXJuIE1hdGguYWJzKHRhcmdldE5vZGUucG9zWCAtIGN1cnJlbnROb2RlLnBvc1gpICsgTWF0aC5hYnModGFyZ2V0Tm9kZS5wb3NZIC0gY3VycmVudE5vZGUucG9zWSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbWFuaGF0dGFuRGlzdGFuY2VcclxufTsiLCJjb25zdCBQYXRoZmluZGluZyA9IHJlcXVpcmUoJy4vUGF0aGZpbmRpbmcnKTtcbmNvbnN0IHBhdGhmaW5kaW5nID0gbmV3IFBhdGhmaW5kaW5nKCk7XG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XG5mdW5jdGlvbiBsb29wKCkge1xuICAgIHBhdGhmaW5kaW5nLmxvb3AoKTtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XG59Il19
