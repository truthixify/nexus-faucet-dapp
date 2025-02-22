'use client'

import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, JsonRpcSigner, Contract, parseEther } from 'ethers'
import abi from "../../public/abi.json"

const CONTRACT_ADDRESS = '0x07446d17455F23dFD3eCc2CB8A85c2cc6675595b'
const CONTRACT_ABI = abi.abi
const OWNER = "0x9d96896f517605cb0dab49090f66794f6040faf3"

const NEXUS_CHAIN_ID = '0x188'
const NEXUS_RPC_URL = 'https://rpc.nexus.xyz/http'
const EXPLORER_URL = 'https://explorer.nexus.xyz'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  const [claimAmount, setClaimAmount] = useState<string>('')
  const [coolDownTime, setCoolDownTime] = useState<number>(0)
  const [depositValue, setDepositValue] = useState<string>('')
  const [error, setError] = useState<string>("")
  const [txType, setTxType] = useState<string>("")
  const [isOwner, setIsOwner] = useState<boolean>(false)

  const checkNetwork = useCallback(async () => {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    setIsCorrectNetwork(chainId === NEXUS_CHAIN_ID)
    return chainId === NEXUS_CHAIN_ID
  }, [])

  const checkUser = (address: string) => {
    if (address.toLowerCase() === OWNER) {
        setIsOwner(true)
    }
  }

  const switchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NEXUS_CHAIN_ID }],
      })
      const networkCorrect = await checkNetwork()
      if (networkCorrect) {
        const provider = new BrowserProvider(window.ethereum)
        setSigner(await provider.getSigner())
      }
      return true
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: NEXUS_CHAIN_ID,
              rpcUrls: [NEXUS_RPC_URL],
              chainName: 'Nexus Testnet',
              nativeCurrency: {
                name: 'NEXUS',
                symbol: 'NEXUS',
                decimals: 18
              },
            }],
          })
          const networkCorrect = await checkNetwork()
          if (networkCorrect) {
            const provider = new BrowserProvider(window.ethereum)
            setSigner(await provider.getSigner())
          }
          return true
        } catch (addError) {
            setError(`Error adding network: ${addError}`)
          return false
        }
      }
    }
  }

  const checkWalletConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          const networkCorrect = await checkNetwork()
          setIsConnected(true)
          if (networkCorrect) {
            setSigner(await provider.getSigner())
          }
        }
      } catch (error) {
        setError(`Error checking wallet connection: ${error}`)
      }
    }
  }, [checkNetwork])

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const networkCorrect = await checkNetwork()
        setIsConnected(true)
        if (networkCorrect) {
          setSigner(await provider.getSigner())
        }
      } catch (error) {
        let err = error as any
        err = JSON.parse(JSON.stringify(err))
        setError(err.reason || String(error))
      }
    }
  }

  useEffect(() => {
    checkWalletConnection()

    // Add network change listener
    if (window.ethereum) {
      window.ethereum.on('chainChanged', async () => {
        const networkCorrect = await checkNetwork()
        if (networkCorrect) {
          const provider = new BrowserProvider(window.ethereum)
          setSigner(await provider.getSigner())
        }
      })
    }

    // Cleanup listener
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {
          console.log('Network change listener removed')
        })
      }
    }
  }, [checkNetwork, checkWalletConnection])

  useEffect(() => {
    if (signer) {
        signer.getAddress().then(address => {
            setUserAddress(address)
            checkUser(address)
        })
    }
  }, [signer])

  const claimTokens = async () => {
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const tx = await contract.claimTokens()
      setTxHash(tx.hash)
      setTxType("Faucet claim")
      await tx.wait()
    } catch (error) {
        let err = error as any
        err = JSON.parse(JSON.stringify(err))
        setError(err.reason || String(error))
    }
  }

  const depositFunds = async () => {
    if (!signer) return

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const tx = await contract.depositFunds({
        value: parseEther(depositValue)
      })
      setTxHash(tx.hash)
      setTxType("Deposit funds")
      await tx.wait()
    } catch (error) {
        let err = error as any
        err = JSON.parse(JSON.stringify(err))
        setError(err.reason || String(error))
    }
  }

  const withdrawFunds = async () => {
    if (!signer) return

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const tx = await contract.withdrawFunds()
      setTxHash(tx.hash)
      setTxType("Withdraw funds")
      await tx.wait()
    } catch (error) {
        let err = error as any
        err = JSON.parse(JSON.stringify(err))
        setError(err.reason || String(error))
    }
  }

  const changeClaimAmount = async () => {
    if (!signer) return

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const tx = await contract.setClaimAmount(claimAmount)
      setTxHash(tx.hash)
      setTxType("Change claim amount")
      await tx.wait()
    } catch (error) {
        let err = error as any
        err = JSON.parse(JSON.stringify(err))
        setError(err.reason || String(error))
    }
  }

  const changeCoolDownTime = async () => {
    if (!signer) return

    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    try {
      const tx = await contract.setCooldownTime(coolDownTime)
      setTxHash(tx.hash)
      setTxType("Change cooldowm time")
      await tx.wait()
    } catch (error) {
        let err = error as any
        err = JSON.parse(JSON.stringify(err))
        setError(err.reason || String(error))
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatHash = (hash: string) => {
    if (!hash) return ''
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  return (
    <main className="min-h-screen bg-white relative">
      <div className="absolute top-4 right-4 px-4 py-2 rounded-full border border-black/10">
        <p className="text-sm font-medium text-black/80">
          {isConnected ? formatAddress(userAddress) : 'Not Connected'}
        </p>
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-4xl w-full px-4">
          <div className="space-y-12 text-center">
            <h1 className="text-5xl font-light tracking-tight text-black">
              Nexus Faucet
            </h1>
            
            <div className="space-y-8">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                           hover:bg-gray-800 transition-colors duration-200 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Connect Wallet
                </button>
              ) : !isCorrectNetwork ? (
                <button
                  onClick={switchNetwork}
                  className="px-8 py-3 text-sm font-medium text-black bg-transparent border-2 border-black rounded-full 
                           hover:bg-black/10 transition-colors duration-200
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Switch to Nexus Network
                </button>
              ) : (
                isOwner ? 
                (
                    <div className='flex flex-col gap-8'>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-black">
                                <input className='w-20 px-4 py-3 border-2 border-black rounded-lg px-4 focus:outline-none text-center' type='text' onChange={(e) => setClaimAmount(e.target.value)} value={claimAmount}/>
                            </div>
                            <div className="flex flex-col items-center">
                                <button
                                onClick={changeClaimAmount}
                                className="w-60 px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                                        hover:bg-gray-800 transition-colors duration-200
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                >
                                Change ClaimAmount
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-black">
                                <input className='w-20 px-4 py-3 border-2 border-black rounded-lg px-4 focus:outline-none text-center' type='text' onChange={(e) => setCoolDownTime(Number(e.target.value) || 0)} value={coolDownTime}/>
                            </div>
                            <div className="flex flex-col items-center">
                                <button
                                onClick={changeCoolDownTime}
                                className="w-60 px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                                        hover:bg-gray-800 transition-colors duration-200
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                >
                                Change CoolDownTime
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-black">
                                <input className='w-20 px-4 py-3 border-2 border-black rounded-lg px-4 focus:outline-none text-center' type='text' onChange={(e) => setDepositValue(e.target.value)} value={depositValue}/>
                            </div>
                            <div className="flex flex-col items-center">
                                <button
                                onClick={depositFunds}
                                className="w-60 px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                                        hover:bg-gray-800 transition-colors duration-200
                                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                                >
                                Deposit Funds
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <button
                            onClick={withdrawFunds}
                            className="w-80 px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                                    hover:bg-gray-800 transition-colors duration-200
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                            >
                            Withdraw Funds
                            </button>
                        </div>
                        {(!error && txType) && (
                            <a
                                href={`${EXPLORER_URL}/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 
                                        transition-colors duration-200"
                                aria-label={`View transaction ${formatHash(txHash)} on Nexus Explorer`}
                            >
                                <span className="mr-1">{txType}:</span>
                                <span className="font-medium">{formatHash(txHash)}</span>
                                <svg 
                                className="w-3.5 h-3.5 ml-1" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                />
                                </svg>
                            </a>
                        )}
                        {error &&
                            <div className='text-red-400'>Error: {error}</div>
                        }
                    </div>
                ) : 
                (
                    <div className="w-full flex flex-col gap-8">
                        <div className="text-black">
                            <input className='w-3/5 px-4 py-3 border-2 border-black rounded-lg px-4 focus:outline-none text-center' type='text' value={userAddress} readOnly/>
                        </div>
                        <div className="flex flex-col items-center">
                            <button
                            onClick={claimTokens}
                            className="w-60 px-8 py-3 text-sm font-medium text-white bg-black rounded-full 
                                    hover:bg-gray-800 transition-colors duration-200
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                            >
                            Claim Token
                            </button>
                            {txHash && (
                            <a
                                href={`${EXPLORER_URL}/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 
                                        transition-colors duration-200"
                                aria-label={`View transaction ${formatHash(txHash)} on Nexus Explorer`}
                            >
                                <span className="mr-1">Latest tx:</span>
                                <span className="font-medium">{formatHash(txHash)}</span>
                                <svg 
                                className="w-3.5 h-3.5 ml-1" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                />
                                </svg>
                            </a>
                            )}
                        </div>
                    </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 