// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestToken6 is ERC20, Ownable {
    constructor() ERC20('TestToken6', 'TT6') Ownable(msg.sender) {_mint(msg.sender, 1000*10**decimals());}
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
