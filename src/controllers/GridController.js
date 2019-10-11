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