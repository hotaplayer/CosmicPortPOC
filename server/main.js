const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const cors = require('cors');
const ethers =require('ethers');
const snarkjs = require('snarkjs');
const fs = require('fs');
const http = require('http');
const https=require('https');
const level = require('level-rocksdb')


const contractAbi = JSON.parse(fs.readFileSync('./resources/abi.abi').toString());
const contractBin = fs.readFileSync('resources/bin.bin').toString();
const vkey = JSON.parse(fs.readFileSync('./resources/verification_key.json').toString());

const {buildPoseidonOpt} = require('circomlibjs');

let poseidon;
buildPoseidonOpt().then(res=>{
    poseidon = res;
    prepare();
});

const upload = multer();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(upload.none()); 


app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  })
  
app.use(cors({ origin: true, credentials: true }));

const userDb = level('./db/user');
const tokenDb = level('./db/token');


const USER_SECRET = "2";
let provider = new ethers.providers.JsonRpcProvider();
// const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
const signer = provider.getSigner();


app.post('/api/user/register', async (req, res, next) => {
    try{
        const { username, password } = req.body;
        const userSoulHash = buf2hex(await goodPoseidon(poseidon, [buf2hex(Buffer.from(password,'utf-8')), buf2hex(Buffer.from(USER_SECRET,'utf-8'))]));
        const walletAddress = await deployAA(userSoulHash);
        
        const token = generateToken();
        try{
            await userDb.get(username);
            res.json({
                    code:10000,
                    message:'User already existed',
                    data: null
                });
                return;
        }
        catch(err){

        }
 
        await userDb.put(username, {username, password, walletAddress,userSoulHash, token},
            {valueEncoding: "json"});
        await tokenDb.put(token, username);
        res.json({
            code:0,
            message:'success',
            data: {
                walletAddress: walletAddress,
                token: token
            }
        });
    
    }
    catch(err){
        next(err)
    }

});

app.post('/api/user/login', async (req, res, next) => {
    try{
        const { username, password } = req.body;
        let userStr;
        try{
            userStr = await userDb.get(username);
        }
        catch(err){
            res.json(response(1001, "user not found", null));
            return;
        }
        if (!userStr) {
            res.json(response(1001, "user not found", null));
            return;
        }
        let user = JSON.parse(userStr);
        const userSoulHash = buf2hex(await goodPoseidon(poseidon, [buf2hex(Buffer.from(password,'utf-8')), buf2hex(Buffer.from(USER_SECRET,'utf-8'))]));
        const contract = new ethers.Contract(user.walletAddress,contractAbi, signer);
        const soulHashOnChain = await contract.soulHash();
        
        if (userSoulHash !== soulHashOnChain){
            res.json(response(1002, "invalid password", null));
            return;
        }
    
        // await tokenDb.del(user.token);
        const token = generateToken();
        await userDb.put(user.username, {...user, token}, {valueEncoding: "json"})
        await tokenDb.put(token, user.username);
        res.json(response(0, 'success', {
            walletAddress: user.walletAddress,
            token: token
        }));
    }
    catch(err){
        next(err)
    }

});


app.get('/api/user/kyc', async (req, res,next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        
        const authCode =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const authCodeHex = buf2hex(Buffer.from(authCode+'', 'utf-8'));
        const authCodeHash = buf2hex(await goodPoseidon(poseidon, [authCodeHex]));
        const expiration = Math.floor(new Date().getTime() / 1000 + 7200);
        const userSoulHash =await contract.soulHash();
        console.log(userSoulHash);
        const seqNo = buf2hex(await goodPoseidon(poseidon, [authCodeHash, userSoulHash, expiration]));

        await (await contract.updateAuthCodeHash(seqNo, authCodeHash)).wait();
        res.json(response(0, 'success', {
            authCode,
            expiration,
            seqNo
        }));
    }
    catch(err){
        next(err)
    }


});


app.get('/api/user/threshold', async (req, res,next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        const threshold = await contract.transferThreshold();
        res.json(response(0, 'success', {
            threshold: threshold.toString(10)
        }));
    }
    catch(err){
        next(err)
    }
});

app.get('/api/fake/asset', async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        console.log(user);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        const eth = await provider.getBalance(user.walletAddress);
    
        const gas = 0;
        res.json(response(0, 'success', {
            eth: eth.toString(10), 
            gas: gas.toString(10)
        }));
    }
    catch(err){
        next(err)
    }

});


app.post('/api/fake/genProof', async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
    
        let { authCode, userPasswordRaw, expiration, seqNo } = req.body;
        authCode = buf2hex(Buffer.from(authCode+'', 'utf-8'));
        userSecret = buf2hex(Buffer.from(USER_SECRET+'', 'utf-8'));
        userPasswordRaw = buf2hex(Buffer.from(userPasswordRaw+'', 'utf-8'));
        let input = {
            authCode: authCode,
            userPassword: userPasswordRaw,
            userSecret:userSecret,
            authCodeHash: buf2hex(await goodPoseidon(poseidon, [authCode])),
            userSoulHash: buf2hex(await goodPoseidon(poseidon, [userPasswordRaw, userSecret])),
            expiration: expiration,
            seqNo: seqNo
        };
        
        console.log(input)
        
        const { proof, publicSignals } =
        await snarkjs.groth16.fullProve( input, "resources/circuit.wasm", "resources/circuit_final.zkey");
    
        res.json(response(0, 'success', {proof, publicSignals}));
    }
    catch(err){
        next(err)
    }

});

app.post('/api/fake/transfer', async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        const { proof, publicSignals, to, value } = req.body;
        //Verify zk proof
        const result = verifyProof(user, proof, publicSignals);
        if (!result){
            res.json(response(2001, "Verification failed", null));
            return;
        }
        //Send transaction
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        const txReceipt = await (await contract.execute(to, [], value)).wait();
        res.json(response(0, 'success', {
            transactionHash: txReceipt.transactionHash
        }));
    }
    catch(err){
        next(err)
    }

});

