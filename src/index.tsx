import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {App} from './Routes/App'

import reportWebVitals from './reportWebVitals';
import { createStore } from 'redux'

import { Web3ReactProvider } from '@web3-react/core'
import { Web3Provider } from "@ethersproject/providers";

function getLibrary(provider:any) {
  return new Web3Provider(provider);
}

ReactDOM.render(
  <Web3ReactProvider getLibrary={getLibrary}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Web3ReactProvider>,
  document.getElementById('root')
);
reportWebVitals();
