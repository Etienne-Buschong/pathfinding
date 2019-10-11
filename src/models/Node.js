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