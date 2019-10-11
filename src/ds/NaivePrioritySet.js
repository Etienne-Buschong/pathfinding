class NaivePrioritySet {

    constructor(cmpFunction) {
        this.content = [];
        this.cmpFunction = cmpFunction;
    }

    add(element) {
        this.content.push(element);
        this.content.sort(this.cmpFunction);
    }

    remove(element) {
        const index = this.findIndex(element);
        this.content.splice(index, 1);
        this.content.sort(this.cmpFunction);
    }

    getFirst() {
        return this.content[0];
    }

    has(element) {
        return this.findIndex(element) !== -1;
    }

    findIndex(element) {
        return this.content.findIndex(el => el === element);
    }

    length() {
        return this.content.length;
    }

}

module.exports = NaivePrioritySet;