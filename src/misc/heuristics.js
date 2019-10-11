function manhattanDistance(targetNode, currentNode) {
    return Math.abs(targetNode.posX - currentNode.posX) + Math.abs(targetNode.posY - currentNode.posY);
}

module.exports = {
    manhattanDistance
};