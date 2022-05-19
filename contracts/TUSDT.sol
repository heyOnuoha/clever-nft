// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TUSDT is ERC20, Ownable {

    constructor() ERC20("Test USDT", "TUSDT") {
        _mint(msg.sender, 10000000000 * 10 ** 18);
    }
}