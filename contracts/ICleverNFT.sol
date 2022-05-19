// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

abstract contract ICleverNFT is ERC721URIStorage {

    function mint(address patchUser, string memory metaDataURI) public virtual returns (uint256);
}