// occupyCells.js

const { Web3 } = require("web3");
require("dotenv").config();
const fs = require("fs");

async function main() {
  const network = process.env.ETHEREUM_NETWORK;
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
    )
  );
  const signer = web3.eth.accounts.privateKeyToAccount(
    process.env.SIGNER_PRIVATE_KEY.startsWith("0x")
      ? process.env.SIGNER_PRIVATE_KEY
      : "0x" + process.env.SIGNER_PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(signer);

  // Load ABIs
  const { abi } = JSON.parse(fs.readFileSync("TeamContract.json"));
  const teamContract = new web3.eth.Contract(abi, process.env.TEAM_CONTRACT_ADDRESS);

  const centralContractABI = JSON.parse(fs.readFileSync("centralContractABI.json"));
  const centralContract = new web3.eth.Contract(
    centralContractABI,
    process.env.CENTRAL_CONTRACT_ADDRESS
  );

  const gridSize = 10; // Define grid size (e.g., 10x10)

  // Fetch and process all cell data
  const cellData = await centralContract.methods.getCellData(0, 0, gridSize).call();
  const { hashes, ranks, uppers, teamNumbers } = cellData;

  const myTeamNumber = await centralContract.methods.getMyTeamNumber().call({ from: signer.address });

  const cells = hashes.map((hash, index) => ({
    x: Math.floor(index / gridSize),
    y: index % gridSize,
    hash,
    rank: ranks[index],
    upper: BigInt(uppers[index]),
    teamNumber: teamNumbers[index],
  }));

  const unoccupiedCells = cells.filter(cell => cell.teamNumber !== myTeamNumber);
  unoccupiedCells.sort((a, b) => (a.upper < b.upper ? -1 : 1));

  console.log(`Found ${unoccupiedCells.length} unoccupied cells to process.`);

  // Occupy cells
  for (const cell of unoccupiedCells) {
    console.log(`Processing cell (${cell.x}, ${cell.y}) with upper: ${cell.upper}`);
    // Implement occupyCell logic here
    // ...
  }

  console.log("Finished processing cells.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
