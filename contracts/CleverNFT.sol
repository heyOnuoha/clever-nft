// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./ICleverNFT.sol";

contract CleverNFT is ICleverNFT, ERC721Enumerable, Ownable {
    
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;

    address public marketplaceAddress;

    constructor(address marketplaceAddress_) ERC721 ("CleverNFT", "CleverNFT")  {
        marketplaceAddress = marketplaceAddress_;
    }   

    function mint(address patchUser, string memory metaDataURI) public override returns (uint256) {

        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(patchUser, newItemId);
        _setTokenURI(newItemId, metaDataURI);

        return newItemId;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override
    {
        _transfer(from, to, tokenId);
    }
}