const chai = require("chai");
const { before } = require("mocha");
const path = require("path");
const {buildPoseidonOpt} = require('circomlibjs');
const snarkjs = require('snarkjs');
const fs = require('fs');
const wasm_tester = require("circom_tester").wasm;

describe('verification soul', ()=>{
    let circuit;
    let poseidon;
    before(async()=>{
        circuit = await wasm_tester(path.join(__dirname, "../src", "verifySoul.circom"));
        poseidon = await buildPoseidonOpt();
    })

    it('should pass smoking test', async ()=>{
        //Create input
        const password = "1";
        const userSecret = "2";
        const passwordBuf = buf2hex(Buffer.from(password,'utf-8'));
        const userSecretBuf = buf2hex(Buffer.from(userSecret, 'utf-8'));
        const userSoulHash = buf2hex(await goodPoseidon(poseidon, [passwordBuf, userSecretBuf]));

        const input = {
            userPassword: passwordBuf,
            userSecret: userSecretBuf,
            userSoulHash: userSoulHash
        }
        var witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {out: "0"});

    })
});

describe('verification kyc', () => {
    let circuit;
    let poseidon;
    before(async()=>{
        circuit = await wasm_tester(path.join(__dirname, "../src", "verifyKYC.circom"));
        poseidon = await buildPoseidonOpt();
    })

    it('should pass smoking tests', async () => {
        // Create input
        const authCode = buf2hex([0,0,0]);
        const userSecret = buf2hex([1,1,1]);
        const userPassword = buf2hex([2,2,2]);
        const authCodeHash = buf2hex(await goodPoseidon(poseidon, [authCode]));
        const userSoulHash = buf2hex(await goodPoseidon(poseidon, [userPassword,userSecret]));
        const expiration = Math.floor(new Date().getTime() / 1000);
        const seqNo = buf2hex(await goodPoseidon(poseidon, [authCodeHash, userSoulHash, expiration]));

        const input = {
            authCode: authCode,
            userPassword: userPassword,
            userSecret: userSecret,
            authCodeHash: authCodeHash,
            userSoulHash: userSoulHash,
            expiration: expiration,
            seqNo: seqNo
        };

        console.log(input);
        //Create witness
        var witness = await circuit.calculateWitness(input, true);
        await circuit.checkConstraints(witness);
        await circuit.assertOut(witness, {out: "0"});

        //Proove and verify
        const { proof, publicSignals } =
        await snarkjs.groth16.fullProve( input, path.join(__dirname, "../artifact/verifyKYC.wasm"), path.join(__dirname, "../artifact/zkey_kyc.zkey"));
    
        const vkey = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifact/vkey_kyc.json')).toString());
        ;
        const verificationResult = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
        console.log('Public Signals:')
        console.log(publicSignals);
    
        console.log('proof:');
        console.log(proof);

        console.log('Verification result:');
        console.log(verificationResult);
    });

  })
  
//调用witness_calculator自己生成输入
//借助circom_tester自己创建输出

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return "0x"+[...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
  }
  
async function goodPoseidon(poseidon, input){
    const ansInFF = poseidon(input);
    return (await poseidon.F.batchFromMontgomery(ansInFF)).reverse()
}