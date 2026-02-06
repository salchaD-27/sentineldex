// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken2 is ERC20 {
    constructor() ERC20('TestToken2', 'TT2') {_mint(msg.sender, 1000*10**decimals());}
}