require('dotenv').config()
const path = require("path")

const HDWalletProvider = require("@truffle/hdwallet-provider")

const mnemonic = "core echo funny cost gospel witness poem unfold scrub denial blast opinion"

module.exports = {
  contracts_build_directory: path.join(__dirname, "client/contracts"),
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/3ba0bf7fd3544b2081fdad86e24d8867");
      },
      network_id: 0x4,
      gas: "10000000",
      from: "0x5ef6D73f8E87c01911A06660Cc41d648d60dc84b"
    }
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  },
  plugins: ['truffle-plugin-verify'],
  compilers: {
    solc: {
      version: "0.8.7",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        },
        //evmVersion: "byzantium"
      }
    }
  },
}
