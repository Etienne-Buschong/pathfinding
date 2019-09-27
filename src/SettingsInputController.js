const SelectionType = Object.freeze({
    START: 'START',
    TARGET: 'TARGET',
    WALL: 'WALL',
    REMOVE: 'REMOVE'
});

class SettingsInputController {

    constructor() {
        this.controlContainer = document.getElementsByClassName('header-left')[0];
        this.bindModeButtons();
        this.currentModeSelection = null;
        this.selectInputMode(SelectionType.START);
        this.setupKeybindings();
    }

    bindModeButtons() {
        this.modeKnobs = {};
        Array.from(this.controlContainer.children).forEach(child => {
            this.modeKnobs[child.getAttribute('type')] = child;
        });
    }

    setupKeybindings() {
        window.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'KeyW':
                    this.selectInputMode(SelectionType.WALL);
                    break;
                case 'KeyT':
                    this.selectInputMode(SelectionType.TARGET);
                    break;
                case 'KeyS':
                    this.selectInputMode(SelectionType.START);
                    break;
                case 'KeyR':
                    this.selectInputMode(SelectionType.REMOVE);
                    break;
                case 'KeyA':
                    this.startPathfinding = true;
                    break;
            }
        })
    }

    selectInputMode(selectionType) {
        if (this.currentModeSelection) {
            this.currentModeSelection.element.classList.remove('header__node-container_selected');
        }
        this.currentModeSelection = { value: SelectionType[selectionType], element: this.modeKnobs[selectionType] };
        this.currentModeSelection.element.classList.add('header__node-container_selected');
    }
}

module.exports = { SettingsInputController, SelectionType };