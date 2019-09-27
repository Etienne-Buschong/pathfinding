const NaivePrioritySet = require('./NaivePrioritySet');

function cmpByFValue(a, b) {
    return a.fScore > b.fScore ? 1: a.fScore === b.fScore ? 0: -1;
}

class AStar {

    constructor(grid, heuristic) {
        this.grid = grid;
        this.start = this.grid.startNode;
        this.target = this.grid.targetNode;
        this.openSet = new NaivePrioritySet(cmpByFValue);
        this.openSet.add(this.start);
        this.closedSet = [];
        this.heuristic = heuristic;
        this.path = new Map();
        this.extendNodes();
        this.start.gScore = 0;
        this.start.fScore = heuristic(this.target, this.start);
    }

    extendNodes() {
        this.grid.nodes.forEach(node => {
            node.gScore = Number.MAX_SAFE_INTEGER;
            node.fScore = Number.MAX_SAFE_INTEGER;
        });
    }

    generatePath(currentNode) {
        const completePath = [ currentNode ];
        let current = currentNode;
        while(this.path.has(current)) {
            current = this.path.get(current);
            completePath.unshift(current);
        }
        return completePath;
    }

    astar() {
        if (!this.start || !this.target) {
            throw new Error('Start or target is missing!');
        }
        while(this.openSet.length() > 0) {
            const currentNode = this.openSet.getFirst();
            if (currentNode === this.target) {
                // reconstruct path
                return this.generatePath(currentNode);
            }
            this.openSet.remove(currentNode);
            this.closedSet.push(currentNode);
            for (let neighbour of this.grid.getNeighbours(currentNode)) {
                if (this.closedSet.indexOf(el => el === neighbour) !== -1) {
                    continue;
                }
                // Since we are in a grid we have distance 1 between all nodes!
                // This is subject to change when employing an actual graph!
                const possibleNewGStore = currentNode.gScore + 1;
                if (possibleNewGStore < neighbour.gScore) {
                    this.path.set(neighbour, currentNode);
                    neighbour.gScore = possibleNewGStore;
                    neighbour.fScore = neighbour.gScore + this.heuristic(this.target, neighbour);
                    if (!this.openSet.has(neighbour)) {
                        this.openSet.add(neighbour);
                    }
                }
            }
        }
        return null;
    }
}

module.exports = AStar;