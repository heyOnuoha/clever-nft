// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CleverAccessNFT is ERC721Enumerable, Ownable {

    using Strings for uint256;
    address public contractOwner;
    bool public paused = false;
    uint256 public mintPrice = 0.01 ether;
    uint256 public maxNFTHolding = 1;
    string private baseURI = "https://api.jsonbin.io/b/61b6393b01558c731cd307cd";
    using Counters for Counters.Counter;

    Counters.Counter counter;

    constructor() ERC721 ("CleverAccessNFT", "XCLEV") {

        contractOwner = msg.sender;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {

        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return baseURI;
    }

    function mint() external payable {

        require(!paused, "Contract paused");
        require(msg.value >= mintPrice, "Insufficient funds");
        require(balanceOf(msg.sender) < maxNFTHolding, "Max NFT holding reached");
        
        _mint(msg.sender, counter.current());
        counter.increment();
    }

    function getBaseURI() public onlyOwner view returns (string memory) {

        return baseURI;
    }

    function getMintPrice() public view returns (uint256) {

        return mintPrice;
    }

    function _baseURI() internal view override returns (string memory) { return baseURI; }

    function setBaseURI(string memory baseURI_) external onlyOwner { baseURI = baseURI_; }

    function setMintPrice (uint256 _newPrice) external onlyOwner { mintPrice = _newPrice; }
    function setMaxNFTHolding(uint256 _newMax) external onlyOwner { maxNFTHolding = _newMax; }

    function setPaused (bool _pausedState) external onlyOwner { paused = _pausedState; }

    function getContractBalance () external view onlyOwner returns (uint256) { return address(this).balance; }

    function changeTreasury(address payable _newWallet) external onlyOwner { contractOwner = _newWallet; }

    function exists(uint256 tokenId) public view returns (bool) { return _exists(tokenId); }

    function withdraw() public payable onlyOwner {
        (bool os, ) = payable(contractOwner).call{value: address(this).balance}("");
        require(os);
    }
}