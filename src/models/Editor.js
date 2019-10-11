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