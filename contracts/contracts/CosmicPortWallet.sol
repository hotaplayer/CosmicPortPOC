pragma solidity ^0.8.13;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ZKVerifier.sol";
import "./MultiSigGuardian.sol";

contract CosmicPortWallet is IAccount {

    using UserOperationLib for UserOperation;
    using ECDSA for bytes32;


    address payable public entryPoint;
    address public guardian;
    bytes32 public soulHash;
    address public authService;
    bytes32 public latestSeqNo;
    bytes32 public latestAuthCodeHash;
    uint256 public transferThreshold;


    KYCVerifier kycVerifier;
    SoulVerifier soulVerifier;
    
    uint256 private constant SIG_VALIDATION_FAILED = 1;
    
    modifier authorized() {
        require(msg.sender == address(this) || msg.sender== entryPoint || msg.sender == guardian, "Invalid user");
        _;
    }


    constructor(address payable _entryPoint,bytes32 _soulHash, address _authService, address _guardian) {
        entryPoint = _entryPoint;
        soulHash = _soulHash;
        authService = _authService;
        transferThreshold = type(uint256).max;
        kycVerifier = new KYCVerifier();
        soulVerifier = new SoulVerifier();
        guardian = _guardian;
    }
    

    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, address, uint256 missingAccountFunds)
    external returns (uint256 validationData) {
        require(msg.sender == entryPoint, "Invalid caller");
        uint256 validUntil = 0;
        try this.validateUserSignature(userOp, userOpHash) returns(bool valid,uint256 expiration){
            if (!valid){
                return SIG_VALIDATION_FAILED;
            }
            validUntil = uint48(expiration) << 160;
        }
        catch(bytes memory){
            return SIG_VALIDATION_FAILED;
        }
        if (missingAccountFunds != 0){
            (bool success,) = entryPoint.call{value: missingAccountFunds}("");
            //require(success);//No need to judge
        }
        return validUntil;
    }

    function updateAuthCodeHash(bytes32 _seqNo, bytes32 _authCodeHash) external {
        require(msg.sender == authService, "Only auth service");
        latestSeqNo = _seqNo;
        latestAuthCodeHash = _authCodeHash;
    }


    function execute(address to, bytes calldata data, uint256 value) external {
        require(value <= transferThreshold, "exceed transfer threshold");
        (bool success, ) = to.call{value: value}(data);    
        require(success, "Execution failed");
    }


    function updateEntryPoint(address payable _newEntryPoint) external authorized {
        entryPoint = _newEntryPoint;
    }

    //In case of loosing password or secret
    function updateUserSoulHash(bytes32 _newSoulHash) external authorized {
        soulHash = _newSoulHash;
    }

    function updateTransferThreshold(uint256 _newThreshold) external authorized {
        transferThreshold = _newThreshold;
    }

    function updateAuthService(address _newAuthService) external authorized {
        authService = _newAuthService;
    }

    function updateGuardian(address _newGuardian) external authorized {
        guardian = _newGuardian;
    }

    receive() external payable{
        
    }

    function withdraw(address payable to, uint256 amount) external {
        to.transfer(amount);
    }

    //signature
    function validateUserSignature(UserOperation calldata userOp, bytes32 userOpHash) public view returns(bool success, uint256 expiration){
        bytes calldata signature = userOp.signature;
        return _validateKyc(signature);
    }

    function _validateKyc(bytes calldata signature) internal view returns(bool success, uint256 expiration){
        //1. Decoding
        (uint[2] memory pA, uint[2][2] memory pB, uint[2] memory pC, uint[6] memory pubSignals)
        = abi.decode(signature, (uint[2],uint[2][2], uint[2],uint[6]));
        
        //2. Verify public signals
        //authCode, authCodeHash,userSoulHash,expiration, seqNo
        // bytes32 authCode = bytes32(pubSignals[1]);
        bytes32 authCodeHash = bytes32(pubSignals[2]);
        bytes32 userSoulHash = bytes32(pubSignals[3]);
        expiration = pubSignals[4];//TODO: we may check the sanity of expiration but we cannot use block.timestamp so we need circuit modification
        bytes32 seqNo = bytes32(pubSignals[5]);

        require(seqNo == latestSeqNo, "Invalid seqNo");
        require(authCodeHash == latestAuthCodeHash, "Invalid authCodeHash");
        require(soulHash == userSoulHash, "Invalid userSoulHash");

        //3. Verify proof
        success = kycVerifier.verifyProof(pA, pB, pC, pubSignals);

    }

    function validateUserSoul(bytes calldata proof) external view{
        //TODO: need a nonce to prevent relay
        //Decoding
        (uint[2] memory pA, uint[2][2] memory pB, uint[2] memory pC, uint[2] memory pubSignals)
        = abi.decode(proof, (uint[2],uint[2][2], uint[2],uint[2]));
        
        //Verify public signals
        bytes32 publicSoulHash = bytes32(pubSignals[1]);
        require(publicSoulHash == soulHash, "Invalid soul hash");

        //Verify proof
        bool proofValidation = soulVerifier.verifyProof(pA, pB, pC, pubSignals);
        require(proofValidation, "Proof validation failed");

    }
}

