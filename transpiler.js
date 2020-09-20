"use strict"
/*
TODO: Add functions before, end; maybe after, beginning with the following syntax:
    matchState {
        1,_,0,1,_
        _,1,_,0,1
        &gt;,-,-,&gt;,&lt;
        end(5,2,3) then newState
    }
    or
    matchState {
        1,_,0,1,_
        _,1,_,0,1
        &gt;,-,-,&gt;,&lt;
        end(5,2,3) -> newState
    }
    or
    matchState {
        1,_,0,1,_
        _,1,_,0,1
        &gt;,-,-,&gt;,&lt;
        end(5,2,3) => newState
    }
    or
    matchState {
        1,_,0,1,_
        _,1,_,0,1
        &gt;,-,-,&gt;,&lt;
        end(5,2,3) | newState
    }
    where function is end(numRegistersTotal, ...registersToChange)
    which internally sorts registersToChange and then just adds a new state end-2-3 if it doesn't exist already
    and the end command of that state is newState.
    Allow chaining multiple of these together.
    The proper implementation is not regex but split on "->" or "=>" or "|" and check the array length.
    If length is 0, continue with old implementation; otherwise trim and then regex match /(\w)(\(((?:\d,)+)\))/
    This \w works because we define the function names, not them.
 */

const pipe = "->";
let usedAlgorithms = [];

const generateAllStrings = n => {
    if (n === 1) {
        return [[0], [1], ["_"]];
    }

    const prev = generateAllStrings(n - 1);
    return prev.map(string => [0, ...string])
        .concat(prev.map(string => [1, ...string]))
        .concat(prev.map(string => ["_", ...string]));
}

const directions_end = (string, numTapes, tapes) => {
    let directions = [];
    let accept = true;

    for (let i = 1; i <= numTapes; i++) {
        if (tapes.includes(i)) {
            if (string[i - 1] === "_") {
                directions.push(null);
            } else {
                accept = false;
                directions.push(">")
            }
        } else {
            directions.push("-");
        }
    }
    return {directions, accept};
}

const directions_start = (string, numTapes, tapes) => {
    let {directions, accept} = directions_end(string, numTapes, tapes);
    directions = directions.map(direction => direction === ">" ? "<" : direction);
    return {directions, accept};
}

const end = (name, nextState, numTapes, ...tapes) => {
    name = name || `end-${tapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Go to end of tapes ${tapes}`, `${name} {`, ""];

    const strings = generateAllStrings(numTapes);
    for (const string of strings) {
        const tapeList = string.join(",")
        code.push(tapeList);
        code.push(tapeList);

        let {directions, accept} = directions_end(string, numTapes, tapes);
        directions = directions.map(direction => direction === null ? accept ? "<" : "-" : direction);
        code.push(directions.join(","));
        code.push(accept ? nextState : name);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}

const after = (name, nextState, numTapes, ...tapes) => {
    name = name || `after-${tapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Go past the end of tapes ${tapes}`, `${name} {`, ""];

    const strings = generateAllStrings(numTapes);
    for (const string of strings) {
        const tapeList = string.join(",")
        code.push(tapeList);
        code.push(tapeList);

        let {directions, accept} = directions_end(string, numTapes, tapes);
        directions = directions.map(direction => direction === null ? "-" : direction);
        code.push(directions.join(","));
        code.push(accept ? nextState : name);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");

    return {code, name};
}

// copies moving from existing spot rightwards
const copyRight = (name, nextState, numTapes, sourceTape, ...destinationTapes) => {
    name = name || `copyRight-${sourceTape}-${destinationTapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Copy tape ${sourceTape} to tapes ${destinationTapes}`, `${name} {`, ""];

    const strings = generateAllStrings(numTapes);
    for (const string of strings) {
        code.push(string.join(","));

        for (const destinationTape of destinationTapes) {
            string[destinationTape - 1] = string[sourceTape - 1];
        }
        code.push(string.join(","));

        let {directions, accept} = directions_end(string, numTapes, [sourceTape]);
        directions = directions.map(direction => direction === null ? accept ? "<" : "-" : direction);
        for (const destinationTape of destinationTapes) {
            directions[destinationTape - 1] = directions[sourceTape - 1];
        }
        code.push(directions.join(","));
        code.push(accept ? nextState : name);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}

