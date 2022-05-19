const NFTMarketplace = artifacts.require('NFTMarketplace')
const CleverNFT = artifacts.require('CleverNFT')
const CleverAccessNFT = artifacts.require('CleverAccessNFT')
const TUSDT = artifacts.require('TUSDT')
const TUSDC = artifacts.require('TUSDC')
const fs = require('fs')

module.exports = async function (deployer) {

  await deployer.deploy(CleverAccessNFT)
  await deployer.deploy(NFTMarketplace, CleverAccessNFT.address, CleverNFT.address);
  await deployer.deploy(CleverNFT, NFTMarketplace.address);

  await deployer.deploy(TUSDT)
  await deployer.deploy(TUSDC)

  const nftMarketplace = await NFTMarketplace.deployed()
  const tusdt = await TUSDT.deployed()
  const tusdc = await TUSDC.deployed()

  await nftMarketplace.addToken(tusdt.name(), TUSDT.address)
  await nftMarketplace.addToken(tusdc.name(), TUSDC.address)

  const nftMarketplaceAddress = await nftMarketplace.address
  const accessNFTAddressFromMarketplace = await nftMarketplace.accessNFTAddress()
  const cleverNFTAddressFromMarketplace = await nftMarketplace.cleverNFTAddress()

  await tusdt.transfer(nftMarketplace.address, "1000000000000000000000")
  await tusdc.transfer(nftMarketplace.address, "1000000000000000000000")

  const addresses = {
      "accessNFTAddress": accessNFTAddressFromMarketplace,
      "cleverNFTAddress": cleverNFTAddressFromMarketplace,
      "marketplaceAddress": nftMarketplace.address
  }

  fs.writeFileSync("./client/config.json", JSON.stringify(addresses, null, 2))

  console.log('Written to files', process.cwd())
}