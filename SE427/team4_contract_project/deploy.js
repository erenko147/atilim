const {Web3} = require("web3");
require("dotenv").config();

const fs = require("fs");
const { abi, bytecode } = JSON.parse(fs.readFileSync("TeamContract.json"));

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

  const contract = new web3.eth.Contract(abi);
  contract.options.data = "0x" + bytecode;

  const centralContractAddress = process.env.CENTRAL_CONTRACT_ADDRESS;

  const deployTx = contract.deploy({
    arguments: [centralContractAddress],
  });

  const gas = await deployTx.estimateGas();
  const gasPrice = await web3.eth.getGasPrice();

  const gasLimit = 3000000; // Set gas limit to 3,000,000

const deployedContract = await deployTx
  .send({
    from: signer.address,
    gas: gasLimit,
    gasPrice,
  })
  .once("transactionHash", (txhash) => {
    console.log(`Mining deployment transaction ...`);
    console.log(`https://${network}.etherscan.io/tx/${txhash}`);
  });


  console.log(`Contract deployed at ${deployedContract.options.address}`);
  console.log(
    `Add TEAM_CONTRACT_ADDRESS to the .env file: ${deployedContract.options.address}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
