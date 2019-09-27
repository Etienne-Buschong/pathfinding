class EventController {

    constructor(container) {
        this.container = container;
        this.setupHoverEvent();
        this.setupClickEvent();
        this.hoverPosition = null;
        this.mouseDown = false;
    }

    setupHoverEvent() {
        this.container.addEventListener('mousemove', (event) => {
            this.hoverPosition = this.getRelativeCoordinates(event);
        });
        this.container.addEventListener('mouseleave', () => {
            this.hoverPosition = null;
        });
    }

    setupClickEvent() {
        this.container.addEventListener('mousedown', () => {
            this.mouseDown = true;
        });
        this.container.addEventListener('mouseup', () => {
           this.mouseDown = false;
        });
    }

    getRelativeCoordinates(event) {
        const boundingRect = event.target.getBoundingClientRect();
        const x = event.clientX - boundingRect.left;
        const y = event.clientY - boundingRect.top;
        return { x, y };
    }
}

module.exports = EventController;