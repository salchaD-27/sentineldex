// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken2 is ERC20, Ownable {
    constructor() ERC20('TestToken2', 'TT2') Ownable(msg.sender) {_mint(msg.sender, 1000*10**decimals());}
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
