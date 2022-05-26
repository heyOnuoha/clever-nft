import React, { useEffect } from "react"
import Web3 from "web3"
import config from "../config.json"
import marketplaceABI from '../contracts/NFTMarketplace.json'
import cleverAccessNFT from '../contracts/CleverAccessNFT.json'
import cleverNFT from '../contracts/CleverNFT.json'
import erc20 from '../contracts/ERC20.json'


const EthereumContext = React.createContext([])

const defaultData = {
    wallets: [],
    currentWallet: '',
    message: '',
    isConnected: false,
    contractData: {},
    expectedBlockTime: 5000,
    web3: null,
    hasEthereum: false,
}

export const EthereumProvider = ({ children }) => {

    const [data, setData] = React.useState(defaultData)

    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }

    useEffect(() => {

        const web3 = new Web3(Web3.givenProvider || config.ethereum.provider)

        let wallets = []

        if(window.ethereum) {

            window.ethereum.request({
                method: 'eth_accounts',
            }).then(accounts => {

                console.log('accounts', accounts)

                updateData({
                    wallets: accounts,
                    currentWallet: accounts[0],
                    isConnected: accounts.length > 0,
                    web3,
                    hasEthereum: window.ethereum !== undefined
                })
            })
        }

    }, [])

    const updateData = (newData) => {
        setData({
            ...data,
            ...newData
        })
    }

    const initNFTMarkeplace = () => {
        const marketplace = new data.web3.eth.Contract(marketplaceABI.abi, config.marketplaceAddress)
        const marketplaceInstance = marketplace.methods
        return marketplaceInstance
    }

    const initCleverAccessNFT = () => {
        const cleverAccessNFTContract = new data.web3.eth.Contract(cleverAccessNFT.abi, config.accessNFTAddress)
        const cleverAccessNFTInstance = cleverAccessNFTContract.methods
        return cleverAccessNFTInstance
    }

    const initCleverNFT = () => {
        const cleverNFTContract = new data.web3.eth.Contract(cleverNFT.abi, config.cleverNFTAddress)
        const cleverNFTInstance = cleverNFTContract.methods
        return cleverNFTInstance
    }

    const initToken = (tokenAddress) => {
        const tokenContract = new data.web3.eth.Contract(erc20.abi, tokenAddress)
        const tokenInstance = tokenContract.methods
        return tokenInstance
    }

    const getMarketplaceAddress = () => {
        return config.marketplaceAddress
    }

    const getAccessNFTAddress = () => {
        return config.accessNFTAddress
    }

    const getCleverNFTAddress = () => {
        return config.cleverNFTAddress
    }

    const getWeb3 = () => {
        
        if(data.web3) {
            console.log(data.web3)
            return data.web3
        }
    }

    const connectWallet = async () => {

        if(data.hasEthereum) {

            const wallets = await window.ethereum.request({
                method: 'eth_requestAccounts',
            })

            updateData({
                wallets,
                currentWallet: wallets[0],
                isConnected: wallets.length > 0
            })
        }
    }

    const listenToWalletChange = () => {

        if(window.ethereum) {

            window.ethereum.on('accountsChanged', async (accounts) => {

                console.log(accounts, 'hererreh')

                updateData({
                    wallets: accounts,
                    currentWallet: accounts[0]
                })
            })   
        }
    }

    return (
        <EthereumContext.Provider value={{ 
            data, 
            updateData, 
            initNFTMarkeplace,
            initCleverAccessNFT,
            initCleverNFT,
            getWeb3,
            connectWallet,
            listenToWalletChange,
            getMarketplaceAddress,
            getAccessNFTAddress,
            getCleverNFTAddress,
            initToken
        }}>
            {children}
        </EthereumContext.Provider>
    )
}

export default EthereumContext