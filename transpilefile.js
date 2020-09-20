const fs = require("fs");
const transpile = require("./transpiler");

const transpileFile = (fileName, destinationFileName) => {
    const program = fs.readFileSync(fileName).toString();
    fs.writeFile(destinationFileName || fileName.replace(".turing", ".transpiled.turing"),
        transpile(transpile(program).join("\n")).join("\n"), console.log);
}

transpileFile(process.argv[2], process.argv[3]);
