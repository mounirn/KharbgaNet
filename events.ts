//https://keestalkstech.com/2016/03/strongly-typed-event-handlers-in-typescript-part-1/

/* Models an event with a generic sender and generic arguments */
interface IEvent<TSender, TArgs> {

    subscribe(fn: (sender: TSender, args: TArgs) => void): void;

    unsubscribe(fn: (sender: TSender, args: TArgs) => void): void;
}

/// The dispatcher handles the storage of subsciptions and facili...
class EventDispatcher<TSender, TArgs> implements IEvent<TSender, TArgs> {

    private _subscriptions: Array<(sender: TSender, args: TArgs) => void> = new Array<(sender: TSender, args: TArgs) => void>();

    subscribe(fn: (sender: TSender, args: TArgs) => void): void {
        if (fn) {
            this._subscriptions.push(fn);
        }
    }

    unsubscribe(fn: (sender: TSender, args: TArgs) => void): void {
        let i = this._subscriptions.indexOf(fn);
        if (i > -1) {
            this._subscriptions.splice(i, 1);
        }
    }

    dispatch(sender: TSender, args: TArgs): void {
        for (let handler of this._subscriptions) {
            handler(sender, args);
        }
    }
}