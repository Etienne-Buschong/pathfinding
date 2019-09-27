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
        const start = Date.now();
        while(this.openSet.length() > 0) {
            // get element with lowest fScore
            const currentNode = this.openSet.getFirst();
            if (currentNode === this.target) {
                // reconstruct path, we are finished
                return { solution: this.generatePath(currentNode), elapsedTime: Date.now() - start };
            }
            // transfer the currentNode from the open to the closed set
            this.openSet.remove(currentNode);
            this.closedSet.push(currentNode);
            // update all neighbours of current element
            for (let neighbour of this.grid.getNeighbours(currentNode)) {
                // this element was already visited, skip it
                if (this.closedSet.indexOf(el => el === neighbour) !== -1) {
                    continue;
                }
                // Since we are in a grid we have distance 1 between all nodes!
                // This is subject to change when employing an actual graph!
                const possibleNewGStore = currentNode.gScore + 1;
                // the path to the neighbour node from the current node is shorter
                // update path, gScore and fScore of neighbour element
                if (possibleNewGStore < neighbour.gScore) {
                    this.path.set(neighbour, currentNode);
                    neighbour.gScore = possibleNewGStore;
                    neighbour.fScore = neighbour.gScore + this.heuristic(this.target, neighbour);
                    // if neighbour is not in the open set add it
                    if (!this.openSet.has(neighbour)) {
                        this.openSet.add(neighbour);
                    }
                }
            }
        }
        return { solution: null, elapsedTime: Date.now() - start };
    }
}

module.exports = AStar;