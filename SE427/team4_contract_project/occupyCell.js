const {Web3} = require("web3");
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
    process.env.SIGNER_PRIVATE_KEY.startsWith('0x')
      ? process.env.SIGNER_PRIVATE_KEY
      : '0x' + process.env.SIGNER_PRIVATE_KEY
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

  const x = 6; // Specify x coordinate
  const y = 9; // Specify y coordinate

  const hash = await centralContract.methods.getCellHash(x, y).call();
  const rank = await centralContract.methods.getCellRank(x, y).call();
  const upper = await centralContract.methods.getCellUpper(x, y).call();
  const teamNumber = await centralContract.methods.getCellTeamNumber(x, y).call();

  const myTeamNumber = await centralContract.methods
    .getMyTeamNumber()
    .call({ from: signer.address });

  console.log(`Cell Data:
    Hash: ${hash}
    Rank: ${rank}
    Upper: ${upper}
    TeamNumber: ${teamNumber}
  `);

  console.log(`My Team Number: ${myTeamNumber}`);

  const upperValue = BigInt(upper);

  let nonce;
  let newUpper;
  let found = false;

  console.log("Searching for a valid nonce...");

  for (let i = 0; i < 1000000; i++) {
    nonce = web3.utils.randomHex(32);

    newUpper = web3.utils.soliditySha3(
      { type: "bytes32", value: hash },
      { type: "int256", value: rank },
      { type: "int256", value: myTeamNumber },
      { type: "bytes32", value: nonce }
    );

    const newUpperValue = BigInt(newUpper);

    if (newUpperValue > upperValue) {
      console.log(`Found valid nonce: ${nonce}`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log("Could not find a valid nonce.");
    return;
  }

  const occupyTx = teamContract.methods.occupyCell(x, y, nonce);

  const value = web3.utils.toWei("0.0001", "ether");

  const gas = await occupyTx.estimateGas({ from: signer.address, value });
  const gasPrice = await web3.eth.getGasPrice();

  const receipt = await occupyTx
    .send({
      from: signer.address,
      gas,
      gasPrice,
      value,
    })
    .once("transactionHash", (txhash) => {
      console.log(`Mining transaction ...`);
      console.log(`https://${network}.etherscan.io/tx/${txhash}`);
    });

  console.log(`Transaction receipt:`, receipt);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
