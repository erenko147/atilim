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

  const { abi } = JSON.parse(fs.readFileSync("TeamContract.json"));
  const teamContract = new web3.eth.Contract(
    abi,
    process.env.TEAM_CONTRACT_ADDRESS
  );

  const centralContractABI = require("./centralContractABI.json");
  const centralContract = new web3.eth.Contract(
    centralContractABI,
    process.env.CENTRAL_CONTRACT_ADDRESS
  );

  const gridSize = 10; // Define grid size (10x10)

  const myTeamNumber = await centralContract.methods
    .getMyTeamNumber()
    .call({ from: signer.address });

  console.log(`My Team Number: ${myTeamNumber}`);

  // Initialize nonce
  let nonce = await web3.eth.getTransactionCount(signer.address, "pending");

  // Iterate through all cells
  for (let x = 3; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      console.log(`\nProcessing cell (${x}, ${y})`);

      const teamNumber = await centralContract.methods
        .getCellTeamNumber(x, y)
        .call();

      if (Number(teamNumber) === Number(myTeamNumber)) {
        console.log(`Cell (${x}, ${y}) is already owned by your team.`);
        continue; // Skip if the cell is owned by your team
      }

      const hash = await centralContract.methods.getCellHash(x, y).call();
      const rank = await centralContract.methods.getCellRank(x, y).call();
      const upper = await centralContract.methods.getCellUpper(x, y).call();

      console.log(`Cell Data:
        Hash: ${hash}
        Rank: ${rank}
        Upper: ${upper}
        TeamNumber: ${teamNumber}
      `);

      const upperValue = BigInt(upper);
      let nonceValue;
      let newUpper;
      let found = false;

      console.log("Searching for a valid nonce...");

      for (let i = 0; i < 1000000; i++) {
        nonceValue = web3.utils.randomHex(32);

        newUpper = web3.utils.soliditySha3(
          { type: "bytes32", value: hash },
          { type: "int256", value: rank },
          { type: "int256", value: myTeamNumber },
          { type: "bytes32", value: nonceValue }
        );

        const newUpperValue = BigInt(newUpper);

        if (newUpperValue > upperValue) {
          console.log(`Found valid nonce: ${nonceValue}`);
          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`Could not find a valid nonce for cell (${x}, ${y}).`);
        continue;
      }

      // Send transaction without awaiting its completion
      const occupyTx = teamContract.methods.occupyCell(x, y, nonceValue);

      const value = web3.utils.toWei("0.0001", "ether"); // Value must be a string
      const gasEstimate = await occupyTx.estimateGas({
        from: signer.address,
        value,
      });
      const gasEstimateBN = BigInt(gasEstimate);
      const gas = gasEstimateBN;
      const gasPriceBN = BigInt(await web3.eth.getGasPrice()); // Gas price in wei

      // Send the transaction without awaiting it
      occupyTx
        .send({
          from: signer.address,
          gas: gas.toString(),
          gasPrice: gasPriceBN.toString(),
          value,
          nonce: nonce,
        })
        .once("transactionHash", (txhash) => {
          console.log(`Transaction sent: ${txhash}`);
          console.log(`https://${network}.etherscan.io/tx/${txhash}`);
        })
        .once("receipt", (receipt) => {
          console.log(`Transaction mined:`, receipt);
        })
        .on("error", (error) => {
          console.error(`Failed to occupy cell (${x}, ${y}): ${error.message}`);
        });

      // Increment nonce for the next transaction
      nonce++;
    }
  }

  console.log("Finished processing all cells.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
