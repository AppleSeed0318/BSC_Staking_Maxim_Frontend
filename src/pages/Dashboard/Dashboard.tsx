import { useEffect, useState } from "react";
import styles from "./Dashboard.module.scss";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Grid, Box, Button } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import LinearProgress from '@mui/material/LinearProgress';
import { useParams } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Snackbar from '@mui/material/Snackbar';

import Modal from '@mui/material/Modal';

import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { InjectedConnector } from "@web3-react/injected-connector";

import { useWeb3React } from '@web3-react/core'
import Web3Modal from 'web3modal';

import { ethers } from 'ethers';
import ContractAbi from '../../config/contract.json';

export const Dashboard = () => {

  let { partnercode } = useParams();
  const contract_address = "0x0b37A0EB4c23eD3F4c0f828B3201bf40C0eAcd2F";

  const CoinbaseWallet = new WalletLinkConnector({
   url: `https://mainnet.infura.io/v3`,
   appName: "Web3-react Demo",
   supportedChainIds: [1, 3, 4, 5, 42],
  });

  const cooldownTime = 60*1;

  const WalletConnect = new WalletConnectConnector({
    // rpcUrl: "https://matic-mainnet.chainstacklabs.com",
    bridge: "https://bridge.walletconnect.org",
    qrcode: true,
  });

  const Injected = new InjectedConnector({
   // supportedChainIds: [1, 3, 4, 5, 42]
   supportedChainIds: [56, 97]
  });

  const { activate, deactivate } = useWeb3React();
  const { active, chainId, account, library  } = useWeb3React();
  
  const [progressValue, setProgressValue] = useState(0);
  const [remainedTime, setRemainedTime] = useState(cooldownTime);

  const [level, setLevel] = useState(1)
  const [profit, setProfit] = useState(0);
  const [balance,setBalance]= useState(0);

  const [claimable, setClaimable] = useState(false);

  const base_url = window.location.href.split('/')[0]+"//"+window.location.href.split('/')[2]+"/";

  let mainContract:any;
  let interval:any = null;

  useEffect(() => {
    library?.getBalance(account).then((result:any)=>{
      setBalance(result/1e18)
    })
  },);

  useEffect(()=>{
    if(active) {
      getProfit();
    }
  }, [balance]);

  const getProfit = async () => {
    try{
      mainContract = await connectWeb3();
      let _profit = await mainContract.getProfit();
      _profit = ethers.utils.formatEther(_profit);
      console.log(_profit);
      setProfit(_profit);
    }catch(e){
      console.log(e);
    }
  }

  const connectWeb3 = async () => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    console.log("connection", connection, signer);

    return new ethers.Contract(contract_address, ContractAbi, signer);
  }

  const setTime = () => {

    if(interval!=null) interval.clearInterval();

    interval = setInterval(()=>{
      setRemainedTime(prvremainedTime=> {
        
        var value = prvremainedTime - 1;
        if(value <= 0) {
          setClaimable(true);
          setProgressValue(100);
          return 0;
        }

        setProgressValue((cooldownTime-value)*100/cooldownTime);
        return value;
      });
    }, 1000);
  }

  const sendBNB = async (amount: any) => {
    mainContract = await connectWeb3();

    console.log(mainContract);
    let amountIn = ethers.utils.parseUnits(Number(amount).toString(), 18);
    let result:any;

    if(partnercode==undefined || !isAddress(decrypt(partnercode))) {
      console.log("send to contract owner"); 
      result = await mainContract.stake(contract_address, { value: amountIn });
    }
    else {
      console.log("send to partner");
      result = await mainContract.stake(decrypt(partnercode), { value: amountIn });
    }
    
    if(result) {
      setRemainedTime(cooldownTime);
      setProgressValue(0);  
    }
    setTime();
  }

  const getRemainedTime = async () => {

    try{
        mainContract = await connectWeb3();
        let rTime = await mainContract.remainedTime();
        console.log("rTime", rTime, rTime == 0);
        setRemainedTime(rTime);
        setProgressValue((cooldownTime-rTime)*100/cooldownTime);
        setTime();  
      }catch(e){}
  }

  const withdraw = async () => {

    mainContract = await connectWeb3();
    let result = await mainContract.withdraw();

    if(result) {

      //set cooldown time
      setRemainedTime(cooldownTime);

      setClaimable(false);
      
    }
  }

  const loginMetamask = async() => {
    try{
      mainContract = await connectWeb3();
      let rTime = await mainContract.remainedTime();
      console.log("rTime", rTime, rTime == 0);
      setRemainedTime(rTime);
      setProgressValue((cooldownTime-rTime)*100/cooldownTime);
      setTime();

      let _profit = await mainContract.getProfit();
      _profit = ethers.utils.formatEther(_profit);
      console.log(_profit);
      setProfit(_profit);

    }catch(e) {
      console.log(e);  
      setProgressValue(0);
    }
    console.log("success");
    
  }

  const encrypt = (text:any) => {
    if(text.length < 15) return "false";
    text = text.substring(2);
    return text.substring(12, 14)+text.substring(4, 8)+text.substring(14)+text.substring(0, 4)+text.substring(8, 12);
  }

  const decrypt = (text:any) => {
    if(text.length < 15) return "false";
    return "0x"+text.substring(text.length-8, text.length-4)+text.substring(2, 6)+text.substring(text.length-4)+text.substring(0, 2)+text.substring(6, text.length-8);
  }

  var isAddress = function (address:any) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        return true;
    } else {
      return true;
    }
  };


  const [snackOpen, setSnakeOpen] = useState(false);

  const handleSnakeClick = () => {
    setSnakeOpen(true);
  };

  const handleSnakeClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setSnakeOpen(false);
  };

  return (
    <main className={styles.main}>

    <Snackbar
      open={snackOpen}
      autoHideDuration={1000}
      onClose={handleSnakeClose}
      message="Invite link has been copied to your clipboard."
    />

    {/* <div>Connection Status: {active?"YES":"NO"}</div>
    <div>Account: {account}</div>
    <div>Network ID: {chainId}</div>
    <div>Balance: {balance}</div>

    
    
    <button onClick={() => { activate(CoinbaseWallet) }}>Coinbase Wallet</button>
    <button onClick={() => { activate(WalletConnect);}}>Wallet Connect</button>
    <button onClick={() => { activate(Injected); }}>Metamask</button>

    <button onClick={getContract}>connectWeb3</button>

    <button onClick={deactivate}>Disconnect</button>*/}

      <div className={styles.header}>

        {active && 
          <div>Invite Link: 
            <div>{base_url + encrypt(account)}
            <CopyToClipboard text={base_url + encrypt(account)} onCopy={handleSnakeClick}>
              <Button variant="text">
                <ContentCopyIcon/>
              </Button>
            </CopyToClipboard>
            </div>
          </div>
        }
        <div className={styles.walletPanel}>
        {!active && <Button variant="contained" onClick={() => { activate(Injected); loginMetamask(); }}>Connect Wallet</Button>}
        {active && <Button variant="contained">{balance.toFixed(5)} BNB</Button>}
        
        </div>
      </div>

      <div className={styles.contents}>
        <div className={styles.statusPanel}>
          <div className="level">
            
          </div>

          <div className="profit">
            Profit: {profit}
          </div>

        </div>

        <div className={styles.progressBar}>
          <span className={styles.progressLabel}>{progressValue.toFixed(2)}%</span>
          <div className={styles.progressContainer}>
            <LinearProgress className={styles.progress} variant="determinate" value={progressValue}/>
          </div>
        </div>

        { claimable && 
          <div style = {{display: "flex", justifyContent: "end", marginTop: "16px"}}>
            <Button variant="contained" onClick={withdraw}>Claim</Button>
          </div>
        }

        <div className={styles.buttonGroup}>
          <Grid container spacing={0} >
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.05)} >0.05 BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.07)} >0.07 BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.10)} >0.1  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.14)} >0.14 BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.20)} >0.2  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.28)} >0.28 BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.40)} >0.4  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.55)} >0.55 BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(0.80)} >0.8  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(1.10)} >1.1  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(1.60)} >1.6  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(2.20)} >2.2  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(3.20)} >3.2  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(4.40)} >4.4  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(6.50)} >6.5  BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(8.00)} >8    BNB</Button></Grid>        
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(10.0)} >10   BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(12.5)} >12.5 BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(16.0)} >16   BNB</Button></Grid>
            <Grid md={2.4} sm={3} xs={6}><Button variant="contained" color="success" onClick = {()=>sendBNB(20.0)} >20   BNB</Button></Grid>
          </Grid>
        </div>
      </div>
    </main>
  );
};