// copies moving from existing spot rightwards but without backtracking at the end
const copyRightAfter = (name, nextState, numTapes, sourceTape, ...destinationTapes) => {
    name = name || `copyRight-${sourceTape}-${destinationTapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Copy tape ${sourceTape} to tapes ${destinationTapes}`, `${name} {`, ""];

    const strings = generateAllStrings(numTapes);
    for (const string of strings) {
        code.push(string.join(","));

        for (const destinationTape of destinationTapes) {
            string[destinationTape - 1] = string[sourceTape - 1];
        }
        code.push(string.join(","));

        let {directions, accept} = directions_end(string, numTapes, [sourceTape]);
        directions = directions.map(direction => direction === null ? "-" : direction);
        for (const destinationTape of destinationTapes) {
            directions[destinationTape - 1] = directions[sourceTape - 1];
        }
        code.push(directions.join(","));
        code.push(accept ? nextState : name);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}

const addLeft = (customName, nextState, numTapes, destinationTape, sourceTape1, sourceTape2) => {
    const name = customName || `addLeft-${destinationTape}-${sourceTape1}-${sourceTape2}-${nextState}`;
    const carryState = customName ? `${customName}-carry` : `addLeftCarry-${destinationTape}-${sourceTape1}-${sourceTape2}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Add ${sourceTape1} and ${sourceTape2} to tape ${destinationTape} moving leftward`, `${name} {`, ""];


    for (const string of generateAllStrings(numTapes)) {
        code.push(string.join(","));

        let blanks = 0;
        let sum = 0;

        if (string[sourceTape1 - 1] === 1) {
            sum++;
        }
        if (string[sourceTape2 - 1] === 1) {
            sum++;
        }
        if (string[sourceTape1 - 1] === "_") {
            blanks++;
        }
        if (string[sourceTape2 - 1] === "_") {
            blanks++;
        }

        let accept = false;
        let directions = "-".repeat(numTapes).split("");

        if (blanks === 2) {
            accept = true;
            directions[sourceTape1 - 1] = directions[sourceTape2 - 1] = directions[destinationTape - 1] = ">";
        } else {
            string[destinationTape - 1] = sum % 2;
            directions[sourceTape1 - 1] = directions[sourceTape2 - 1] = directions[destinationTape - 1] = "<";
        }

        code.push(string.join(","));
        code.push(directions.join(","));

        code.push(accept ? nextState : sum > 1 ? carryState : name);
        code.push("");
    }

    code.push("}");
    code.push("");
    code.push("");

    code = [...code, `// Carry state for add ${sourceTape1} and ${sourceTape2} to tape ${destinationTape} moving leftward`, `${carryState} {`, ""];

    for (const string of generateAllStrings(numTapes)) {
        code.push(string.join(","));

        let blanks = 0;
        let sum = 1;

        if (string[sourceTape1 - 1] === 1) {
            sum++;
        }
        if (string[sourceTape2 - 1] === 1) {
            sum++;
        }
        if (string[sourceTape1 - 1] === "_") {
            blanks++;
        }
        if (string[sourceTape2 - 1] === "_") {
            blanks++;
        }

        string[destinationTape - 1] = sum % 2;
        code.push(string.join(","));

        let accept = false;
        let directions = "-".repeat(numTapes).split("");

        if (blanks === 2) {
            accept = true;
            directions[sourceTape1 - 1] = directions[sourceTape2 - 1] = directions[destinationTape - 1] = ">";
        } else {
            directions[sourceTape1 - 1] = directions[sourceTape2 - 1] = directions[destinationTape - 1] = "<";
        }

        code.push(directions.join(","));

        code.push(accept ? nextState : sum > 1 ? carryState : name);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}

const left = (name, nextState, numTapes, ...tapes) => {
    name = name || `left-${tapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Move tapes ${tapes.join(", ")} left`, `${name} {`, ""];

    for (const string of generateAllStrings(numTapes)) {
        code.push(string.join(","));
        code.push(string.join(","));

        let directions = "-".repeat(numTapes).split("");
        for (const tape of tapes) {
            directions[tape - 1] = "<";
        }
        code.push(directions.join(","));
        code.push(nextState);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}

