pragma solidity ^0.8.11;

interface IGuardian {


    function isValid(bytes32 userOpHash, bytes calldata data) external view returns(bool, uint256);
    
}