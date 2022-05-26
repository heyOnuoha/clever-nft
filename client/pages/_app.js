import App from 'next/app'
import { ApplicationProvider } from '../context/application.context'
import { EthereumProvider } from '../context/ethereum.context'
import '../styles/globals.css'

class CleverApp extends App {

  render() {
    const { Component, pageProps } = this.props

    return (
      <ApplicationProvider>
        <EthereumProvider>
          <Component {...pageProps} />
        </EthereumProvider>
      </ApplicationProvider>
    )
  }
}

export default CleverApp