const right = (name, nextState, numTapes, ...tapes) => {
    name = name || `right-${tapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Move tapes ${tapes.join(", ")} right`, `${name} {`, ""];

    for (const string of generateAllStrings(numTapes)) {
        code.push(string.join(","));
        code.push(string.join(","));

        let directions = "-".repeat(numTapes).split("");
        for (const tape of tapes) {
            directions[tape - 1] = ">";
        }
        code.push(directions.join(","));
        code.push(nextState);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}
const appendZero = (name, nextState, numTapes, ...tapes) => {
    name = name || `appendZero-${tapes.join("-")}-${nextState}`;

    if (usedAlgorithms.includes(name)) {
        return {name, code: []};
    }

    usedAlgorithms.push(name)

    let code = [`// Double the value at tapes ${tapes.join(", ")} assuming after`, `${name} {`, ""];

    for (const string of generateAllStrings(numTapes)) {
        code.push(string.join(","));

        for (const tape of tapes) {
            string[tape - 1] = "0";
        }

        code.push(string.join(","));

        let directions = "-".repeat(numTapes).split("");
        for (const tape of tapes) {
            directions[tape - 1] = ">";
        }
        code.push(directions.join(","));
        code.push(nextState);
        code.push("");
    }
    code.push("}");
    code.push("");
    code.push("");
    return {code, name};
}


const transpile = code => {
    let state;
    let lineIndex = 0;
    let lines = code.split("\n").map(line => line.trim());
    let runningLine;
    let transpiledCode = [];
    let stack = 0;

    lines.forEach((line, index) => {
        try {
            const [match, functionName] = line.match("^([a-zA-Z0-9-_]+) {$") || [null];
            if (functionName) {
                state = functionName;
                stack = 1;
            } else if (line === "" || line.includes(":") || line.includes("//")) {
                transpiledCode.push(line);
            } else if (stack !== 1) {
                if (line.includes("=")) {
                    let [match, functionName, code] = line.match("^([a-zA-Z0-9-_]+) = (.+)$");
                    code = code.split(pipe);
                    let algorithm = generateAlgorithm(code.shift().trim(), code.join(pipe).trim(), functionName);
                    transpiledCode = [...algorithm.code, ...transpiledCode];
                } else {
                    transpiledCode.push(line);
                }
            } else if (line === "}") {
                stack = 0;
            } else {
                switch (lineIndex++ % 4) {
                    case 0:
                        transpiledCode.push(`${state},${line}`);
                        break;
                    case 1:
                        runningLine = line;
                        break;
                    case 2:
                        runningLine += `,${line}`;
                        break;
                    case 3:
                        let actions = line.split(pipe);
                        if (actions.length === 1) {
                            transpiledCode.push(`${line},${runningLine}`);
                        } else {
                            let algorithm = generateAlgorithm(actions.shift().trim(), actions.join(pipe).trim());
                            transpiledCode = [...algorithm.code, ...transpiledCode, `${algorithm.name},${runningLine}`];
                        }
                }
            }
        } catch (e) {
            console.error(`Error in state ${state}, lineNumber ${index}, line ${line}, lineIndex ${lineIndex}`);
        }
    });
    usedAlgorithms.length = 0;
    return transpiledCode.join("\n");
}


const generateAlgorithm = (code, next, customName) => {
    let [match, name, params] = code.match(/^(\w+)\(((?:\d+,? ?)+)+\)$/);
    params = params.split(",")
        .map(param => +param); // convert to integer

    let args = [customName, next, ...params];
    switch (name) {
        case "end":
            return end(...args);
        case "after":
            return after(...args);
        case "copyRight":
            return copyRight(...args);
        case "copyRightAfter":
            return copyRightAfter(...args);
        case "addLeft":
            return addLeft(...args);
        case "left":
            return left(...args);
        case "right":
            return right(...args);
        case "appendZero":
            return appendZero(...args);
    }

}

module.exports = transpile;
