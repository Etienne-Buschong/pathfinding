const subscribers = {};
module.exports = {
    publish(eventName, data) {
        if (!subscribers[eventName]) {
            console.error(`No event with name ${eventName} available!`);
            return;
        }
        subscribers[eventName].forEach(callbackFn => callbackFn(data));
    },
    subscribe(eventName, callbackFn) {
        if (!subscribers[eventName]) {
            subscribers[eventName] = [];
        }
        let index = subscribers[eventName].push(callbackFn);
        return () => subscribers[eventName].splice(index, 1);
    }
};