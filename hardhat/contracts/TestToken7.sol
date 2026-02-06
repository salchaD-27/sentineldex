// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken7 is ERC20 {
    constructor() ERC20('TestToken7', 'TT7') {_mint(msg.sender, 1000*10**decimals());}
}