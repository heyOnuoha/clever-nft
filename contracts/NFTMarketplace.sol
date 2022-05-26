//SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ICleverNFT.sol";

contract NFTMarketplace is Ownable {

    using SafeERC20 for IERC20;

    struct TokenData {
        address tokenAddress;
        string tokenName;
    }

    struct ListingItem {
        uint256 id;
        address NFTContractAddress;
        uint256 tokenId;
        address ownerAddress;
        uint256 price;
        string status;
    }

    mapping(address => TokenData) public tokens;
    mapping(address => mapping(address => bool)) public claimedTokens;
    TokenData[] public tokenList;
    ListingItem[] public listings;

    uint256 public listingCount;

    uint256 public minimumRequestableTokens = 50 ether;

    address public accessNFTAddress;
    address public cleverNFTAddress;

    ICleverNFT cleverNFT;

    event TokenAdded(address indexed tokenAddress, string tokenName);
    event TokenRemoved(address indexed tokenAddress);
    event ListingAdded(uint256 indexed listingId, address NFTContractAddress, uint256 tokenId, address indexed ownerAddress, uint256 price, string status);
    event ListingRemoved(uint256 listingId);
    event ListingBought(uint256 indexed listingId, address indexed buyerAddress, address indexed previousOwnerAddress, uint256 price);
    event TokenSwapped(address indexed tokenAddress, address indexed buyerAddress, uint256 amount, string indexed direction);
    event TokenRequested(address indexed tokenAddress, address indexed buyerAddress, uint256 amount);
    event MintCleverNFT(address indexed to);


    constructor(address accessNFTAddress_, address cleverNFTAddress_) {

        accessNFTAddress = accessNFTAddress_;
        cleverNFTAddress = cleverNFTAddress_;

        cleverNFT = ICleverNFT(cleverNFTAddress);
    }


    function addToken(string memory tokenName_, address tokenAddress_) public onlyOwner {
        
        require(tokens[tokenAddress_].tokenAddress == address(0x0), "Error: Token Already Exists");

        TokenData memory tokenData_ = TokenData({
            tokenAddress: tokenAddress_,
            tokenName: tokenName_
        });

        tokens[tokenAddress_] = tokenData_;

        tokenList.push(tokenData_);

        emit TokenAdded(tokenAddress_, tokenName_);
    }

    function getTokens() public view returns (TokenData[] memory) {
        return tokenList;
    }

    function swapTokens(address tokenAddress1, address tokenAddress2, uint256 amount) public returns (bool) {

        TokenData memory tokenData1_ = tokens[tokenAddress1];
        TokenData memory tokenData2_ = tokens[tokenAddress2];

        require(amount > 0, "Error: Amount must be greater than 0");
        require(tokenData1_.tokenAddress != address(0x0), "Error: Token not available on DEX");
        require(tokenData2_.tokenAddress != address(0x0), "Error: Token not available on DEX");
        require(tokenData1_.tokenAddress != tokenData2_.tokenAddress, "Error: Tokens are the same");
        require(IERC20(tokenData1_.tokenAddress).balanceOf(msg.sender) >= amount, "Error: Insufficient funds");
        require(IERC20(tokenData2_.tokenAddress).balanceOf(address(this)) >= amount, "Error: Treasury doesn't have enough funds");

        IERC20(tokenData1_.tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenData2_.tokenAddress).transfer(msg.sender, amount);

        emit TokenSwapped(tokenAddress1, msg.sender, amount, "IN");
        emit TokenSwapped(tokenAddress2, address(this), amount, "OUT");

        return true;
    }


    function requestTestToken(address tokenAddress_) public {

        require(tokens[tokenAddress_].tokenAddress != address(0x0), "Error: Token Does Not Exists");
        require(claimedTokens[msg.sender][tokenAddress_] == false, "Error: You have already claimed free tokens for the token");

        claimedTokens[msg.sender][tokenAddress_] = true;

        IERC20(tokenAddress_).safeTransfer(msg.sender, minimumRequestableTokens);

        emit TokenRequested(tokenAddress_, msg.sender, minimumRequestableTokens);
    }

    function listItem(address NFTContractAddress_, uint256 tokenId_, uint256 price_) public {

        address NFTAddressHolder = ERC721(NFTContractAddress_).ownerOf(tokenId_);

        require(msg.sender == NFTAddressHolder, "You do not own this NFT");

        ERC721(NFTContractAddress_).transferFrom(msg.sender, address(this), tokenId_);

        ListingItem memory listing = ListingItem({
            id: listings.length,
            NFTContractAddress: NFTContractAddress_,
            tokenId: tokenId_,
            price: price_,
            ownerAddress: msg.sender,
            status: "ACTIVE"
        });

        listingCount++;

        listings.push(listing);

        emit ListingAdded(listing.id, NFTContractAddress_, tokenId_, msg.sender, price_, "ACTIVE");
    }

    function mintCleverNFT(string memory metadata) public onlyAccessNFT {

        cleverNFT.mint(msg.sender, metadata);

        emit MintCleverNFT(msg.sender);
    }

    function unlistItem(uint256 index) public {

        require(index < listings.length, "Error: Listing does not exist");

        ListingItem memory listing = listings[index];

        require(listing.ownerAddress != address(0x0), "Id does not exists");
        require(listing.ownerAddress == msg.sender, "You do not own this listing");

        listing.status = "UNLISTED";

        listings[index] = listing;

        ERC721(listing.NFTContractAddress).transferFrom(address(this), listing.ownerAddress, listing.tokenId);

        emit ListingRemoved(index);
        
    }

    function buyNFT(uint256 index) public payable {
        
        ListingItem memory listing = listings[index];

        require(listing.ownerAddress != address(0x0), "Id does not exists");

        require(msg.value >= listing.price, "Insufficient Balance");

        (bool os, ) = payable(listing.ownerAddress).call{value: listing.price}("");

        require(os, "Transaction Failed");

        listing.ownerAddress = msg.sender;
        listing.status = "BOUGHT";

        listings[index] = listing;

        ERC721(listing.NFTContractAddress).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingBought(index, msg.sender, listing.ownerAddress, listing.price);
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {

        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b)))); 
    }

    function getListings() public view returns (ListingItem[] memory) {
        return listings;
    }

    modifier onlyAccessNFT() {

        require(ERC721(accessNFTAddress).balanceOf(msg.sender) > 0, "You do not have an access NFT");
        _;
    }
}