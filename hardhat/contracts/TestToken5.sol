// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken5 is ERC20 {
    constructor() ERC20('TestToken5', 'TT5') {_mint(msg.sender, 1000*10**decimals());}
}