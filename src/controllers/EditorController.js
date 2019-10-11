const { SelectionType } = require('../models/Editor');
const PubSub = require('../misc/pubsub');

class EditorController {

    constructor(editor) {
        this.inputSelectBox = document.querySelector('.editor-input #input-type-selection');
        this.algorithmSelectBox = document.querySelector('.algorithm-selection #algorithm-selection');
        this.editorButtonContainer = document.querySelector('.algorithm-execution');
        this.editor = editor;
        this.selectedInputIndex = 0;
        this.selectedAlgorithmIndex = 0;
        this.inputSelectionChanged();
        this.algorithmSelectionChanged();
        this.inputSelectBox.addEventListener('change', this.inputSelectionChanged.bind(this));
        this.algorithmSelectBox.addEventListener('change', this.algorithmSelectionChanged.bind(this));
        this.bindButtonEvents();
    }

    bindButtonEvents() {
        const buttons = this.editorButtonContainer.querySelectorAll('button');
        for (const button of buttons) {
            switch (button.id) {
                case 'clear-input-button':
                    button.addEventListener('click', this.clearInput.bind(this));
                    break;
                case 'generate-map-button':
                    button.addEventListener('click', this.generateMap.bind(this));
                    break;
                case 'run-algorithm-button':
                    button.addEventListener('click', this.runAlgorithm.bind(this));
            }
        }
    }

    clearInput() {
        // @todo implement
    }

    generateMap() {
        // @todo implement
    }

    runAlgorithm() {
        /*
        @todo implement as next task. The correct algorithm needs to be selected from the editor model,
              which needs to hold a mapping from the algorithm name to the correct algorithm 'newable'.
              I also need to integrate the algorithm options into this (they can different for each algorithm)
         */
    }

    inputSelectionChanged(change) {
        if (change) {
            this.selectedInputIndex = change.target.selectedIndex;
        }
        const value = this.inputSelectBox[this.selectedInputIndex].value;
        this.editor.setSelectionType(SelectionType[value]);
        PubSub.publish('markViewDirty');
    }

    algorithmSelectionChanged(change) {
        if (change) {
            this.selectedAlgorithmIndex = change.target.selectedIndex;
        }
    }

    update() {

    }

    render() {

    }
}

module.exports = EditorController;