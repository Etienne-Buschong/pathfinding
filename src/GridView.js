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