import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'
import useEthereum from '../hooks/useEthereum'
import useSettings from '../hooks/useSettings'

const MarketplaceItem = (props) => {

    const ethereum = useEthereum()
    const application = useSettings()

    const [tokenData, setTokenData] = useState({})
    const [tokenNFT, setTokenNFT] = useState({})
    const [isListing, setIsListing] = useState(false)
    const [itemPrice, setItemPrice] = useState(0)
    const [listingPrice, setListingPrice] = useState(0)

    const { nft, listingId } = props

    useEffect(() => {

        if(nft) {

            if(nft.nftData) {
                setTokenNFT(nft.nftData)
                console.log(nft.nftData)
            }

            const url = nft.token

            fetch(url).then(response => response.json()).then(response => {
                console.log(nft.nftData)
                setTokenData(response)
                setItemPrice(ethereum.getWeb3().utils.fromWei(nft.nftData.price.toString(), 'ether'))
            }).catch(error => console.log(error))


        }

    }, [])

    const approveNFTListing = async () => {

        const gasLimit = await ethereum.initCleverNFT().approve(
            ethereum.getMarketplaceAddress(),
            props.nft.tokenId
        ).estimateGas({ from: ethereum.data.currentWallet })

        const tx = await ethereum.initCleverNFT().approve(
            ethereum.getMarketplaceAddress(),
            props.nft.tokenId
        )

        const txData = tx.encodeABI()

        ethereum.getWeb3().eth.sendTransaction({
            to: ethereum.getCleverNFTAddress(),
            from: ethereum.data.currentWallet,
            gas: gasLimit,
            data: txData,
        }).once('sent', (payload) => {

            alert('Approving')

            }).once('transactionHash', (hash) => {

                props.reloadNfts()

                alert('Transaction Submitted')

            }).on('confirmation', (confNumber, receipt, latestBlockHash) => {

                if(confNumber === 1) {
                    listNFT()
                }
            }).on('error', (error) => {

                alert('Error: ' + error)
            })
    }

    const listNFT = async () => {

        console.log(tokenData)

        const gasLimit = await ethereum.initNFTMarkeplace().listItem(
            ethereum.getCleverNFTAddress(),
            props.nft.tokenId,
            ethereum.getWeb3().utils.toWei(listingPrice.toString(), 'ether')
        ).estimateGas({ from: ethereum.data.currentWallet })

        console.log('gasLimit', gasLimit)

        const tx = await ethereum.initNFTMarkeplace().listItem(
            ethereum.getCleverNFTAddress(),
            props.nft.tokenId,
            ethereum.getWeb3().utils.toWei(listingPrice.toString(), 'ether'),
        )

        const txData = tx.encodeABI()

        console.log('txData', txData)

        ethereum.getWeb3().eth.sendTransaction({
            to: ethereum.getMarketplaceAddress(),
            from: ethereum.data.currentWallet,
            gas: gasLimit,
            data: txData,
          }).once('sent', (payload) => {

                alert('Listing NFT...')

            }).once('transactionHash', (hash) => {

            alert('Transaction Submitted')

          }).on('confirmation', (confNumber, receipt, latestBlockHash) => {

            if(confNumber === 1) {
              alert('User Listed minted')
              props.reloadNfts()
            }
          }).on('error', (error) => {

            alert('Error: ' + error)
          })
    }

    const unlistNFT = async () => {

        console.log(tokenData,listingId)

        const gasLimit = await ethereum.initNFTMarkeplace().unlistItem(
            listingId
        ).estimateGas({ from: ethereum.data.currentWallet })

        console.log('gasLimit', gasLimit)

        const tx = await ethereum.initNFTMarkeplace().unlistItem(
            listingId
        )

        const txData = tx.encodeABI()

        console.log('txData', txData)

        ethereum.getWeb3().eth.sendTransaction({
            to: ethereum.getMarketplaceAddress(),
            from: ethereum.data.currentWallet,
            gas: gasLimit,
            data: txData,
          }).once('sent', (payload) => {

                alert('Unlisting NFT...')

            }).once('transactionHash', (hash) => {

            alert('Transaction Submitted')

          }).on('confirmation', (confNumber, receipt, latestBlockHash) => {

            if(confNumber === 1) {
              alert('User NFT unlisted')
              props.reloadNfts()
            }
          }).on('error', (error) => {

            alert('Error: ' + error)
          })
    }

    const buyNFT = async () => {

        console.log(tokenData)

        
        console.log(tokenNFT.id)

        const balance = await ethereum.getWeb3().eth.getBalance(ethereum.data.currentWallet)

        if(Number(balance) < Number(tokenNFT.price)) {
            alert('You do not have enough funds to buy this NFT')
            return
        }

        const gasLimit = await ethereum.initNFTMarkeplace().buyNFT(
            listingId
        ).estimateGas({ from: ethereum.data.currentWallet, value: tokenNFT.price })

        console.log('gasLimit', gasLimit)

        const tx = await ethereum.initNFTMarkeplace().buyNFT(
            listingId
        )

        const txData = tx.encodeABI()

        console.log('txData', txData)

        ethereum.getWeb3().eth.sendTransaction({
            to: ethereum.getMarketplaceAddress(),
            from: ethereum.data.currentWallet,
            value: tokenNFT.price,
            gas: gasLimit,
            data: txData,
          }).once('sent', (payload) => {

                alert('Buying NFT...')

            }).once('transactionHash', (hash) => {

            alert('Transaction Submitted')

          }).on('confirmation', (confNumber, receipt, latestBlockHash) => {

            if(confNumber === 1) {
              alert('Buying NFT')
              props.reloadNfts()
            }
          }).on('error', (error) => {

            alert('Error: ' + error)
          })
    }
    
    return (
        <>
            <div className="marketplace-item">

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <h3>{tokenData.name}</h3>
                    <h3>{ tokenNFT.price && <>{itemPrice} ETH</>}</h3>
                </div>

                <div className="marketplace-item-image">
                    <img src={tokenData.image} alt="" width={250} height={250} loading="eager"/>
                </div>

                { tokenNFT.price ? (
                    <>
                        { tokenNFT.ownerAddress.toLowerCase() == ethereum.data.currentWallet.toLowerCase() ? (
                            <>
                                 <button type="submit" className="btn-normal" onClick={() => unlistNFT()}>UNLIST ITEM</button>
                            </>
                        ): (
                            <>
                                <button type="submit" className="btn-normal btn-normal-unlist" onClick={() => buyNFT()}>BUY ITEM</button>
                            </>
                        )}
                    </>
                ): (

                    <>
                        { isListing  && (
                        <>
                             <div className='form-group' style={{
                                 marginTop: 10
                             }}>
                                 <input className='form-control' type="number" placeholder="Listing Price" onChange={(e) => setListingPrice(e.target.value)}/>
                             </div>
                             <button style={{
                                 backgroundColor: '#00bcd4',
                                 color: '#fff',
                             }} type="submit" className="btn-normal" onClick={e => approveNFTListing()}>COMPLETE LISTING</button>
                            </>
                        )}
                    

                        <button type="submit" className="btn-normal" onClick={e => {
                            e.preventDefault()
                            setIsListing(!isListing)
                        }}>{ isListing ? (
                            'CANCEL LISTING'
                        ): (
                            'LIST ITEM'
                        )}</button>

                    </>
                )}
            </div>
        </>
    )
}

MarketplaceItem.propTypes = {
    nft: PropTypes.object,
    reloadNftss: PropTypes.func
}

export default MarketplaceItem