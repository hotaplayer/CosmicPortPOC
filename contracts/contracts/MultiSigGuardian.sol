pragma solidity ^0.8.11;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./IGuardian.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

contract MultiSigGardian is Ownable, IGuardian {
    using ECDSA for bytes32;

    mapping(address=>bool) public voters;
    uint8 public threshold;

    //Owner is the AA wallet
    constructor(address _owner, address[] memory _voters, uint8 _threshold){
        _transferOwnership(_owner);
        for (uint i=0;i<_voters.length;i++){
            voters[_voters[i]] = true;
        }
        threshold = _threshold;
    }

    function isValid(bytes32 userOpHash, bytes calldata data) external override view returns(bool, uint256){
        userOpHash = userOpHash.toEthSignedMessageHash();
        uint validCount = 0;
        for(uint i=0;i<data.length;i+=85){
            (bytes memory signature, address signer) = _extractSignature(data, i);
            if (!voters[signer]){
                continue;
            }
            if(SignatureChecker.isValidSignatureNow(signer, userOpHash, signature)){
                if(++validCount >= threshold){
                    return (true, 0);
                }
            }
        }
        return (false, 0);
    }
    
    function _extractSignature(bytes calldata data, uint256 offset) internal pure returns(bytes memory signature, address signer){
        assembly {
            let position := add(data.offset, offset)
            signature := mload(0x40)
            mstore(signature, 65)
            calldatacopy(add(signature,0x20), position, 65)
            mstore(0x40, add(add(signature, 0x20), 65))

            position := add(position, 65)
            signer := calldataload(sub(position,12))
        }
    }


}