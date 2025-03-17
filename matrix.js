const names = ["x", "y", "z", "alpha", "beta", "gamma", "delta"];

function strip(number) {
    if (Math.abs(number) < 0.000000001)
        return 0;

    if (Math.abs(number - Math.round(number)) < 0.001)
        return Math.round(number);

    return parseFloat(parseFloat(number).toPrecision(12));
}

class Vector {
    constructor(...elements) {
        this.x = just(elements[0]).extract();
        this.elements = elements;
        this.size = elements.length;
        
        for (let i = 1; i < this.size; i++) {
            this[names[i]] = pull(elements, 1).shrug();
        }
    }
}

class Matrix {
    source;

    constructor(rows = 1, cols = 1) {
        this.size = vec(rows, cols).extract();

        this.source = new Array(rows);
        for (let i = 0; i < rows; i++) {
            this.source[i] = new Array(cols);
        }
        this.fill();
    }

    fill(value = 0) {
        for (let i = 0; i < this.size.x; i++) {
            this.fillRow(i, value);
        }
        return true;
    }

    fillRow(row, value) {
        this.source[row].fill(value);
        return true;
    }

    setRow(row, values) {
        if (!this.verify(values))
            return false;

        this.source[row] = values;
        return true;
    }

    verify(values) {
        return values.length == this.size.y;
    }

    verifySize(source, checkAll = true) {
        if (source.constructor.name !== "Array" || source.length !== this.size.x)
            return false;

        if (!checkAll)
            return this.verify(sources[0]); 

        for (const row of source) {
            if (row.constructor.name !== "Array" || !this.verify(row))
                return false;
        }

        return true;
    }

    isSquare() {
        return this.size.x === this.size.y;
    }

    replace(base, source, coef) {
        for (let i = 0; i < this.size.y; i++) {
            this.source[base][i] = this.source[base][i] + coef * this.source[source][i];
        }
    }

    swap(first, second) {
        const copy = this.source[first];
        this.source[first] = this.source[second];
        this.source[second] = copy;
    }

    scale(row, coef) {
        for (let i = 0; i < this.size.y; i++) {
            this.source[row][i] *= coef;
        }
    }

    toRREF() {
        this.sortByZeroes();
        
        let baseCol = 0;
        for (let i = 0; i < this.size.x; i++) {
            for (; this.source[i][baseCol] === 0; baseCol++);
            if (baseCol === this.size.y) break;

            if (this.source[i][baseCol] !== 1)
                this.scale(i, 1 / this.source[i][baseCol]);

            for (let j = 0; j < this.size.x; j++) {
                if (j !== i && this.source[j][baseCol] !== 0)
                    this.replace(j, i, -1 * this.source[j][baseCol]);
            }
        }
        this.repair();
        return true;
    }

    repair() {
        for (let i = 0; i < this.size.x; i++) {
            for (let j = 0; j < this.size.y; j++) {
                this.source[i][j] = strip(this.source[i][j]);
            }
        }
    }

    zeroCount(row) {
        let count = 0;
        let i = 0;
        while (row[i] === 0) {
            count++;
            i++;
        }

        return count;
    }

    sortByZeroes() {
        this.source.sort((a,b) => this.zeroCount(a) - this.zeroCount(b));
        return true;
    }

    addColumn(values) {
        if (values.length !== this.size.x)
            return false;

        for (let i = 0; i < this.size.x; i++) {
            this.source[i].push(values[i]);
        }
        this.size.y++;
        return true;
    }

    removeColumn(col) {
        if (col >= this.size.y)
            return false;

        for (let i = 0; i < this.size.x; i++) {
            this.source[i].splice(col, 1);
        }
        this.size.y--;
        return true;
    }

    addIdentity() {
        if (!this.isSquare())
            return false;

        for (let i = 0; i < this.size.x; i++) {
            const values = new Array(this.size.x);
            values.fill(0);
            values[i] = 1;
            this.addColumn(values);
        }
        return true;
    }

    toInverse() {
        if (!this.addIdentity())
            return false;

        this.toRREF();
        for (let i = 0; i < this.size.x; i++) {
            this.removeColumn(0);
        }
        return true;
    }

    static from(source) {
        if (typeof source !== "object")
            return nothing().stack("source is not an array");
    
        const matrix = new Matrix(source.length, source[0].length);
    
        if (!matrix.verifySize(source))
            return nothing().stack("source is not rectangular");

        matrix.source = source;
        return just(matrix).did("rectangular");
    }
}

class MatrixOperation {
    constructor(sources) {
        this.sources = sources.map(src => {
            const s = src.extract();
            if (s.constructor.name === "Vector") {
                const transposed = new Array(s.size);
                
                for (let i = 0; i < s.size; i++) {
                    transposed[i] = [s.elements[i]];
                }
                return matrix(transposed);
            }
            return src;
        });
    }

    multiply() {
        while (this.sources.length > 2) {
            const first = new MatrixOperation(...this.sources.slice(0,2));
            this.sources.shift();
            this.sources[0] = first.multiply();
        }

        if (typeof this.sources !== "object" || this.sources.length === 0)
            return nothing().stack("no matrices to multiply");

        const [first, second] = this.sources.map(s => s.extract());
        
        if (!this.haveCompatibleDimensions(0, first, second))
            return nothing().stack("matrices have incompatible dimensions for multiplication");

        const result = new Matrix(first.size.x, second.size.y);
        for (let i = 0; i < first.size.x; i++) {
            for (let j = 0; j < second.size.y; j++) {
                let sum = 0;
                for (let k = 0; k < first.size.y; k++) {
                    sum += first.source[i][k] * second.source[k][j];
                }
                result.source[i][j] = sum;
            }
        }
        result.repair();

        return just(result);
    }

    haveCompatibleDimensions(operation, first, second) {
        switch (operation) {
            case 0:
                return first.size.y === second.size.x;
            case 1:
                return first.size.x === second.size.x && first.size.y === second.size.y;
            default: 
                return false;
        }
    }

    rref(...indices) {
        this.sources.forEach(source => { 
            if (!indices.includes(index))
                return;

            if (!source.extract().toRREF()) {
                source.stack("failed to reduce to rref");
                return;
            }

            source.did("rref");
        });
    }

    invert(...indices) {
        this.sources.forEach((source, index) => {
            if (!indices.includes(index))
                return;

            if (!source.extract().toInverse()) {
                source.did("failed to invert matrix");
                return;
            }

            source.did("invert");
        })
    }
}

function vec(...elements) {
    const proxy = new Proxy(new Vector(...elements), {
        set(vec, prop, value) {
            vec[prop] = value;
            if (names.includes(prop))
                vec.elements[names.indexOf(prop)] = value;
            return true;
        }
    })
    return just(proxy);
}

function matrix(...sources) {
    return new MatrixOperation(sources.map(source => Matrix.from(source)));
}