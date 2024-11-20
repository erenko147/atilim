const fs = require("fs").promises;
const solc = require("solc");

async function main() {
  const sourceCode = await fs.readFile("TeamContract.sol", "utf8");
  const { abi, bytecode } = compile(sourceCode, "TeamContract");
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  await fs.writeFile("TeamContract.json", artifact);
}

function compile(sourceCode, contractName) {
  const input = {
    language: "Solidity",
    sources: { "TeamContract.sol": { content: sourceCode } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } },
  };
  const output = solc.compile(JSON.stringify(input));
  const outputParsed = JSON.parse(output);

  if (outputParsed.errors) {
    for (const error of outputParsed.errors) {
      if (error.severity === "error") {
        console.error(error.formattedMessage);
      }
    }
    throw new Error("Compilation failed");
  }

  const artifact = outputParsed.contracts["TeamContract.sol"][contractName];
  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
