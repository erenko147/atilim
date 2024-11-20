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
    process.env.SIGNER_PRIVATE_KEY.startsWith("0x")
      ? process.env.SIGNER_PRIVATE_KEY
      : "0x" + process.env.SIGNER_PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(signer);

  const centralContractABI = require("./centralContractABI.json");
  const centralContract = new web3.eth.Contract(
    centralContractABI,
    process.env.CENTRAL_CONTRACT_ADDRESS
  );

  const teamContractAddress = process.env.TEAM_CONTRACT_ADDRESS;

  const tx = centralContract.methods.setMyTeamContract(teamContractAddress);

  const gas = await tx.estimateGas({ from: signer.address });
  const gasPrice = await web3.eth.getGasPrice();

  const receipt = await tx
    .send({
      from: signer.address,
      gas,
      gasPrice,
    })
    .once("transactionHash", (txhash) => {
      console.log(`Mining transaction ...`);
      console.log(`https://${network}.etherscan.io/tx/${txhash}`);
    });

  console.log(`Transaction receipt:`, receipt);
  console.log(`Your team contract address has been set in the central contract.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
