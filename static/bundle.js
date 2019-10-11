(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const Grid = require('./models/Grid');
const { GridView, NodeColor } = require('./views/GridView');
const GridController = require('./controllers/GridController');
const EditorController = require('./controllers/EditorController');
const { Editor } = require('./models/Editor');

class PathfindingManager {

    constructor() {
        this.container = document.getElementById('canvas');
        this.lastUpdate = null;
        this.grid = new Grid();
        this.editor = new Editor();
        this.gridView = new GridView();
        this.editorController = new EditorController(this.editor);
        this.gridController = new GridController(this.container, this.grid, this.gridView, this.editor);
    }

    loop(timestamp) {
        if (!this.lastUpdate) {
            this.lastUpdate = timestamp;
        }
        const delta = timestamp - this.lastUpdate;
        this.lastUpdate = timestamp;
        this.update();
        this.draw();
    }

    update() {
        this.gridController.update();
        this.editorController.update();
    }

    draw() {
        this.gridController.render();
        this.editorController.render();
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
},{"./controllers/EditorController":3,"./controllers/GridController":4,"./models/Editor":9,"./models/Grid":10,"./views/GridView":12}],2:[function(require,module,exports){
const NaivePrioritySet = require('../ds/NaivePrioritySet');

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

    async astar() {
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
},{"../ds/NaivePrioritySet":5}],3:[function(require,module,exports){
const { SelectionType } = require('../models/Editor');
const PubSub = require('../misc/pubsub');

class EditorController {

    constructor(editor) {
        this.inputSelectBox = document.querySelector('.editor-input #input-type-selection');
        this.algorithmSelectBox = document.querySelector('.algorithm-selection #algorithm-selection');
        this.editorButtonContainer = document.querySelector('.algorithm-execution');
        this.editor = editor;
        this.selectedInputIndex = 0;
        this.selectedAlgorithmIndex = 0;
        this.inputSelectionChanged();
        this.algorithmSelectionChanged();
        this.inputSelectBox.addEventListener('change', this.inputSelectionChanged.bind(this));
        this.algorithmSelectBox.addEventListener('change', this.algorithmSelectionChanged.bind(this));
        this.bindButtonEvents();
    }

    bindButtonEvents() {
        const buttons = this.editorButtonContainer.querySelectorAll('button');
        for (const button of buttons) {
            switch (button.id) {
                case 'clear-input-button':
                    button.addEventListener('click', this.clearInput.bind(this));
                    break;
                case 'generate-map-button':
                    button.addEventListener('click', this.generateMap.bind(this));
                    break;
                case 'run-algorithm-button':
                    button.addEventListener('click', this.runAlgorithm.bind(this));
            }
        }
    }

    clearInput() {
        // @todo implement
    }

    generateMap() {
        // @todo implement
    }

    runAlgorithm() {
        /*
        @todo implement as next task. The correct algorithm needs to be selected from the editor model,
              which needs to hold a mapping from the algorithm name to the correct algorithm 'newable'.
              I also need to integrate the algorithm options into this (they can different for each algorithm)
         */
    }

    inputSelectionChanged(change) {
        if (change) {
            this.selectedInputIndex = change.target.selectedIndex;
        }
        const value = this.inputSelectBox[this.selectedInputIndex].value;
        this.editor.setSelectionType(SelectionType[value]);
        PubSub.publish('markViewDirty');
    }

    algorithmSelectionChanged(change) {
        if (change) {
            this.selectedAlgorithmIndex = change.target.selectedIndex;
        }
    }

    update() {

    }

    render() {

    }
}

module.exports = EditorController;
},{"../misc/pubsub":8,"../models/Editor":9}],4:[function(require,module,exports){
const { SelectionType } = require('../models/Editor');
const { NodeType } = require('../models/Node');
const PubSub = require('../misc/pubsub');
const { NodeColor } = require('../views/GridView');

class GridController {

    constructor(container, grid, gridView, editor) {
        this.container = container;
        this.gridView = gridView;
        this.grid = grid;
        this.editor = editor;
        this.setupHoverEvent();
        this.setupClickEvent();
        this.adjustGridSize();
        PubSub.subscribe('canvasResize', this.adjustGridSize.bind(this));
        this.mouseDown = false;
    }

    setupHoverEvent() {
        this.container.addEventListener('mousemove', (event) => {
            const relativePosition = this.getRelativeCoordinates(event);
            const newNodePos = this.gridView.coordsToGridPosition(relativePosition.x, relativePosition.y, this.grid.nodeSize);
            const hoveredNode = this.grid.hoveredNode;
            if (!hoveredNode || newNodePos.x !== hoveredNode.x || newNodePos.y !== hoveredNode.y) {
                this.grid.hoveredNode = this.grid.getNode(newNodePos.x, newNodePos.y);
                this.gridView.markDirty();
            }
        });
        this.container.addEventListener('mouseleave', () => {
            if (this.grid.hoveredNode) {
                this.grid.hoveredNode = null;
                this.gridView.markDirty();
            }
            if (this.mouseDown) {
                this.mouseDown = false;
            }
        });
    }

    setupClickEvent() {
        this.container.addEventListener('mousedown', () => {
            this.gridView.markDirty();
            this.grid.path = null;
            this.mouseDown = true;
        });
        this.container.addEventListener('mouseup', () => {
           this.mouseDown = false;
        });
    }

    adjustGridSize() {
        this.gridView.adjustCanvasSize(this.grid.nodeSize);
        const gridSize = this.gridView.determineGridSize(this.grid.nodeSize);
        this.grid.setDimensions(gridSize.rowSize, gridSize.colSize);
        this.grid.rebuildGrid();
        this.grid.generateRandomWalls();
        this.grid.path = null;
    }

    getRelativeCoordinates(event) {
        const boundingRect = event.target.getBoundingClientRect();
        const x = event.clientX - boundingRect.left;
        const y = event.clientY - boundingRect.top;
        return { x, y };
    }

    update() {
        this.processInput();
    }

    render() {
        if (this.gridView.markedDirty) {
            this.gridView.clearCanvas('whitesmoke');
            this.gridView.drawNodes(this.grid.nodes, this.grid.nodeSize);
            if (this.grid.hoveredNode) {
                const hNode = this.grid.hoveredNode;
                const pos = this.gridView.gridPositionToCoords(hNode.posX, hNode.posY, this.grid.nodeSize);
                this.gridView.drawFilledNode(pos, NodeColor[this.editor.selectionType], this.grid.nodeSize);
            }
            if (this.grid.path) {
                this.gridView.drawWalkingPath(this.grid.path, this.grid.nodeSize);
            }
            this.gridView.markedDirty = false;
        }

    }

    processInput() {
        if (this.grid.hoveredNode) {
            if (this.mouseDown) {
                this.processClick();
            }
        } else {
            this.grid.focusedNode = null;
        }
    }

    processClick() {
        const nodeType = this.selectionTypeToNodeType(this.editor.selectionType);
        this.grid.setNodeType(this.grid.hoveredNode.posX, this.grid.hoveredNode.posY, nodeType);
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
}

module.exports = GridController;
},{"../misc/pubsub":8,"../models/Editor":9,"../models/Node":11,"../views/GridView":12}],5:[function(require,module,exports){
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
const PathfindingManager = require('./PathfindingManager');
const pathfindingManager = new PathfindingManager();
requestAnimationFrame(loop);
function loop(timestamp) {
    pathfindingManager.loop(timestamp);
    requestAnimationFrame(loop);
}
},{"./PathfindingManager":1}],7:[function(require,module,exports){
function manhattanDistance(targetNode, currentNode) {
    return Math.abs(targetNode.posX - currentNode.posX) + Math.abs(targetNode.posY - currentNode.posY);
}

module.exports = {
    manhattanDistance
};
},{}],8:[function(require,module,exports){
const subscribers = {};
module.exports = {
    publish(eventName, data) {
        if (!subscribers[eventName]) {
            console.error(`No event with name ${eventName} available!`);
            return;
        }
        subscribers[eventName].forEach(callbackFn => callbackFn(data));
    },
    subscribe(eventName, callbackFn) {
        if (!subscribers[eventName]) {
            subscribers[eventName] = [];
        }
        let index = subscribers[eventName].push(callbackFn);
        return () => subscribers[eventName].splice(index, 1);
    }
};
},{}],9:[function(require,module,exports){
const SelectionType = Object.freeze({
    START: 'START',
    TARGET: 'TARGET',
    WALL: 'WALL',
    REMOVE: 'REMOVE'
});



class Editor {
    constructor() {
        this.selectionType = null;
        this.algorithm = null;
    };

    setSelectionType(type) {
        this.selectionType = type;
    }
}

module.exports = { Editor, SelectionType };
},{}],10:[function(require,module,exports){
const {Node, NodeType} = require('./Node');

class Grid {

    constructor() {
        this.startNode = null;
        this.targetNode = null;
        this.path = null;
        this.hoveredNode = null;
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

    setNodeType(gridX, gridY, type) {
        const foundNode = this.getNode(gridX, gridY);
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
},{"./Node":11}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
const PubSub = require('../misc/pubsub');

const NodeColor = Object.freeze({
    UNSELECTED: 'white',
    START: 'yellow',
    TARGET: 'green',
    WALL: 'black',
    REMOVE: 'red',
    WALKED: 'orange'
});

class GridView {

    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementsByClassName('content')[0];
        this.markedDirty = true;
        this.registerOnResize();
        PubSub.subscribe('markViewDirty', this.markDirty.bind(this));
    }

    registerOnResize() {
        window.addEventListener('resize', () => {
            PubSub.publish('canvasResize');
        });
    }

    adjustCanvasSize(nodeSize) {
        this.canvas.width = this.containerWidth - this.containerWidth % nodeSize;
        this.canvas.height = this.containerHeight - this.containerHeight % nodeSize;
    }

    determineGridSize(nodeSize) {
        return {
            rowSize: Math.trunc(this.canvasWidth / nodeSize),
            colSize: Math.trunc(this.canvasHeight / nodeSize)
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

    coordsToGridPosition(cordX, cordY, nodeSize) {
        return { x: Math.trunc(cordX / nodeSize), y: Math.trunc(cordY / nodeSize) };
    }

    gridPositionToCoords(gridX, gridY, nodeSize) {
        return { x: gridX * nodeSize, y: gridY * nodeSize };
    }

    markDirty() {
        this.markedDirty = true;
    }

    clearCanvas(color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.ctx.restore();
    }

    drawNodes(nodes, nodeSize) {
        for (let node of nodes) {
            const pos = this.gridPositionToCoords(node.posX, node.posY, nodeSize);
            this.drawFilledNode(pos, NodeColor[node.nodeType], nodeSize);
        }
    }

    drawFilledNode(nodePos, color, nodeSize) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(nodePos.x, nodePos.y, nodeSize, nodeSize);
        this.ctx.restore();
    }

    drawPath(fromX, fromY, toX, toY, color = 'orange', nodeSize) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = Math.trunc(nodeSize / 5);
        const halfNodeSize = Math.trunc(nodeSize / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(fromX + halfNodeSize, fromY + halfNodeSize);
        this.ctx.lineTo(toX + halfNodeSize, toY + halfNodeSize);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawWalkingPath(path, nodeSize) {
        if (!path) {
            return;
        }
        let lastNode = path[0];
        for (let currentNode of path.slice(1, path.length)) {
            const posOld = this.gridPositionToCoords(lastNode.posX, lastNode.posY);
            const posNew = this.gridPositionToCoords(currentNode.posX, currentNode.posY);
            this.drawPath(posOld.x, posOld.y, posNew.x, posNew.y, NodeColor.WALKED, nodeSize);
            lastNode = currentNode;
        }
    }
}

module.exports = {GridView, NodeColor};
},{"../misc/pubsub":8}]},{},[6,1,2,3,4,5,7,8,9,10,11,12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvUGF0aGZpbmRpbmdNYW5hZ2VyLmpzIiwic3JjL2FsZ29yaXRobXMvQVN0YXIuanMiLCJzcmMvY29udHJvbGxlcnMvRWRpdG9yQ29udHJvbGxlci5qcyIsInNyYy9jb250cm9sbGVycy9HcmlkQ29udHJvbGxlci5qcyIsInNyYy9kcy9OYWl2ZVByaW9yaXR5U2V0LmpzIiwic3JjL21haW4uanMiLCJzcmMvbWlzYy9oZXVyaXN0aWNzLmpzIiwic3JjL21pc2MvcHVic3ViLmpzIiwic3JjL21vZGVscy9FZGl0b3IuanMiLCJzcmMvbW9kZWxzL0dyaWQuanMiLCJzcmMvbW9kZWxzL05vZGUuanMiLCJzcmMvdmlld3MvR3JpZFZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBHcmlkID0gcmVxdWlyZSgnLi9tb2RlbHMvR3JpZCcpO1xuY29uc3QgeyBHcmlkVmlldywgTm9kZUNvbG9yIH0gPSByZXF1aXJlKCcuL3ZpZXdzL0dyaWRWaWV3Jyk7XG5jb25zdCBHcmlkQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvR3JpZENvbnRyb2xsZXInKTtcbmNvbnN0IEVkaXRvckNvbnRyb2xsZXIgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL0VkaXRvckNvbnRyb2xsZXInKTtcbmNvbnN0IHsgRWRpdG9yIH0gPSByZXF1aXJlKCcuL21vZGVscy9FZGl0b3InKTtcblxuY2xhc3MgUGF0aGZpbmRpbmdNYW5hZ2VyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKTtcbiAgICAgICAgdGhpcy5sYXN0VXBkYXRlID0gbnVsbDtcbiAgICAgICAgdGhpcy5ncmlkID0gbmV3IEdyaWQoKTtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBuZXcgRWRpdG9yKCk7XG4gICAgICAgIHRoaXMuZ3JpZFZpZXcgPSBuZXcgR3JpZFZpZXcoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JDb250cm9sbGVyID0gbmV3IEVkaXRvckNvbnRyb2xsZXIodGhpcy5lZGl0b3IpO1xuICAgICAgICB0aGlzLmdyaWRDb250cm9sbGVyID0gbmV3IEdyaWRDb250cm9sbGVyKHRoaXMuY29udGFpbmVyLCB0aGlzLmdyaWQsIHRoaXMuZ3JpZFZpZXcsIHRoaXMuZWRpdG9yKTtcbiAgICB9XG5cbiAgICBsb29wKHRpbWVzdGFtcCkge1xuICAgICAgICBpZiAoIXRoaXMubGFzdFVwZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy5sYXN0VXBkYXRlID0gdGltZXN0YW1wO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRlbHRhID0gdGltZXN0YW1wIC0gdGhpcy5sYXN0VXBkYXRlO1xuICAgICAgICB0aGlzLmxhc3RVcGRhdGUgPSB0aW1lc3RhbXA7XG4gICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5ncmlkQ29udHJvbGxlci51cGRhdGUoKTtcbiAgICAgICAgdGhpcy5lZGl0b3JDb250cm9sbGVyLnVwZGF0ZSgpO1xuICAgIH1cblxuICAgIGRyYXcoKSB7XG4gICAgICAgIHRoaXMuZ3JpZENvbnRyb2xsZXIucmVuZGVyKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yQ29udHJvbGxlci5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICBzZWxlY3Rpb25UeXBlVG9Ob2RlQ29sb3Ioc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHNlbGVjdGlvblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5TVEFSVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLlNUQVJUO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlJFTU9WRTpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLlJFTU9WRTtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5UQVJHRVQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVDb2xvci5UQVJHRVQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuV0FMTDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZUNvbG9yLldBTEw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGF0aGZpbmRpbmdNYW5hZ2VyOyIsImNvbnN0IE5haXZlUHJpb3JpdHlTZXQgPSByZXF1aXJlKCcuLi9kcy9OYWl2ZVByaW9yaXR5U2V0Jyk7XHJcblxyXG5mdW5jdGlvbiBjbXBCeUZWYWx1ZShhLCBiKSB7XHJcbiAgICByZXR1cm4gYS5mU2NvcmUgPiBiLmZTY29yZSA/IDE6IGEuZlNjb3JlID09PSBiLmZTY29yZSA/IDA6IC0xO1xyXG59XHJcblxyXG5jbGFzcyBBU3RhciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZ3JpZCwgaGV1cmlzdGljKSB7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLnN0YXJ0ID0gdGhpcy5ncmlkLnN0YXJ0Tm9kZTtcclxuICAgICAgICB0aGlzLnRhcmdldCA9IHRoaXMuZ3JpZC50YXJnZXROb2RlO1xyXG4gICAgICAgIHRoaXMub3BlblNldCA9IG5ldyBOYWl2ZVByaW9yaXR5U2V0KGNtcEJ5RlZhbHVlKTtcclxuICAgICAgICB0aGlzLm9wZW5TZXQuYWRkKHRoaXMuc3RhcnQpO1xyXG4gICAgICAgIHRoaXMuY2xvc2VkU2V0ID0gW107XHJcbiAgICAgICAgdGhpcy5oZXVyaXN0aWMgPSBoZXVyaXN0aWM7XHJcbiAgICAgICAgdGhpcy5wYXRoID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIHRoaXMuZXh0ZW5kTm9kZXMoKTtcclxuICAgICAgICB0aGlzLnN0YXJ0LmdTY29yZSA9IDA7XHJcbiAgICAgICAgdGhpcy5zdGFydC5mU2NvcmUgPSBoZXVyaXN0aWModGhpcy50YXJnZXQsIHRoaXMuc3RhcnQpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4dGVuZE5vZGVzKCkge1xyXG4gICAgICAgIHRoaXMuZ3JpZC5ub2Rlcy5mb3JFYWNoKG5vZGUgPT4ge1xyXG4gICAgICAgICAgICBub2RlLmdTY29yZSA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xyXG4gICAgICAgICAgICBub2RlLmZTY29yZSA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlUGF0aChjdXJyZW50Tm9kZSkge1xyXG4gICAgICAgIGNvbnN0IGNvbXBsZXRlUGF0aCA9IFsgY3VycmVudE5vZGUgXTtcclxuICAgICAgICBsZXQgY3VycmVudCA9IGN1cnJlbnROb2RlO1xyXG4gICAgICAgIHdoaWxlKHRoaXMucGF0aC5oYXMoY3VycmVudCkpIHtcclxuICAgICAgICAgICAgY3VycmVudCA9IHRoaXMucGF0aC5nZXQoY3VycmVudCk7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlUGF0aC51bnNoaWZ0KGN1cnJlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY29tcGxldGVQYXRoO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGFzdGFyKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGFydCB8fCAhdGhpcy50YXJnZXQpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdGFydCBvciB0YXJnZXQgaXMgbWlzc2luZyEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgIHdoaWxlKHRoaXMub3BlblNldC5sZW5ndGgoKSA+IDApIHtcclxuICAgICAgICAgICAgLy8gZ2V0IGVsZW1lbnQgd2l0aCBsb3dlc3QgZlNjb3JlXHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdGhpcy5vcGVuU2V0LmdldEZpcnN0KCk7XHJcbiAgICAgICAgICAgIGlmIChjdXJyZW50Tm9kZSA9PT0gdGhpcy50YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlY29uc3RydWN0IHBhdGgsIHdlIGFyZSBmaW5pc2hlZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc29sdXRpb246IHRoaXMuZ2VuZXJhdGVQYXRoKGN1cnJlbnROb2RlKSwgZWxhcHNlZFRpbWU6IERhdGUubm93KCkgLSBzdGFydCB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHRyYW5zZmVyIHRoZSBjdXJyZW50Tm9kZSBmcm9tIHRoZSBvcGVuIHRvIHRoZSBjbG9zZWQgc2V0XHJcbiAgICAgICAgICAgIHRoaXMub3BlblNldC5yZW1vdmUoY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlZFNldC5wdXNoKGN1cnJlbnROb2RlKTtcclxuICAgICAgICAgICAgLy8gdXBkYXRlIGFsbCBuZWlnaGJvdXJzIG9mIGN1cnJlbnQgZWxlbWVudFxyXG4gICAgICAgICAgICBmb3IgKGxldCBuZWlnaGJvdXIgb2YgdGhpcy5ncmlkLmdldE5laWdoYm91cnMoY3VycmVudE5vZGUpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGVsZW1lbnQgd2FzIGFscmVhZHkgdmlzaXRlZCwgc2tpcCBpdFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2xvc2VkU2V0LmluZGV4T2YoZWwgPT4gZWwgPT09IG5laWdoYm91cikgIT09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBTaW5jZSB3ZSBhcmUgaW4gYSBncmlkIHdlIGhhdmUgZGlzdGFuY2UgMSBiZXR3ZWVuIGFsbCBub2RlcyFcclxuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgc3ViamVjdCB0byBjaGFuZ2Ugd2hlbiBlbXBsb3lpbmcgYW4gYWN0dWFsIGdyYXBoIVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcG9zc2libGVOZXdHU3RvcmUgPSBjdXJyZW50Tm9kZS5nU2NvcmUgKyAxO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhlIHBhdGggdG8gdGhlIG5laWdoYm91ciBub2RlIGZyb20gdGhlIGN1cnJlbnQgbm9kZSBpcyBzaG9ydGVyXHJcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgcGF0aCwgZ1Njb3JlIGFuZCBmU2NvcmUgb2YgbmVpZ2hib3VyIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgIGlmIChwb3NzaWJsZU5ld0dTdG9yZSA8IG5laWdoYm91ci5nU2NvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdGguc2V0KG5laWdoYm91ciwgY3VycmVudE5vZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5laWdoYm91ci5nU2NvcmUgPSBwb3NzaWJsZU5ld0dTdG9yZTtcclxuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvdXIuZlNjb3JlID0gbmVpZ2hib3VyLmdTY29yZSArIHRoaXMuaGV1cmlzdGljKHRoaXMudGFyZ2V0LCBuZWlnaGJvdXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIG5laWdoYm91ciBpcyBub3QgaW4gdGhlIG9wZW4gc2V0IGFkZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5vcGVuU2V0LmhhcyhuZWlnaGJvdXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3BlblNldC5hZGQobmVpZ2hib3VyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgc29sdXRpb246IG51bGwsIGVsYXBzZWRUaW1lOiBEYXRlLm5vdygpIC0gc3RhcnQgfTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBU3RhcjsiLCJjb25zdCB7IFNlbGVjdGlvblR5cGUgfSA9IHJlcXVpcmUoJy4uL21vZGVscy9FZGl0b3InKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL21pc2MvcHVic3ViJyk7XG5cbmNsYXNzIEVkaXRvckNvbnRyb2xsZXIge1xuXG4gICAgY29uc3RydWN0b3IoZWRpdG9yKSB7XG4gICAgICAgIHRoaXMuaW5wdXRTZWxlY3RCb3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZWRpdG9yLWlucHV0ICNpbnB1dC10eXBlLXNlbGVjdGlvbicpO1xuICAgICAgICB0aGlzLmFsZ29yaXRobVNlbGVjdEJveCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hbGdvcml0aG0tc2VsZWN0aW9uICNhbGdvcml0aG0tc2VsZWN0aW9uJyk7XG4gICAgICAgIHRoaXMuZWRpdG9yQnV0dG9uQ29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFsZ29yaXRobS1leGVjdXRpb24nKTtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbnB1dEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEFsZ29yaXRobUluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5pbnB1dFNlbGVjdGlvbkNoYW5nZWQoKTtcbiAgICAgICAgdGhpcy5hbGdvcml0aG1TZWxlY3Rpb25DaGFuZ2VkKCk7XG4gICAgICAgIHRoaXMuaW5wdXRTZWxlY3RCb3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdGhpcy5pbnB1dFNlbGVjdGlvbkNoYW5nZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuYWxnb3JpdGhtU2VsZWN0Qm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYWxnb3JpdGhtU2VsZWN0aW9uQ2hhbmdlZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgdGhpcy5iaW5kQnV0dG9uRXZlbnRzKCk7XG4gICAgfVxuXG4gICAgYmluZEJ1dHRvbkV2ZW50cygpIHtcbiAgICAgICAgY29uc3QgYnV0dG9ucyA9IHRoaXMuZWRpdG9yQnV0dG9uQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoJ2J1dHRvbicpO1xuICAgICAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiBidXR0b25zKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGJ1dHRvbi5pZCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NsZWFyLWlucHV0LWJ1dHRvbic6XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY2xlYXJJbnB1dC5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnZ2VuZXJhdGUtbWFwLWJ1dHRvbic6XG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZ2VuZXJhdGVNYXAuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3J1bi1hbGdvcml0aG0tYnV0dG9uJzpcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5ydW5BbGdvcml0aG0uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhcklucHV0KCkge1xuICAgICAgICAvLyBAdG9kbyBpbXBsZW1lbnRcbiAgICB9XG5cbiAgICBnZW5lcmF0ZU1hcCgpIHtcbiAgICAgICAgLy8gQHRvZG8gaW1wbGVtZW50XG4gICAgfVxuXG4gICAgcnVuQWxnb3JpdGhtKCkge1xuICAgICAgICAvKlxuICAgICAgICBAdG9kbyBpbXBsZW1lbnQgYXMgbmV4dCB0YXNrLiBUaGUgY29ycmVjdCBhbGdvcml0aG0gbmVlZHMgdG8gYmUgc2VsZWN0ZWQgZnJvbSB0aGUgZWRpdG9yIG1vZGVsLFxuICAgICAgICAgICAgICB3aGljaCBuZWVkcyB0byBob2xkIGEgbWFwcGluZyBmcm9tIHRoZSBhbGdvcml0aG0gbmFtZSB0byB0aGUgY29ycmVjdCBhbGdvcml0aG0gJ25ld2FibGUnLlxuICAgICAgICAgICAgICBJIGFsc28gbmVlZCB0byBpbnRlZ3JhdGUgdGhlIGFsZ29yaXRobSBvcHRpb25zIGludG8gdGhpcyAodGhleSBjYW4gZGlmZmVyZW50IGZvciBlYWNoIGFsZ29yaXRobSlcbiAgICAgICAgICovXG4gICAgfVxuXG4gICAgaW5wdXRTZWxlY3Rpb25DaGFuZ2VkKGNoYW5nZSkge1xuICAgICAgICBpZiAoY2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5wdXRJbmRleCA9IGNoYW5nZS50YXJnZXQuc2VsZWN0ZWRJbmRleDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IHRoaXMuaW5wdXRTZWxlY3RCb3hbdGhpcy5zZWxlY3RlZElucHV0SW5kZXhdLnZhbHVlO1xuICAgICAgICB0aGlzLmVkaXRvci5zZXRTZWxlY3Rpb25UeXBlKFNlbGVjdGlvblR5cGVbdmFsdWVdKTtcbiAgICAgICAgUHViU3ViLnB1Ymxpc2goJ21hcmtWaWV3RGlydHknKTtcbiAgICB9XG5cbiAgICBhbGdvcml0aG1TZWxlY3Rpb25DaGFuZ2VkKGNoYW5nZSkge1xuICAgICAgICBpZiAoY2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkQWxnb3JpdGhtSW5kZXggPSBjaGFuZ2UudGFyZ2V0LnNlbGVjdGVkSW5kZXg7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG5cbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG5cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yQ29udHJvbGxlcjsiLCJjb25zdCB7IFNlbGVjdGlvblR5cGUgfSA9IHJlcXVpcmUoJy4uL21vZGVscy9FZGl0b3InKTtcbmNvbnN0IHsgTm9kZVR5cGUgfSA9IHJlcXVpcmUoJy4uL21vZGVscy9Ob2RlJyk7XG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi9taXNjL3B1YnN1YicpO1xuY29uc3QgeyBOb2RlQ29sb3IgfSA9IHJlcXVpcmUoJy4uL3ZpZXdzL0dyaWRWaWV3Jyk7XG5cbmNsYXNzIEdyaWRDb250cm9sbGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKGNvbnRhaW5lciwgZ3JpZCwgZ3JpZFZpZXcsIGVkaXRvcikge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgdGhpcy5ncmlkVmlldyA9IGdyaWRWaWV3O1xuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xuICAgICAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgICAgICAgdGhpcy5zZXR1cEhvdmVyRXZlbnQoKTtcbiAgICAgICAgdGhpcy5zZXR1cENsaWNrRXZlbnQoKTtcbiAgICAgICAgdGhpcy5hZGp1c3RHcmlkU2l6ZSgpO1xuICAgICAgICBQdWJTdWIuc3Vic2NyaWJlKCdjYW52YXNSZXNpemUnLCB0aGlzLmFkanVzdEdyaWRTaXplLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIH1cblxuICAgIHNldHVwSG92ZXJFdmVudCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWxhdGl2ZVBvc2l0aW9uID0gdGhpcy5nZXRSZWxhdGl2ZUNvb3JkaW5hdGVzKGV2ZW50KTtcbiAgICAgICAgICAgIGNvbnN0IG5ld05vZGVQb3MgPSB0aGlzLmdyaWRWaWV3LmNvb3Jkc1RvR3JpZFBvc2l0aW9uKHJlbGF0aXZlUG9zaXRpb24ueCwgcmVsYXRpdmVQb3NpdGlvbi55LCB0aGlzLmdyaWQubm9kZVNpemUpO1xuICAgICAgICAgICAgY29uc3QgaG92ZXJlZE5vZGUgPSB0aGlzLmdyaWQuaG92ZXJlZE5vZGU7XG4gICAgICAgICAgICBpZiAoIWhvdmVyZWROb2RlIHx8IG5ld05vZGVQb3MueCAhPT0gaG92ZXJlZE5vZGUueCB8fCBuZXdOb2RlUG9zLnkgIT09IGhvdmVyZWROb2RlLnkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWQuaG92ZXJlZE5vZGUgPSB0aGlzLmdyaWQuZ2V0Tm9kZShuZXdOb2RlUG9zLngsIG5ld05vZGVQb3MueSk7XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkVmlldy5tYXJrRGlydHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5ncmlkLmhvdmVyZWROb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkLmhvdmVyZWROb2RlID0gbnVsbDtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRWaWV3Lm1hcmtEaXJ0eSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0dXBDbGlja0V2ZW50KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdyaWRWaWV3Lm1hcmtEaXJ0eSgpO1xuICAgICAgICAgICAgdGhpcy5ncmlkLnBhdGggPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgpID0+IHtcbiAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWRqdXN0R3JpZFNpemUoKSB7XG4gICAgICAgIHRoaXMuZ3JpZFZpZXcuYWRqdXN0Q2FudmFzU2l6ZSh0aGlzLmdyaWQubm9kZVNpemUpO1xuICAgICAgICBjb25zdCBncmlkU2l6ZSA9IHRoaXMuZ3JpZFZpZXcuZGV0ZXJtaW5lR3JpZFNpemUodGhpcy5ncmlkLm5vZGVTaXplKTtcbiAgICAgICAgdGhpcy5ncmlkLnNldERpbWVuc2lvbnMoZ3JpZFNpemUucm93U2l6ZSwgZ3JpZFNpemUuY29sU2l6ZSk7XG4gICAgICAgIHRoaXMuZ3JpZC5yZWJ1aWxkR3JpZCgpO1xuICAgICAgICB0aGlzLmdyaWQuZ2VuZXJhdGVSYW5kb21XYWxscygpO1xuICAgICAgICB0aGlzLmdyaWQucGF0aCA9IG51bGw7XG4gICAgfVxuXG4gICAgZ2V0UmVsYXRpdmVDb29yZGluYXRlcyhldmVudCkge1xuICAgICAgICBjb25zdCBib3VuZGluZ1JlY3QgPSBldmVudC50YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHggPSBldmVudC5jbGllbnRYIC0gYm91bmRpbmdSZWN0LmxlZnQ7XG4gICAgICAgIGNvbnN0IHkgPSBldmVudC5jbGllbnRZIC0gYm91bmRpbmdSZWN0LnRvcDtcbiAgICAgICAgcmV0dXJuIHsgeCwgeSB9O1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhpcy5wcm9jZXNzSW5wdXQoKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRWaWV3Lm1hcmtlZERpcnR5KSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRWaWV3LmNsZWFyQ2FudmFzKCd3aGl0ZXNtb2tlJyk7XG4gICAgICAgICAgICB0aGlzLmdyaWRWaWV3LmRyYXdOb2Rlcyh0aGlzLmdyaWQubm9kZXMsIHRoaXMuZ3JpZC5ub2RlU2l6ZSk7XG4gICAgICAgICAgICBpZiAodGhpcy5ncmlkLmhvdmVyZWROb2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaE5vZGUgPSB0aGlzLmdyaWQuaG92ZXJlZE5vZGU7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9zID0gdGhpcy5ncmlkVmlldy5ncmlkUG9zaXRpb25Ub0Nvb3JkcyhoTm9kZS5wb3NYLCBoTm9kZS5wb3NZLCB0aGlzLmdyaWQubm9kZVNpemUpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZFZpZXcuZHJhd0ZpbGxlZE5vZGUocG9zLCBOb2RlQ29sb3JbdGhpcy5lZGl0b3Iuc2VsZWN0aW9uVHlwZV0sIHRoaXMuZ3JpZC5ub2RlU2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5ncmlkLnBhdGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRWaWV3LmRyYXdXYWxraW5nUGF0aCh0aGlzLmdyaWQucGF0aCwgdGhpcy5ncmlkLm5vZGVTaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZ3JpZFZpZXcubWFya2VkRGlydHkgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHJvY2Vzc0lucHV0KCkge1xuICAgICAgICBpZiAodGhpcy5ncmlkLmhvdmVyZWROb2RlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NDbGljaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ncmlkLmZvY3VzZWROb2RlID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3NDbGljaygpIHtcbiAgICAgICAgY29uc3Qgbm9kZVR5cGUgPSB0aGlzLnNlbGVjdGlvblR5cGVUb05vZGVUeXBlKHRoaXMuZWRpdG9yLnNlbGVjdGlvblR5cGUpO1xuICAgICAgICB0aGlzLmdyaWQuc2V0Tm9kZVR5cGUodGhpcy5ncmlkLmhvdmVyZWROb2RlLnBvc1gsIHRoaXMuZ3JpZC5ob3ZlcmVkTm9kZS5wb3NZLCBub2RlVHlwZSk7XG4gICAgfVxuXG4gICAgc2VsZWN0aW9uVHlwZVRvTm9kZVR5cGUoc2VsZWN0aW9uVHlwZSkge1xuICAgICAgICBzd2l0Y2ggKHNlbGVjdGlvblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgU2VsZWN0aW9uVHlwZS5TVEFSVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZVR5cGUuU1RBUlQ7XG4gICAgICAgICAgICBjYXNlIFNlbGVjdGlvblR5cGUuUkVNT1ZFOlxuICAgICAgICAgICAgICAgIHJldHVybiBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLlRBUkdFVDpcbiAgICAgICAgICAgICAgICByZXR1cm4gTm9kZVR5cGUuVEFSR0VUO1xuICAgICAgICAgICAgY2FzZSBTZWxlY3Rpb25UeXBlLldBTEw6XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVUeXBlLldBTEw7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JpZENvbnRyb2xsZXI7IiwiY2xhc3MgTmFpdmVQcmlvcml0eVNldCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoY21wRnVuY3Rpb24pIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBbXTtcclxuICAgICAgICB0aGlzLmNtcEZ1bmN0aW9uID0gY21wRnVuY3Rpb247XHJcbiAgICB9XHJcblxyXG4gICAgYWRkKGVsZW1lbnQpIHtcclxuICAgICAgICB0aGlzLmNvbnRlbnQucHVzaChlbGVtZW50KTtcclxuICAgICAgICB0aGlzLmNvbnRlbnQuc29ydCh0aGlzLmNtcEZ1bmN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUoZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5maW5kSW5kZXgoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgdGhpcy5jb250ZW50LnNvcnQodGhpcy5jbXBGdW5jdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Rmlyc3QoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGVudFswXTtcclxuICAgIH1cclxuXHJcbiAgICBoYXMoZWxlbWVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRJbmRleChlbGVtZW50KSAhPT0gLTE7XHJcbiAgICB9XHJcblxyXG4gICAgZmluZEluZGV4KGVsZW1lbnQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250ZW50LmZpbmRJbmRleChlbCA9PiBlbCA9PT0gZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRlbnQubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBOYWl2ZVByaW9yaXR5U2V0OyIsImNvbnN0IFBhdGhmaW5kaW5nTWFuYWdlciA9IHJlcXVpcmUoJy4vUGF0aGZpbmRpbmdNYW5hZ2VyJyk7XG5jb25zdCBwYXRoZmluZGluZ01hbmFnZXIgPSBuZXcgUGF0aGZpbmRpbmdNYW5hZ2VyKCk7XG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcCk7XG5mdW5jdGlvbiBsb29wKHRpbWVzdGFtcCkge1xuICAgIHBhdGhmaW5kaW5nTWFuYWdlci5sb29wKHRpbWVzdGFtcCk7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGxvb3ApO1xufSIsImZ1bmN0aW9uIG1hbmhhdHRhbkRpc3RhbmNlKHRhcmdldE5vZGUsIGN1cnJlbnROb2RlKSB7XHJcbiAgICByZXR1cm4gTWF0aC5hYnModGFyZ2V0Tm9kZS5wb3NYIC0gY3VycmVudE5vZGUucG9zWCkgKyBNYXRoLmFicyh0YXJnZXROb2RlLnBvc1kgLSBjdXJyZW50Tm9kZS5wb3NZKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBtYW5oYXR0YW5EaXN0YW5jZVxyXG59OyIsImNvbnN0IHN1YnNjcmliZXJzID0ge307XHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgcHVibGlzaChldmVudE5hbWUsIGRhdGEpIHtcclxuICAgICAgICBpZiAoIXN1YnNjcmliZXJzW2V2ZW50TmFtZV0pIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgTm8gZXZlbnQgd2l0aCBuYW1lICR7ZXZlbnROYW1lfSBhdmFpbGFibGUhYCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3Vic2NyaWJlcnNbZXZlbnROYW1lXS5mb3JFYWNoKGNhbGxiYWNrRm4gPT4gY2FsbGJhY2tGbihkYXRhKSk7XHJcbiAgICB9LFxyXG4gICAgc3Vic2NyaWJlKGV2ZW50TmFtZSwgY2FsbGJhY2tGbikge1xyXG4gICAgICAgIGlmICghc3Vic2NyaWJlcnNbZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICBzdWJzY3JpYmVyc1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBpbmRleCA9IHN1YnNjcmliZXJzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFja0ZuKTtcclxuICAgICAgICByZXR1cm4gKCkgPT4gc3Vic2NyaWJlcnNbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfVxyXG59OyIsImNvbnN0IFNlbGVjdGlvblR5cGUgPSBPYmplY3QuZnJlZXplKHtcclxuICAgIFNUQVJUOiAnU1RBUlQnLFxyXG4gICAgVEFSR0VUOiAnVEFSR0VUJyxcclxuICAgIFdBTEw6ICdXQUxMJyxcclxuICAgIFJFTU9WRTogJ1JFTU9WRSdcclxufSk7XHJcblxyXG5cclxuXHJcbmNsYXNzIEVkaXRvciB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvblR5cGUgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuYWxnb3JpdGhtID0gbnVsbDtcclxuICAgIH07XHJcblxyXG4gICAgc2V0U2VsZWN0aW9uVHlwZSh0eXBlKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3Rpb25UeXBlID0gdHlwZTtcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7IEVkaXRvciwgU2VsZWN0aW9uVHlwZSB9OyIsImNvbnN0IHtOb2RlLCBOb2RlVHlwZX0gPSByZXF1aXJlKCcuL05vZGUnKTtcblxuY2xhc3MgR3JpZCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5zdGFydE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnRhcmdldE5vZGUgPSBudWxsO1xuICAgICAgICB0aGlzLnBhdGggPSBudWxsO1xuICAgICAgICB0aGlzLmhvdmVyZWROb2RlID0gbnVsbDtcbiAgICAgICAgLy8gaW4gcHhcbiAgICAgICAgdGhpcy5ub2RlU2l6ZSA9IDE1O1xuICAgICAgICAvLyBjb3VudCBvZiBlbGVtZW50c1xuICAgICAgICB0aGlzLm9ic3RhY2xlU2l6ZSA9IDM7XG4gICAgICAgIC8vIHBybyBtaWxsZVxuICAgICAgICB0aGlzLm9ic3RhY2xlRGVuc2l0eSA9IDQwIC8gMTAwMDtcblxuICAgICAgICB0aGlzLmRpcmVjdGlvbnMgPSB7XG4gICAgICAgICAgICBMRUZUOiB7eDogLTEsIHk6IDB9LFxuICAgICAgICAgICAgUklHSFQ6IHt4OiAxLCB5OiAwfSxcbiAgICAgICAgICAgIFVQOiB7eDogMCwgeTogLTF9LFxuICAgICAgICAgICAgRE9XTjoge3g6IDAsIHk6IDF9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXREaW1lbnNpb25zKHJvd1NpemUsIGNvbFNpemUpIHtcbiAgICAgICAgdGhpcy5yb3dTaXplID0gcm93U2l6ZTtcbiAgICAgICAgdGhpcy5jb2xTaXplID0gY29sU2l6ZTtcbiAgICB9XG5cbiAgICByZWJ1aWxkR3JpZCgpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29sU2l6ZTsgaSArPSAxKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMucm93U2l6ZTsgaiArPSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IG5ldyBOb2RlKGosIGkpO1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZXMucHVzaChuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdlbmVyYXRlUmFuZG9tV2FsbHMoKSB7XG4gICAgICAgIHRoaXMucmVidWlsZEdyaWQoKTtcbiAgICAgICAgZm9yIChsZXQgbm9kZSBvZiB0aGlzLm5vZGVzKSB7XG4gICAgICAgICAgICBjb25zdCByYW5kb20gPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICAgICAgaWYgKHJhbmRvbSA8IHRoaXMub2JzdGFjbGVEZW5zaXR5KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gbm9kZS5wb3NYO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0WSA9IG5vZGUucG9zWTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gc3RhcnRZLCBjdWJlWSA9IDA7IGN1YmVZIDwgdGhpcy5vYnN0YWNsZVNpemUgJiYgaiA8IHRoaXMuY29sU2l6ZTsgaisrLCBjdWJlWSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBzdGFydFgsIGN1YmVYID0gMDsgY3ViZVggPCB0aGlzLm9ic3RhY2xlU2l6ZSAmJiBpIDwgdGhpcy5yb3dTaXplOyBpKyssIGN1YmVYKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2V0Tm9kZShpLCBqKS5ub2RlVHlwZSA9IE5vZGVUeXBlLldBTEw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXROb2RlKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXNbeSAqIHRoaXMucm93U2l6ZSArIHhdO1xuICAgIH1cblxuICAgIHNldE5vZGVUeXBlKGdyaWRYLCBncmlkWSwgdHlwZSkge1xuICAgICAgICBjb25zdCBmb3VuZE5vZGUgPSB0aGlzLmdldE5vZGUoZ3JpZFgsIGdyaWRZKTtcbiAgICAgICAgZm91bmROb2RlLm5vZGVUeXBlID0gdHlwZTtcblxuICAgICAgICAvLyBzcGVjaWFsIGNhc2VzIHN0YXJ0IGFuZCB0YXJnZXQgc2luY2Ugd2UgbmVlZCB0byBwb3RlbnRpYWxseSByZW1vdmUgb3RoZXIgc3RhcnRzLCBzdWJqZWN0IHRvIGNoYW5nZVxuICAgICAgICBpZiAodHlwZSA9PT0gTm9kZVR5cGUuU1RBUlQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXJ0Tm9kZSAmJiB0aGlzLnN0YXJ0Tm9kZSAhPT0gZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydE5vZGUubm9kZVR5cGUgPSBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdGFydE5vZGUgPSBmb3VuZE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZSA9PT0gTm9kZVR5cGUuVEFSR0VUKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50YXJnZXROb2RlICYmIHRoaXMudGFyZ2V0Tm9kZSAhPT0gZm91bmROb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXROb2RlLm5vZGVUeXBlID0gTm9kZVR5cGUuVU5TRUxFQ1RFRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Tm9kZSA9IGZvdW5kTm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldE5laWdoYm91cnMobm9kZSwgZGlhZ29uYWxBbGxvd2VkID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgbmVpZ2hib3VycyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBkaXJlY3Rpb24gb2YgT2JqZWN0LmtleXModGhpcy5kaXJlY3Rpb25zKSkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZGlyZWN0aW9uc1tkaXJlY3Rpb25dLng7XG4gICAgICAgICAgICBjb25zdCB5ID0gdGhpcy5kaXJlY3Rpb25zW2RpcmVjdGlvbl0ueTtcbiAgICAgICAgICAgIGNvbnN0IG5ld1ggPSBub2RlLnBvc1ggKyB4O1xuICAgICAgICAgICAgY29uc3QgbmV3WSA9IG5vZGUucG9zWSArIHk7XG4gICAgICAgICAgICBpZiAobmV3WCA+IC0xICYmIG5ld1ggPCB0aGlzLnJvd1NpemUgJiYgbmV3WSA+IC0xICYmIG5ld1kgPCB0aGlzLmNvbFNpemUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZWlnaGJvdXIgPSB0aGlzLmdldE5vZGUobmV3WCwgbmV3WSk7XG4gICAgICAgICAgICAgICAgaWYgKG5laWdoYm91ci5ub2RlVHlwZSAhPT0gTm9kZVR5cGUuV0FMTCkge1xuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvdXJzLnB1c2gobmVpZ2hib3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5laWdoYm91cnM7XG4gICAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JpZDsiLCJjbGFzcyBOb2RlIHtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcihwb3NYLCBwb3NZKSB7XG4gICAgICAgIHRoaXMucG9zWCA9IHBvc1g7XG4gICAgICAgIHRoaXMucG9zWSA9IHBvc1k7XG4gICAgICAgIHRoaXMubm9kZVR5cGUgPSBOb2RlVHlwZS5VTlNFTEVDVEVEO1xuICAgIH1cblxufVxuXG5jb25zdCBOb2RlVHlwZSA9IE9iamVjdC5mcmVlemUoe1xuICAgIFVOU0VMRUNURUQ6ICdVTlNFTEVDVEVEJyxcbiAgICBTVEFSVDogJ1NUQVJUJyxcbiAgICBUQVJHRVQ6ICdUQVJHRVQnLFxuICAgIFdBTEw6ICdXQUxMJ1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIE5vZGUsXG4gICAgTm9kZVR5cGVcbn07IiwiY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vbWlzYy9wdWJzdWInKTtcblxuY29uc3QgTm9kZUNvbG9yID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgVU5TRUxFQ1RFRDogJ3doaXRlJyxcbiAgICBTVEFSVDogJ3llbGxvdycsXG4gICAgVEFSR0VUOiAnZ3JlZW4nLFxuICAgIFdBTEw6ICdibGFjaycsXG4gICAgUkVNT1ZFOiAncmVkJyxcbiAgICBXQUxLRUQ6ICdvcmFuZ2UnXG59KTtcblxuY2xhc3MgR3JpZFZpZXcge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpO1xuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY29udGVudCcpWzBdO1xuICAgICAgICB0aGlzLm1hcmtlZERpcnR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWdpc3Rlck9uUmVzaXplKCk7XG4gICAgICAgIFB1YlN1Yi5zdWJzY3JpYmUoJ21hcmtWaWV3RGlydHknLCB0aGlzLm1hcmtEaXJ0eS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICByZWdpc3Rlck9uUmVzaXplKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ2NhbnZhc1Jlc2l6ZScpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhZGp1c3RDYW52YXNTaXplKG5vZGVTaXplKSB7XG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5jb250YWluZXJXaWR0aCAtIHRoaXMuY29udGFpbmVyV2lkdGggJSBub2RlU2l6ZTtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5jb250YWluZXJIZWlnaHQgLSB0aGlzLmNvbnRhaW5lckhlaWdodCAlIG5vZGVTaXplO1xuICAgIH1cblxuICAgIGRldGVybWluZUdyaWRTaXplKG5vZGVTaXplKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByb3dTaXplOiBNYXRoLnRydW5jKHRoaXMuY2FudmFzV2lkdGggLyBub2RlU2l6ZSksXG4gICAgICAgICAgICBjb2xTaXplOiBNYXRoLnRydW5jKHRoaXMuY2FudmFzSGVpZ2h0IC8gbm9kZVNpemUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgY29udGFpbmVyV2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5vZmZzZXRXaWR0aDtcbiAgICB9XG5cbiAgICBnZXQgY29udGFpbmVySGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGdldCBjYW52YXNXaWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FudmFzLndpZHRoO1xuICAgIH1cblxuICAgIGdldCBjYW52YXNIZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhbnZhcy5oZWlnaHQ7XG4gICAgfVxuXG4gICAgY29vcmRzVG9HcmlkUG9zaXRpb24oY29yZFgsIGNvcmRZLCBub2RlU2l6ZSkge1xuICAgICAgICByZXR1cm4geyB4OiBNYXRoLnRydW5jKGNvcmRYIC8gbm9kZVNpemUpLCB5OiBNYXRoLnRydW5jKGNvcmRZIC8gbm9kZVNpemUpIH07XG4gICAgfVxuXG4gICAgZ3JpZFBvc2l0aW9uVG9Db29yZHMoZ3JpZFgsIGdyaWRZLCBub2RlU2l6ZSkge1xuICAgICAgICByZXR1cm4geyB4OiBncmlkWCAqIG5vZGVTaXplLCB5OiBncmlkWSAqIG5vZGVTaXplIH07XG4gICAgfVxuXG4gICAgbWFya0RpcnR5KCkge1xuICAgICAgICB0aGlzLm1hcmtlZERpcnR5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjbGVhckNhbnZhcyhjb2xvcikge1xuICAgICAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXNXaWR0aCwgdGhpcy5jYW52YXNIZWlnaHQpO1xuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgZHJhd05vZGVzKG5vZGVzLCBub2RlU2l6ZSkge1xuICAgICAgICBmb3IgKGxldCBub2RlIG9mIG5vZGVzKSB7XG4gICAgICAgICAgICBjb25zdCBwb3MgPSB0aGlzLmdyaWRQb3NpdGlvblRvQ29vcmRzKG5vZGUucG9zWCwgbm9kZS5wb3NZLCBub2RlU2l6ZSk7XG4gICAgICAgICAgICB0aGlzLmRyYXdGaWxsZWROb2RlKHBvcywgTm9kZUNvbG9yW25vZGUubm9kZVR5cGVdLCBub2RlU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcmF3RmlsbGVkTm9kZShub2RlUG9zLCBjb2xvciwgbm9kZVNpemUpIHtcbiAgICAgICAgdGhpcy5jdHguc2F2ZSgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgICAgdGhpcy5jdHguZmlsbFJlY3Qobm9kZVBvcy54LCBub2RlUG9zLnksIG5vZGVTaXplLCBub2RlU2l6ZSk7XG4gICAgICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICBkcmF3UGF0aChmcm9tWCwgZnJvbVksIHRvWCwgdG9ZLCBjb2xvciA9ICdvcmFuZ2UnLCBub2RlU2l6ZSkge1xuICAgICAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gY29sb3I7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IE1hdGgudHJ1bmMobm9kZVNpemUgLyA1KTtcbiAgICAgICAgY29uc3QgaGFsZk5vZGVTaXplID0gTWF0aC50cnVuYyhub2RlU2l6ZSAvIDIpO1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKGZyb21YICsgaGFsZk5vZGVTaXplLCBmcm9tWSArIGhhbGZOb2RlU2l6ZSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0b1ggKyBoYWxmTm9kZVNpemUsIHRvWSArIGhhbGZOb2RlU2l6ZSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgZHJhd1dhbGtpbmdQYXRoKHBhdGgsIG5vZGVTaXplKSB7XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsYXN0Tm9kZSA9IHBhdGhbMF07XG4gICAgICAgIGZvciAobGV0IGN1cnJlbnROb2RlIG9mIHBhdGguc2xpY2UoMSwgcGF0aC5sZW5ndGgpKSB7XG4gICAgICAgICAgICBjb25zdCBwb3NPbGQgPSB0aGlzLmdyaWRQb3NpdGlvblRvQ29vcmRzKGxhc3ROb2RlLnBvc1gsIGxhc3ROb2RlLnBvc1kpO1xuICAgICAgICAgICAgY29uc3QgcG9zTmV3ID0gdGhpcy5ncmlkUG9zaXRpb25Ub0Nvb3JkcyhjdXJyZW50Tm9kZS5wb3NYLCBjdXJyZW50Tm9kZS5wb3NZKTtcbiAgICAgICAgICAgIHRoaXMuZHJhd1BhdGgocG9zT2xkLngsIHBvc09sZC55LCBwb3NOZXcueCwgcG9zTmV3LnksIE5vZGVDb2xvci5XQUxLRUQsIG5vZGVTaXplKTtcbiAgICAgICAgICAgIGxhc3ROb2RlID0gY3VycmVudE5vZGU7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge0dyaWRWaWV3LCBOb2RlQ29sb3J9OyJdfQ==
