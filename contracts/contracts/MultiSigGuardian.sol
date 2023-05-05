pragma solidity ^0.8.11;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


//Social Recovery.
contract MultiSigGuardian {

    address public wallet;
    mapping(address=>bool) public ownerMap;
    mapping(uint256=>Transaction) public transactions;
    mapping(uint256=>mapping(address=>bool)) private votes;
    address[] public owners;
    uint8 public requirement;

    struct Transaction {
        bool executed;
        address to;
        bytes data;
        uint112 value;
        uint8 votes;
        bool success;
    }

    uint256 private transactionIdCounter;

    modifier onlyOwner {
        require(ownerMap[msg.sender], "Only owner");
        _;
    }

    modifier authorized {
        require(msg.sender == address(this) || msg.sender == wallet, "Not authorized");
        _;
    }

    //Owner is the AA wallet
    constructor(address _wallet, address[] memory _owners, uint8 _requirement){
        wallet = _wallet;
        for (uint i=0;i<_owners.length;i++){
            address _owner = _owners[i];
            ownerMap[_owner] = true;
            owners.push(_owner);
        }
        requirement = _requirement;
    }

     

    function createProposal(address to, bytes calldata data, uint256 value) external onlyOwner returns(uint256 txId){
        require(to == address(this) || to == wallet, "Invalid target");
        txId = ++transactionIdCounter;
        Transaction memory transaction = Transaction({
            to: to,
            data: data,
            executed:false,
            value: uint112(value),
            votes: 0,
            success: false
        });
        transactions[txId] = transaction;

        
    } 

    function confirm(uint256 txId) external onlyOwner returns(bool executed, bool successExecuted){
        require(txId <= transactionIdCounter, "Invalid txId");
        require(!votes[txId][msg.sender], "Dupplicate votes");
        Transaction memory transaction = transactions[txId];
        require(!transaction.executed, "already executed");
        
        votes[txId][msg.sender] = true;
        transaction.votes += 1;
        
        if(transaction.votes >= requirement){
            (successExecuted, ) = transaction.to.call{value: transaction.value}(transaction.data);
            transaction.executed = true;
            executed = true;
        }
        transactions[txId] = transaction;
    }



    function addOwner(address _owner) public authorized {
        require(!ownerMap[_owner], "already exited");
        ownerMap[_owner] = true;
        owners.push(_owner);
    }

    function removeOwner(address _owner) external authorized {
        require(ownerMap[_owner], "not exited");
        ownerMap[_owner] = false;
        for(uint i=0;i<owners.length;i++){
            if(owners[i] == _owner){
                address last = owners[owners.length - 1];
                owners[i] = last;
                owners.pop();
            }
        }
        owners.push(_owner);
    }

    function changeRequirement(uint8 _requirement) public authorized {
        requirement = _requirement;
    }
}