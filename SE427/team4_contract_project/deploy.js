const { Web3 } = require("web3");
require("dotenv").config();
const fs = require("fs");

const { abi, bytecode } = JSON.parse(fs.readFileSync("TeamContract.json"));

async function main() {
  // Validate environment variables
  if (!process.env.INFURA_API_KEY || !process.env.SIGNER_PRIVATE_KEY || !process.env.CENTRAL_CONTRACT_ADDRESS) {
    console.error("Missing required environment variables. Check .env file.");
    process.exit(1);
  }

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

  const contract = new web3.eth.Contract(abi);
  contract.options.data = "0x" + bytecode;

  const centralContractAddress = process.env.CENTRAL_CONTRACT_ADDRESS;

  const deployTx = contract.deploy({
    arguments: [centralContractAddress],
  });

  try {
    // Estimate gas and convert to BigInt for arithmetic operations
    const gas = BigInt(await deployTx.estimateGas({ from: signer.address })); // Convert to BigInt
    const gasLimit = gas + BigInt(Math.floor(Number(gas) * 0.2)); // Add 20% buffer
    const gasPrice = BigInt(await web3.eth.getGasPrice()); // Convert to BigInt

    console.log("Estimated gas:", gas.toString());
    console.log("Gas limit with buffer:", gasLimit.toString());
    console.log("Gas price:", gasPrice.toString());

    const deployedContract = await deployTx
      .send({
        from: signer.address,
        gas: Number(gasLimit), // Convert back to Number for Web3.js
        gasPrice: gasPrice.toString(), // Convert BigInt to String
      })
      .once("transactionHash", (txhash) => {
        console.log(`Transaction sent. Hash: ${txhash}`);
        console.log(`Track the transaction at https://${network}.etherscan.io/tx/${txhash}`);
      })
      .on("receipt", (receipt) => {
        console.log("Transaction confirmed. Receipt:", receipt);
      })
      .on("error", (error) => {
        console.error("Deployment failed:", error.message);
        process.exit(1);
      });

    console.log(`Contract deployed at ${deployedContract.options.address}`);
    console.log(`Add this address to the .env file as TEAM_CONTRACT_ADDRESS.`);
  } catch (error) {
    console.error("Error during deployment:", error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
