class Just {
    constructor(value) {
        this.value = value || null;
        this.errors = [];
        this.checks = [];
    }

    extract() {
        return this.or();
    }

    shrug() {
        return this.or(() => null);
    }

    or(callback) {
        if (this.value !== null)
            return this.value;

        else if (callback !== undefined)
            return callback();

        throw new Error("can't extract null value");
    }

    stack(error) {
        this.errors.push(error);
        return this;
    }

    did(check) {
        this.checks.push(check);
        return this;
    }
}

class Nothing extends Just {}

function just(value) {
    return new Just(value);
}

function nothing() {
    return new Nothing();
}

function pull(array, index) {
    if (index >= array.length || index < 0)
        return nothing();
    
    return just(array[index]);
}