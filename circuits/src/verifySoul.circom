pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template SoulVerification() {
    //private inputs
    signal input userPassword;
    signal input userSecret;
    //public inputs
    signal input userSoulHash;

    //output
    signal output out;

    //Verify userPassword and userSecret
    component challenge2 = Poseidon(2);
    challenge2.inputs[0] <== userPassword;
    challenge2.inputs[1] <== userSecret;
    challenge2.out === userSoulHash;

    out <== 0;
}


component main {public [userSoulHash]}=  SoulVerification();
