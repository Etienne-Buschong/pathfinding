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