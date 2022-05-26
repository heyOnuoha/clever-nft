import { useState, useEffect } from 'react'
import useEthereum from '../hooks/useEthereum' 
import Head from 'next/head'
import Image from 'next/image'
import MarketplaceItem from '../components/marketplace-item'
import styles from '../styles/Home.module.css'
import useSettings from '../hooks/useSettings'
import { pinFileToIPFS, pinJSONToIPFS } from '../utils/pinata'
import TreasuryItem from '../components/treasury-item'

export default function Home() {

  const ethereum = useEthereum()
  const application = useSettings()

  const [memberData, setMemberData] = useState(null)
  const [userNFTs, setUserNFTs] = useState([])
  const [tokens, setTokens] = useState([])
  const [listings, setListings] = useState([])
  const [isInnerPage, setIsInnerPage] = useState(false)
  const [mintNFTActive, setMintNFTActive] = useState(false)

  const [userNftName, setUserNftName] = useState('')
  const [userNftImage, setUserNftImage] = useState()
  const [userNftDescription, setUserNftDescription] = useState('')
  const [token1, setToken1] = useState('')
  const [token2, setToken2] = useState('')
  const [amount, setAmount] = useState(0)

  useEffect(() => {

    console.log(ethereum)

    if(ethereum.data.isConnected) {

      ethereum.listenToWalletChange()

      const accessNFT = ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call().then(balance => {
     
        application.updateState({
          hasAccessNFT: balance > 0
        }, () => {
          loadNFTs()
        })
      })
    }

  }, [ethereum])

  const connectWallet = () => {

    ethereum.connectWallet()
  }

  const enterApp = async () => {

    const balance = await ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call()

    if(balance < 1) {
      alert('You don\'t have access to this app')
      application.updateState({
        hasAccessNFT: false
      })
    }

    if(application.state.hasAccessNFT) {
      setIsInnerPage(!isInnerPage)
    }

    
  }

  const getAccessNFT = async () => {

    const accessNFT = await ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call()

    if(accessNFT > 0) {

      const balance = await ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call()

      if(balance > 0) {

        const tokenId = await ethereum.initCleverAccessNFT().tokenOfOwnerByIndex(ethereum.data.currentWallet, 0).call()

        const token = await ethereum.initCleverAccessNFT().tokenURI(tokenId).call()

        setMemberData({ token, tokenId })

      }
    }
  }

  const getUserNFT = async () => {

    const accessNFT = await ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call()

    setUserNFTs([])

    if(accessNFT > 0) {

      const balance = await ethereum.initCleverNFT().balanceOf(ethereum.data.currentWallet).call()

      console.log(balance, ethereum.data.currentWallet)

      const nfts = []

      for(let i = 0; i < balance; i++) {

        const tokenId = await ethereum.initCleverNFT().tokenOfOwnerByIndex(ethereum.data.currentWallet, i).call()
        const token = await ethereum.initCleverNFT().tokenURI(tokenId).call()

        nfts.push({ token, tokenId })

        setUserNFTs(nfts)
      }
    }
  }

  const getTokens = async () => {

    const accessNFT = await ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call()

    setTokens([])

    if(accessNFT > 0) {

      const tokensList = await ethereum.initNFTMarkeplace().getTokens().call()


      const tTokens = []

      for(let i = 0; i < tokensList.length; i++) {

        const tokenBalance = await ethereum.initToken(tokensList[i].tokenAddress).balanceOf(ethereum.getMarketplaceAddress()).call()
        const userBalance = await ethereum.initToken(tokensList[i].tokenAddress).balanceOf(ethereum.data.currentWallet).call()
        const tokenName = await ethereum.initToken(tokensList[i].tokenAddress).name().call()

        tTokens.push({ tokenBalance, tokenName, token: tokensList[i], userBalance, tokenAddress: tokensList[i].tokenAddress })
        
      }

      setTokens(tTokens)
    }
  }

  const mintAccessNFT = async () => {

    const nftPrice = await ethereum.initCleverAccessNFT().mintPrice().call()

    const gasLimit = await ethereum.initCleverAccessNFT().mint().estimateGas({
      from: ethereum.data.currentWallet,
      value: nftPrice
    })

    const mintData = await ethereum.initCleverAccessNFT().mint()
    const data = mintData.encodeABI()

    console.log(data, gasLimit)

    ethereum.getWeb3().eth.sendTransaction({ 
      to: ethereum.getAccessNFTAddress(), 
      from: ethereum.data.currentWallet, 
      gas: gasLimit,
      value: nftPrice,
      data: data,
    })
    .once('sent', (payload) => {
      alert('Minting access NFT...')
    })
    .once('transactionHash', (hash) => { 
      alert('Transaction Submitted')
    })
    .on('confirmation', (confNumber, receipt, latestBlockHash) => {
      if(confNumber === 1) {
        alert('Access NFT minted')
        application.updateState({
          hasAccessNFT: true
        })
        loadNFTs()
      }
    })
    .on('error', (error) => {
      alert('Error: ' + error)
    })
  }

  const swapTokens = async () => {

    const gasLimit = await ethereum.initNFTMarkeplace().swapTokens(token1, token2, ethereum.getWeb3().utils.toWei(amount.toString(), 'ether')).estimateGas({ from: ethereum.data.currentWallet })

    const pData = await ethereum.initNFTMarkeplace().swapTokens(token1, token2, ethereum.getWeb3().utils.toWei(amount.toString(), 'ether'))
    const data = pData.encodeABI()

    console.log(data, gasLimit)

    ethereum.getWeb3().eth.sendTransaction({ 
      to: ethereum.getMarketplaceAddress(), 
      from: ethereum.data.currentWallet, 
      gas: gasLimit,
      data: data,
    })
    .once('sent', (payload) => {
      alert('Swapping Tokens...')
    })
    .once('transactionHash', (hash) => { 
      alert('Transaction Submitted')
    })
    .on('confirmation', (confNumber, receipt, latestBlockHash) => {
      if(confNumber === 1) {
        alert('Tokens Swapped')
        loadNFTs()
        setAmount(0)
        setToken1('')
        setToken2('')
      }
    })
    .on('error', (error) => {
      alert('Error: ' + error)
    })
  }

  const mintUserNFT = async () => {

    if(userNftName.length < 1) {

      alert('Please enter a name for your NFT')
      return

    } else if(userNftDescription.length < 1) {

      alert('Please enter a description for your NFT')
      return

    } else if(userNftImage === undefined) {

      alert('Please upload an image for your NFT')
      return

    }

    const pinFile = await pinFileToIPFS(userNftImage)

    if(!pinFile.success) {

      alert('Error uploading file to IPFS')
      return
    }

    const metadata = new Object()
    metadata.name = userNftDescription
    metadata.image = pinFile.pinataUrl
    metadata.description = userNftDescription

    const pinataResponse = await pinJSONToIPFS(metadata)
  
    if (!pinataResponse.success) {

      alert('😢 Something went wrong while uploading your tokenURI.')
      return
    }

    const tokenURI = pinataResponse.pinataUrl

    const gasLimit = await ethereum.initNFTMarkeplace().mintCleverNFT(tokenURI).estimateGas({ from: ethereum.data.currentWallet })

    const mintData = await ethereum.initNFTMarkeplace().mintCleverNFT(tokenURI)
    const data = mintData.encodeABI()

    console.log(data, gasLimit)

    ethereum.getWeb3().eth.sendTransaction({
      to: ethereum.getMarketplaceAddress(),
      from: ethereum.data.currentWallet,
      gas: gasLimit,
      data: data,
    })
    .once('sent', (payload) => {
      alert('Minting user NFT...')
    }
    ).once('transactionHash', (hash) => {
      alert('Transaction Submitted')
    }).on('confirmation', (confNumber, receipt, latestBlockHash) => {
      if(confNumber === 1) {
        alert('User NFT minted')
        loadNFTs()
      }
    }
    ).on('error', (error) => {
      alert('Error: ' + error)
    })
  }

  const getMarketPlaceNFTs = async () => {
    
    const accessNFT = await ethereum.initCleverAccessNFT().balanceOf(ethereum.data.currentWallet).call()

    if(accessNFT > 0) {

      const getListings = await ethereum.initNFTMarkeplace().getListings().call()

      console.log(getListings)

      const nfts = []

      for(let i = 0; i < getListings.length; i++) {

        try {

          const tokenId = getListings[i].tokenId

          console.log(getListings[i].status)

          if(getListings[i].status != 'ACTIVE') {

            continue
          }

          const token = await ethereum.initCleverNFT().tokenURI(tokenId).call()

          nfts.push({ token, tokenId, nftData: getListings[i] })

          setListings(nfts)

        } catch (error) {
          console.log(error)
          continue
        }
      }
    }
  }

  const loadNFTs = async () => {

    console.log('called')

    await getMarketPlaceNFTs()
    await getAccessNFT()
    await getUserNFT()
    await getTokens()
  }

  const onSwap = (tokenAddress) => {

    console.log(tokenAddress)

    setToken1(tokenAddress)
  }

  const approveTokenSwap = async () => {

    const gasLimit = await ethereum.initToken(token1).approve(
        ethereum.getMarketplaceAddress(),
        ethereum.getWeb3().utils.toWei(amount.toString(), 'ether')
    ).estimateGas({ from: ethereum.data.currentWallet })

    const tx = await ethereum.initToken(token1).approve(
        ethereum.getMarketplaceAddress(),
        ethereum.getWeb3().utils.toWei(amount.toString(), 'ether')
    )

    const txData = tx.encodeABI()

    ethereum.getWeb3().eth.sendTransaction({
        to: token1,
        from: ethereum.data.currentWallet,
        gas: gasLimit,
        data: txData,
    }).once('sent', (payload) => {

        alert('Approving')

        }).once('transactionHash', (hash) => {

            loadNFTs()

            alert('Transaction Submitted')

        }).on('confirmation', (confNumber, receipt, latestBlockHash) => {

            if(confNumber === 1) {
                swapTokens()
            }
        }).on('error', (error) => {

            alert('Error: ' + error)
        })
}



  return (
    <main>

      <header>

        <h1>CLEVER CLUB</h1>

        { isInnerPage && (
          <h1 className="mint-user-nft-button" onClick={e => setMintNFTActive(!mintNFTActive)}>MINT NFT</h1>
        )}
        

        { ethereum.data.isConnected ? (
          <button className="cybr-btn" onClick={() => enterApp()}>

            
            { isInnerPage ? (
              <>
                Exit App<span aria-hidden>_</span>
                <span aria-hidden className="cybr-btn__glitch">Exit App</span>
              </>
            ) : (
              <>
                Enter App<span aria-hidden>_</span>
                <span aria-hidden className="cybr-btn__glitch">Enter App</span>
              </>
            )}
        </button>
        ) : (
          <button className="cybr-btn" onClick={() => connectWallet()}>
            Connect Wallet<span aria-hidden>_</span>
          <span aria-hidden className="cybr-btn__glitch">Connect Wallet</span>
        </button>
        ) }
        
      </header>

      { application.state.hasAccessNFT && isInnerPage ? (

         <>
            { mintNFTActive && (
              <>
                <section className='body-section'>
              
              <h1>Mint NFT</h1>
    
              <form className="mint-nft" onSubmit={e => {
                    e.preventDefault()
                    mintUserNFT()
                  }}>
                <div className="form-group">
                  <label htmlFor="exampleInputEmail1">NFT Name</label>
                  <input type="text" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter NFT Name" onChange={e => setUserNftName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="exampleInputEmail1">NFT Description</label>
                  <input type="text" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Enter NFT Description" onChange={e => setUserNftDescription(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="exampleInputEmail1">Select Asset</label>
                  <input type={'file'} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="Select Asset" onChange={e => setUserNftImage(e.target.files[0])} />
                </div>
                <div className="form-group">
                  <button type="submit" className="btn-normal">Mint NFT</button>
                </div>
              </form>
            </section>
            </>
            )}
            <section className='body-section'>
              
              <h1>Your NFTs</h1>
                <div className='marketplace'>
                  
                  { userNFTs.map((nft, index) => (
                    <MarketplaceItem key={index} nft={nft} reloadNfts={loadNFTs} />
                  ))}
                </div>
            </section>
           <section className='body-section'>
    
            <h1>Marketplace</h1>
  
            <div className='marketplace'>
              {/* { listings.length } */}
              { listings.map((nft, index) => (
                <MarketplaceItem key={index} nft={nft} reloadNfts={loadNFTs} listingId={index} />
              ))}
            </div>
  
           </section>
           <section className='body-section'>
              
              <h1>Treasury</h1>
                {/* {tokens.length} */}
              { tokens.map((token, index) => (
                <TreasuryItem key={index} token={token} onReload={loadNFTs} onSwap={onSwap} />
              ))}

              <h2>TOKEN SWAPPING</h2>

              <form id="swapping" onSubmit={(e) => {
                e.preventDefault()
                approveTokenSwap()
              }}>

              <div className='form-group'>
                <select className='form-control' onChange={e => setToken1(e.target.value)} value={token1} required>
                  <option>Select Token</option>
                  {tokens.map((token, index) => (
                    <option key={index} value={token.tokenAddress}>{token.tokenName} ({token.tokenAddress})</option>
                  ))}
                </select>
              </div>
                <h1 style={{
                  textAlign: 'center',
                }}>TO</h1>
                <div className='form-group'>
                <select className='form-control' onChange={e => setToken2(e.target.value)} value={token2} required>
                  <option>Select Token</option>
                  {tokens.map((token, index) => (
                    <option key={token.tokenAddress} value={token.tokenAddress}>{token.tokenName} ({token.tokenAddress})</option>
                  ))}
                </select>
                </div>

                <br />

                <div className='form-group'>
                  <input className='form-control' placeholder='Enter Amount' required onChange={e => setAmount(e.target.value)} type={'number'}></input>
                </div>

                <button className='btn-normal' type={'submit'}>SWAP</button>
              </form>
            </section>
         </>
      ) : (
        <>

        { ethereum.data.isConnected ? (
          <>
            <section className='body-section'>
  
              <h1>Home</h1>
  
              { !application.state.hasAccessNFT ? (
                
                <div className='no-access'>
                  <h1>No Access</h1>
                  <p>You need an Access NFT to access this app </p>
                  <button className='btn-normal' onClick={() => mintAccessNFT()}>
                    Mint Access NFT
                  </button>
                </div>
              ) : (
                  <div className='access'>
                    <h1>Welcome</h1>
                    <p>You are Welcome to the club, Member #{ memberData && memberData.tokenId}</p>
                  </div>
                )
              }
  
              
              </section>
          </> 
        ) : (
         <section>
            <h1>Connect Your Wallet</h1>
         </section> 
        )}
  
      </>
      ) }
      

    </main>
  )
}
