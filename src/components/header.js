import React from 'react'
import { useMoralis } from 'react-moralis'
import { ConnectButton } from 'web3uikit'

const Header = () => {


    return (
        <div>
            <ConnectButton />
        </div>
    )
}

export default Header