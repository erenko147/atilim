const {Web3} = require("web3");
require("dotenv").config();
const fs = require("fs");

async function main() {
  // Load environment variables
  const network = process.env.ETHEREUM_NETWORK;
  const INFURA_API_KEY = process.env.INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
  const TEAM_CONTRACT_ADDRESS = process.env.TEAM_CONTRACT_ADDRESS;
  const CENTRAL_CONTRACT_ADDRESS = process.env.CENTRAL_CONTRACT_ADDRESS;

  // Initialize Web3 provider
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${INFURA_API_KEY}`
    )
  );

  // Create a signer account from the team's private key
  const signer = web3.eth.accounts.privateKeyToAccount(
    SIGNER_PRIVATE_KEY.startsWith("0x")
      ? SIGNER_PRIVATE_KEY
      : "0x" + SIGNER_PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(signer);

  // Load your team contract's ABI
  const { abi } = JSON.parse(fs.readFileSync("TeamContract.json"));

  // Load the central contract's ABI
  const centralContractABI = JSON.parse(fs.readFileSync("centralContractABI.json"));

  // Create a contract instance of your TeamContract
  const teamContract = new web3.eth.Contract(abi, TEAM_CONTRACT_ADDRESS);

  // Create a contract instance of the Central Contract (HillContract)
  const centralContract = new web3.eth.Contract(centralContractABI, CENTRAL_CONTRACT_ADDRESS);

  // Get your team number from the central contract
  const myTeamNumber = await centralContract.methods
    .getMyTeamNumber()
    .call({ from: signer.address });

  if (Number(myTeamNumber) === -1) {
    console.log(`Your account (${signer.address}) is not associated with any team.`);
  } else {
    console.log(`Your account (${signer.address}) is associated with Team ${myTeamNumber}.`);
  }

  // Display cell occupation status
  console.log("\nCell Occupation Status:");
  const gridSize = 10; // Assuming a 10x10 grid
/*
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const cellTeamNumber = await centralContract.methods
        .getCellTeamNumber(x, y)
        .call();
      
      if (Number(cellTeamNumber) === -1) {
        console.log(`Cell (${x}, ${y}) is unowned.`);
      } else {
        console.log(`Cell (${x}, ${y}) is owned by Team ${cellTeamNumber}.`);
      }
    }
  }
*/
  // Call getter functions
  const totalCalls = await teamContract.methods.getTotalCalls().call();
  console.log(`\nTotal Calls to Central Contract: ${totalCalls}`);

  const myTeamCount = await teamContract.methods.getMyTeamCount().call();
  console.log(`Cells Owned by My Team: ${myTeamCount}`);

  const leaderBoardCalls = await teamContract.methods.showLeaderBoard_Calls().call();
  console.log(`Leaderboard (Calls):\n${leaderBoardCalls}`);

  const leaderBoardOccupations = await teamContract.methods.showLeaderBoard_Occupations().call();
  console.log(`Leaderboard (Occupations):\n${leaderBoardOccupations}`);

  const leaderBoard = await teamContract.methods.showLeaderBoard().call();
  console.log(`General Leaderboard:\n${leaderBoard}`);

  const myTeamContractAddress = await teamContract.methods.getMyTeamContract().call();
  console.log(`My Team Contract Address Registered in Central Contract: ${myTeamContractAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
