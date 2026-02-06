// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import './LPToken.sol';

contract DEXPool{
    // data strucs
    bool private _bootstrap = true;
    address public token0;
    address public token1;
    LPToken public lpTokenAddress;
    
    uint256 private reserve0 = 0;
    uint256 private reserve1 = 0;
    
    uint256 public constant FEE_BPS = 30;
    uint256 private constant BPS = 10_000;
    
    // caching erc20 interfaces is cheaper, 'immutable' saves gas
    IERC20 public immutable token0ERC20;
    IERC20 public immutable token1ERC20;
    address public immutable factory;

    constructor(address _token0, address _token1, address _factory){
        require(_token0 != _token1, "Identical tokens");
        token0 = _token0;
        token1 = _token1;
        factory = _factory;
        token0ERC20 = IERC20(token0);
        token1ERC20 = IERC20(token1);

        string memory name = string(abi.encodePacked("DEX LP ", _symbol(token0), "/", _symbol(token1)));
        string memory symbol = string(abi.encodePacked("DLP-", _symbol(token0), "-", _symbol(token1)));
        lpTokenAddress = new LPToken(name, symbol);
    }

    // events
    event LiquidityAdded(address indexed provider, uint256 amountToken0, uint256 amountToken1, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountToken0, uint256 amountToken1, uint256 liquidityBurned);
    event LiquiditySwapped(address indexed provider, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    // helpers
    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0){z = 1;}
    }

    function _symbol(address token) internal view returns (string memory) {
        try IERC20Metadata(token).symbol() returns (string memory s) {return s;}
        catch{return "UNK";}
    }
    
    // funcs
    function getReserves() external view returns (uint256, uint256){return (reserve0, reserve1);}
    
    function addLiquidity(uint256 amountToken0, uint256 amountToken1) external {
        require(amountToken0 > 0 && amountToken1 > 0, "Zero liquidity");
        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;
        token0ERC20.transferFrom(msg.sender, address(this), amountToken0);
        token1ERC20.transferFrom(msg.sender, address(this), amountToken1);
        uint256 liquidity;

        if(_bootstrap){
            liquidity = _sqrt(amountToken0 * amountToken1);
            require(liquidity > 0, "Insufficient liquidity");
            _bootstrap = false;
        }else{
            uint256 totalSupply = lpTokenAddress.totalSupply();
            uint256 liquidity0 = (amountToken0 * totalSupply) / _reserve0;
            uint256 liquidity1 = (amountToken1 * totalSupply) / _reserve1;
            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
            require(liquidity > 0, "Insufficient liquidity");
        }

        lpTokenAddress.mint(msg.sender, liquidity);
        reserve0 = token0ERC20.balanceOf(address(this));
        reserve1 = token1ERC20.balanceOf(address(this));
        emit LiquidityAdded(msg.sender, amountToken0, amountToken1, liquidity);
    }

    function removeLiquidity(uint256 liquidity) external {
        require(liquidity > 0, "Zero liquidity");
        uint256 totalSupply = lpTokenAddress.totalSupply();
        uint256 amountToken0 = (liquidity * reserve0) / totalSupply;
        uint256 amountToken1 = (liquidity * reserve1) / totalSupply;
        require(amountToken0 > 0 && amountToken1 > 0, "Insufficient output");

        lpTokenAddress.burn(msg.sender, liquidity);
        token0ERC20.transfer(msg.sender, amountToken0);
        token1ERC20.transfer(msg.sender, amountToken1);
        reserve0 = token0ERC20.balanceOf(address(this));
        reserve1 = token1ERC20.balanceOf(address(this));
        emit LiquidityRemoved(msg.sender, amountToken0, amountToken1, liquidity);
    }
    
    function swap(address tokenIn, uint256 amountIn) external {
        require(amountIn > 0, "Zero input");
        require(tokenIn == token0 || tokenIn == token1, "Invalid token");
        
        bool in0out1 = tokenIn == token0;
        (IERC20 tokenInERC20, IERC20 tokenOutERC20) = in0out1 ? (token0ERC20, token1ERC20) : (token1ERC20, token0ERC20);
        (uint256 reserveIn, uint256 reserveOut) = in0out1 ? (reserve0, reserve1) : (reserve1, reserve0);
        tokenInERC20.transferFrom(msg.sender, address(this), amountIn);
        uint256 amountInWithFee = (amountIn * (BPS - FEE_BPS))/BPS;
        uint256 amountOut = (amountInWithFee * reserveOut)/(reserveIn + amountInWithFee);
        require(amountOut > 0, "Insufficient output");

        tokenOutERC20.transfer(msg.sender, amountOut);
        reserve0 = token0ERC20.balanceOf(address(this));
        reserve1 = token1ERC20.balanceOf(address(this));
        emit LiquiditySwapped(msg.sender, tokenIn, amountIn, in0out1 ? token1 : token0, amountOut);
    }
}