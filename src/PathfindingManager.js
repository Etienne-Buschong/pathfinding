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