/** An expected failure whose message is shown to the user without a stack trace. */
export class KitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'KitError';
    }
}
