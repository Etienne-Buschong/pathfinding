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