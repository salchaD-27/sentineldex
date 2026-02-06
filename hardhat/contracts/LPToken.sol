// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LPToken is ERC20 {
    address public pool;
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {pool = msg.sender;}

    modifier onlyPool() {
        require(msg.sender == pool, "Only pool");
        _;
    }
    function mint(address to, uint256 amount) external onlyPool {_mint(to, amount);}
    function burn(address from, uint256 amount) external onlyPool {_burn(from, amount);}
}