app.post('/api/fake/updateThreshold', async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        //Verify proof
        const { proof, publicSignals, threshold } = req.body;
        const result = verifyProof(user, proof, publicSignals);
        if (!result){
            res.json(response(2001, "Verification failed", null));
            return;
        }
        //send transaction
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        const data = contract.interface.encodeFunctionData("updateTransferThreshold", [threshold]);
        const txReceipt = await (await contract.execute(user.walletAddress, data, 0)).wait();
 
        res.json(response(0, 'success', {
            transactionHash: txReceipt.transactionHash
        }));
    }
    catch(err){
        next(err)
    }

});

app.put('/api/fake/password', async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        //Verify proof
        const { proof, publicSignals, password } = req.body;
        const result = verifyProof(user, proof, publicSignals);
        if (!result){
            res.json(response(2001, "Verification failed", null));
            return;
        }
        //send transaction
        const userSoulHash = buf2hex(await goodPoseidon(poseidon, [buf2hex(Buffer.from(password,'utf-8')), buf2hex(Buffer.from(USER_SECRET,'utf-8'))]));
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        const data = contract.interface.encodeFunctionData("updateUserSoulHash", [userSoulHash]);
        const txReceipt = await (await contract.execute(user.walletAddress, data, 0)).wait();

        //
        await putJson(userDb, user.username, {...user, userSoulHash, password});
        res.json(response(0, 'success', {
            transactionHash: txReceipt.transactionHash
        }));
    }
    catch(err){
        next(err)
    }

});

app.post('/api/fake/poseidon',async (req, res, next) => {
    try{
        const  datas  = req.body;
        const bufs = [];
        for(var i=0;i<datas.length;i++){
            bufs.push(buf2hex(Buffer.from(datas[i]+'', 'utf-8')));
        }
        const hash = await goodPoseidon(poseidon, bufs);
        res.json(response(0, 'success', {
            poseidon: buf2hex(hash)
        }));
    }
    catch(err){
        next(err)
    }

});

app.post('/api/fake/guardian',async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }

        const newGuardians = req.body;
        console.log(newGuardians);
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        for (let i=0;i<newGuardians.length;i++){
            await contract.addGuardian(newGuardians[i]);
        }
        const ans = await contract.getGuardians();
        console.log(ans)
        res.json(response(0, "success", null));
    }
    catch(err){
        next(err)
    }

});


app.get('/api/fake/guardian',async (req, res, next) => {
    try{
        const user = await getUserFromToken(req, res);
        if (!user){
            res.json(response(1001, "user not found", null));
            return;
        }
        const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
        const ans = await contract.getGuardians();
        console.log(ans)
        return res.json(response(0, "success", ans));
    }
    catch(err){
        next(err)
    }

});

app.use(function (err, req, res, next) {
    console.log(err?.stack)
    res.json(response(500, err?.message, null));
})


//----helpers
async function deployAA(userSoulHash) {
    const factory = new ethers.ContractFactory(contractAbi, contractBin, signer);

    const contract = await factory.deploy(await signer.getAddress(), userSoulHash, await signer.getAddress());
    await contract.deployed();

    let fundTx = {to: contract.address, value: ethers.utils.parseEther('0.1')};
    await (await signer.sendTransaction(fundTx)).wait();
    
    return contract.address;
}
  
async function verifyProof(user, proof, publicSignals){

    const proofA = proof.pi_a.slice(0,2)
    const proofB = [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1],  proof.pi_b[1][0]]]
    const proofC = proof.pi_c.slice(0,2)

    const contract = new ethers.Contract(user.walletAddress, contractAbi, signer);
    const ans = await contract.verifyProof(proofA, proofB, proofC, publicSignals);

    return ans;
}

async function getUserFromToken(req, res) {
    const token = req.headers.authorization;
    if (!token){
        return undefined;
    }
    let username;
    try{
        username = await tokenDb.get(token);
        if (!username){
            return undefined;
        }
    }
    catch(err){
        return undefined;
    }
    let userStr;
    try{
        userStr = await userDb.get(username);
        if (!userStr){
            return undefined;
        }
    }
    catch(err){
        return undefined;
    }
    return JSON.parse(userStr);
}

function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); // Generate a random alphanumeric string
}

function response(code, message, data){
    return {
        code: code,
        message: message,
        data: data
    }
}


const credentials = {
    ca: fs.readFileSync('resources/ca_bundle.crt'),
    key: fs.readFileSync('resources/private.key'),
    cert: fs.readFileSync('resources/certificate.crt')
  };
  

const PORT = process.env.PORT || 9999;

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
  
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

httpsServer.listen(443, () => {
    console.log('Server listening on port 443');
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


async function prepare() {
    const password = buf2hex(Buffer.from("cosmic123",'utf-8'));
    const  userSecret = buf2hex(Buffer.from(USER_SECRET,'utf-8'));

    const pwdHash = buf2hex(await goodPoseidon(poseidon, [password]));
    const userSoulHash = buf2hex(await goodPoseidon(poseidon, [password, userSecret]));
    console.log({
        password,
        pwdHash,
        userSecret,
        userSoulHash
    })
}


async function safeGet(db, key){
    try{
        return await db.get(key);
    }
    catch(err){
        return undefined;
    }
}

async function getJson(db, key){
    let jsonStr = await safeGet(db, key);
    if (!jsonStr){
        return undefined;
    }
    return JSON.parse(jsonStr);
}

async function putJson(db, key, value){
    await db.put(key, value,   {valueEncoding: "json"});
}