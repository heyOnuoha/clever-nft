import { useEffect, useState } from 'react'

import useEthereum from '../hooks/useEthereum'
import useSettings from '../hooks/useSettings'



const TreasuryItem = ({ token, onSwap, onReload }) => {

    const ethereum = useEthereum()
    const application = useSettings()

    const { tokenName, tokenBalance, userBalance, tokenAddress } = token

    const [balance, setBalance] = useState(0)
    const [userBal, setUserBal] = useState(0)
    const [hasClaimedTokens, setHasClaimedTokens] = useState(false)


    useEffect(() => {

        setBalance(ethereum.getWeb3().utils.fromWei(tokenBalance.toString(), 'ether'))
        setUserBal(ethereum.getWeb3().utils.fromWei(userBalance.toString(), 'ether'))

        checkHasClaimedTokens()
    })

    const checkHasClaimedTokens = async () => {

        const hasClaimedTokens = await ethereum.initNFTMarkeplace().claimedTokens(ethereum.data.currentWallet, tokenAddress).call()
    
        if(hasClaimedTokens) {
          setHasClaimedTokens(true)
        }
      }

    const requestTestTokens = async () => {

        const gasLimit = await ethereum.initNFTMarkeplace().requestTestToken(
            tokenAddress
        ).estimateGas({ from: ethereum.data.currentWallet })

        const tx = await ethereum.initNFTMarkeplace().requestTestToken(
            tokenAddress
        )

        const txData = tx.encodeABI()

        ethereum.getWeb3().eth.sendTransaction({
            to: ethereum.getMarketplaceAddress(),
            from: ethereum.data.currentWallet,
            gas: gasLimit,
            data: txData,
        }).once('sent', (payload) => {

            alert('Getting Free Tokens')

            }).once('transactionHash', (hash) => {

                onReload()

                alert('Transaction Submitted')

            }).on('confirmation', (confNumber, receipt, latestBlockHash) => {

                if(confNumber === 1) {
                    onReload()
                }
            }).on('error', (error) => {

                alert('Error: ' + error)
            })
    }

    return (
        <div className='treasury-item'>
            <h2>{ tokenName }</h2>

            <div>
                <h2> Treasury Balance: <b>{balance}</b></h2>
                <h2> Your Balance: <b>{userBal}</b></h2>
            </div>
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '2rem'
            }}>
                
                <button className='btn-normal' onClick={() => onSwap(tokenAddress)}>SWAP</button>
                { (userBal == 0  && !hasClaimedTokens) && (
                    <>
                        { tokenBalance > 0 ? (
                            <button className='btn-normal' onClick={() => requestTestTokens()}>REQUEST TEST TOKENS</button>
                        ): (
                            <button className='btn-normal'>TREASURY IS EMPTY</button>
                        )}
                        
                    </>
                )}
                
            </div>
        </div>
    )
}

export default TreasuryItem