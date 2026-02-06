// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './DEXPool.sol';

contract DEXFactory{
    // data strucs
    mapping (address => mapping(address => address)) public pools;

    // events
    event PoolCreated(address indexed token0, address indexed token1, address pool);
    
    // funcs
    function _isContractERC20(address token) internal view returns (bool) {
        if (token.code.length == 0) return false;
        try IERC20(token).totalSupply() returns (uint256) {return true;}
        catch {return false;}
    }

    function _sortTokens(address token0, address token1) internal pure returns (address, address){
        require(token0 != token1, "Identical tokens");
        return token0<token1 ? (token0, token1) : (token1, token0);
    }

    function createPool(address token0, address token1) external {
        require(_isContractERC20(token0), 'Token0 is not ERC20');
        require(_isContractERC20(token1), 'Token1 is not ERC20');
        (address _token0, address _token1) = _sortTokens(token0, token1);
        require(pools[_token0][_token1] == address(0), "Pool already exists");

        address pool = address(new DEXPool(_token0, _token1, address(this)));
        pools[_token0][_token1] = pool;
        emit PoolCreated(_token0, _token1, pool);
    }
}