pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template KycValidation() {
    //private inputs
    signal input authCode;
    signal input userSecret;
    signal input userPassword;

    //public inputs
    signal input authCodeHash;
    signal input userSoulHash;
    signal input expiration;
    signal input seqNo;

    //output
    signal output out;

    //Verify authCode and userSecret
    component challenge1 = Poseidon(1);
    challenge1.inputs[0] <== authCode;
    log(challenge1.out);
    log(authCodeHash);
    challenge1.out === authCodeHash;

    
    component challenge2 = Poseidon(2);
    challenge2.inputs[0] <== userPassword;
    challenge2.inputs[1] <== userSecret;
    challenge2.out === userSoulHash;
    
    
    //Verify seqNo matches call context
    component challenge3 = Poseidon(3);
    challenge3.inputs[0] <== authCodeHash;
    challenge3.inputs[1] <== userSoulHash;
    challenge3.inputs[2] <== expiration;
    challenge3.out === seqNo;

    out <== 0;
}


component main {public [authCode, authCodeHash,userSoulHash,expiration, seqNo]}=  KycValidation();
