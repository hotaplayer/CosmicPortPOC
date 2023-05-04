import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "src/boot/axios";
const ethers =require('ethers');
const snarkjs = require('snarkjs');

const contractAbi = JSON.parse(fs.readFileSync('./resources/abi.abi').toString());
const contractBin = fs.readFileSync('resources/bin.bin').toString();
const vkey = JSON.parse(fs.readFileSync('./resources/verification_key.json').toString());
let provider = new ethers.providers.JsonRpcProvider();

const {buildPoseidonOpt} = require('circomlibjs');

let poseidon;
buildPoseidonOpt().then(res=>{
    poseidon = res;
    prepare();
});

export const useAAStore = defineStore("aa", () => {
  const isLoading = ref(false);
  const balance = ref(null);
  const guardians = ref([]);
  const toAddress = ref(null);
  const toAmount = ref(null);
  const txnLimit = ref(null);
  const ethGas = ref(0.0);
  const usdGas = ref(0.0);
  const proof = ref(null);
  const publicSignals = ref(null);

  const convertWeiToEth = (weiAmount) => {
    console.log(
      parseFloat(1e-18),
      parseFloat(weiAmount),
      parseFloat(weiAmount) * 1e-18,
      parseFloat(weiAmount * 1e-18)
    );
    return parseFloat(weiAmount) * 1e-18;
  };

  const convertEthToWei = (ethAmount) => {
    return Number(ethAmount) * 1e18;
  };

  const estimateGasFee = (unit = "eth") => {
    let max = 84;
    let min = 66;
    let randomGweiGasCost = Math.random() * (max - min + 1) + min;
    ethGas.value = convertWeiToEth(randomGweiGasCost * 10e9).toFixed(8);
    usdGas.value = parseFloat(randomGweiGasCost * 0.000002);
  };

  const fetchBalance = async () => {
    isLoading.value = true;
    const {
      data: { code, data: res },
    } = await provider.getBalance(localStorage.getItem('wa'));

    isLoading.value = false;
    if (code !== 0) return false;
    return res;
  };

  const fetchGuardians = async () => {
    isLoading.value = true;
    const contract = new ethers.Contract(localStorage.get('wa'), contractAbi);
    const {
      data: { code, data: res },
    } = await contract.guardians();
    isLoading.value = false;
    if (code !== 0) return false;
    return res;
  };

  const fetchLimits = async () => {
    isLoading.value = true;
    const contract = new ethers.Contract(localStorage.get('wa'), contractAbi);

    const {
      data: { code, data: res },
    } = await contract.transferThreshold();
    isLoading.value = false;
    if (code !== 0) return false;
    return res;
  };

  const formatWallet = (input, digit = 10) => {
    return (
      input.substring(0, digit) +
      "..." +
      input.substring(input.length - digit - 3)
    );
  };

  const genProof = async (authCode, userSecret, pwd, exp, seqNo) => {
    isLoading.value = true;

    authCode = buf2hex(Buffer.from(authCode+'', 'utf-8'));
    userSecret = buf2hex(Buffer.from(userSecret+'', 'utf-8'));
    userPasswordRaw = buf2hex(Buffer.from(pwd+'', 'utf-8'));
    let input = {
        authCode: authCode,
        userPassword: userPasswordRaw,
        userSecret:userSecret,
        authCodeHash: buf2hex(await goodPoseidon(poseidon, [authCode])),
        userSoulHash: buf2hex(await goodPoseidon(poseidon, [userPasswordRaw, userSecret])),
        expiration: exp,
        seqNo: seqNo
    };
    
    console.log(input)
    
    const { proof, publicSignals } =
    await snarkjs.groth16.fullProve( input, "resources/circuit.wasm", "resources/circuit_final.zkey");

    isLoading.value = false;
    res = {proof, publicSignals}
    return res;
  };

  const getKYC = async () => {
    isLoading.value = true;
    const {
      data: { code, data: res },
    } = await api.get("/api/user/kyc");
    isLoading.value = false;
    if (code !== 0) return false;
    return res;
  };

  const login = async (email, soulProof, publicSignals) => {
    let payload = {
      username: email,
      soulProof,
      publicSignals
    };
    isLoading.value = true;
    const {
      data: { code, data: res },
    } = await api.post("/api/user/login", payload);
    isLoading.value = false;
    if (code !== 0) return false;
    return res;
  };

  const signup = async (email, pwd,userSecret) => {
    let payload = {
      username: email,
      userSoulHash: buf2hex(await goodPoseidon(poseidon, [pwd, userSecret]))
    };
    isLoading.value = true;
    const {
      data: { code, data: res },
    } = await api.post("/api/user/register", payload);
    isLoading.value = false;
    if (code !== 0) return false;
    return res;
  };

  const sendTxn = async (proof, publicSignals, to, value) => {
    isLoading.value = true;

    //Verify zk proof
    //TODO: we should use ERC4337EthersSDK but we are in a rush so no time to do so
    const contract = new ethers.Contract(localStorage.getItem('wa'), contractAbi, signer);
    const result = await contract.verifyProof(user, proof, publicSignals);
    if (!result){
      return undefined;
        }
    //Send transaction
    const txReceipt = await (await contract.execute(to, [], value)).wait();
    res = {code: 0, message: '', data:{
      transactionHash: txReceipt.transactionHash
    }}
    isLoading.value = false;
    return res;
  };

  const setBalance = (newBalance) => {
    balance.value = convertWeiToEth(newBalance);
  };

  const setGuardians = (list) => {
    guardians.value = [];
    guardians.value = list.reduce((res, curr) => {
      if (!!!curr["username"]) res.push(curr["username"]);
      else res.push(curr["walletAddress"]);
      return res;
    }, []);
  };

  const setLimits = (weiLimit) => {
    txnLimit.value = convertWeiToEth(weiLimit);
  };

  const setProofs = (pf, ps) => {
    proof.value = pf;
    publicSignals.value = ps;
  };

  const simulateTxn = async (address, ethAmount) => {
    isLoading.value = true;
    toAddress.value = address;
    toAmount.value = ethAmount;

    // Gas calculation
    // In real case will be calculated from Smart Contract
    estimateGasFee();

    isLoading.value = false;
    return ethGas.value;
  };

  const updateGuardian = async (proof, publicSignals, newGuardian) => {
    isLoading.value = true;
    //Verify zk proof
    //TODO: we should use ERC4337EthersSDK but we are in a rush so no time to do so
    const contract = new ethers.Contract(localStorage.getItem('wa'), contractAbi, signer);
    const result = await contract.verifyProof(user, proof, publicSignals);
    if (!result){
            return undefined;
        }
    //Send transaction
    const data = contract.interface.encodeFunctionData("addGuardian", [newGuardian]);

    const txReceipt = await (await contract.execute(to, data, value)).wait();
    res = {code: 0, message: '', data:{
      transactionHash: txReceipt.transactionHash
    }}
    return res;
  };

  const updateLimits = async (proof, publicSignals, newThreshold) => {
    isLoading.value = true;
    const contract = new ethers.Contract(localStorage.getItem('wa'), contractAbi, signer);
    const result = await contract.verifyProof(user, proof, publicSignals);
    if (!result){
      return undefined;
    }
    //Send transaction
    const data = contract.interface.encodeFunctionData("updateThreshold", [newThreshold]);

    const txReceipt = await (await contract.execute(to, data, value)).wait();
    res = {code: 0, message: '', data:{
      transactionHash: txReceipt.transactionHash
    }}
    isLoading.value = false;
    return res;
  };

  const updatePwd = async (proof, publicSignals, newSoulHash) => {
    isLoading.value = true;
    const contract = new ethers.Contract(localStorage.getItem('wa'), contractAbi, signer);
    const result = await contract.verifyProof(user, proof, publicSignals);
    if (!result){
      return undefined;
    }
    //Send transaction
    const data = contract.interface.encodeFunctionData("updateUserSoulHash", [newSoulHash]);

    const txReceipt = await (await contract.execute(to, data, value)).wait();
    res = {code: 0, message: '', data:{
      transactionHash: txReceipt.transactionHash
    }}
    isLoading.value = false;
    return res;
  };

  return {
    balance,
    ethGas,
    guardians,
    isLoading,
    proof,
    publicSignals,
    toAddress,
    toAmount,
    txnLimit,
    usdGas,
    estimateGasFee,
    fetchBalance,
    fetchGuardians,
    fetchLimits,
    formatWallet,
    genProof,
    getKYC,
    login,
    sendTxn,
    setBalance,
    setGuardians,
    setLimits,
    setProofs,
    signup,
    simulateTxn,
    updateGuardian,
    updateLimits,
    updatePwd,
  };
});

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return "0x"+[...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

async function goodPoseidon(poseidon, input){
  const ansInFF = poseidon(input);
  return (await poseidon.F.batchFromMontgomery(ansInFF)).reverse()
}
