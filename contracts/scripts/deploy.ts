import { ethers } from 'hardhat'

async function main() {
    const Faucet = await ethers.getContractFactory('TokenFaucet')
    const claimAmount = ethers.parseUnits('0.01', 'ether')

    const faucet = await Faucet.deploy(claimAmount) // Pass token address
    await faucet.waitForDeployment()
    console.log(`TokenFaucet deployed at: ${await faucet.getAddress()}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
