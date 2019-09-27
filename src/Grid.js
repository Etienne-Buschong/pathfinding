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