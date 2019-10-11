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