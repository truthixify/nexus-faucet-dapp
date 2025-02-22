import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Contract, Signer } from 'ethers'
import { TokenFaucet } from '../typechain-types'

describe('TokenFaucet', function () {
    let faucet: TokenFaucet
    let owner: Signer, user: Signer, recipient: Signer

    beforeEach(async function () {
        ;[owner, user, recipient] = await ethers.getSigners()

        const Faucet = await ethers.getContractFactory('TokenFaucet')
        faucet = await Faucet.deploy(ethers.parseUnits('0.01', 'ether'))
        await faucet.waitForDeployment()
    })

    it('should allow the owner to deposit funds', async function () {
        await expect(faucet.connect(owner).depositFunds({ value: ethers.parseUnits('1', 'ether') }))
            .to.emit(faucet, 'FundsDeposited')
            .withArgs(await owner.getAddress(), ethers.parseUnits('1', 'ether'))
    })

    it('should allow users to claim tokens', async function () {
        await faucet.connect(owner).depositFunds({ value: ethers.parseUnits('1', 'ether') })

        await expect(faucet.connect(user).claimTokens())
            .to.emit(faucet, 'TokensClaimed')
            .withArgs(await user.getAddress(), ethers.parseUnits('0.01', 'ether'))
    })

    it('should enforce the cooldown period', async function () {
        await faucet.connect(owner).depositFunds({ value: ethers.parseUnits('1', 'ether') })
        await faucet.connect(user).claimTokens()

        await expect(faucet.connect(user).claimTokens()).to.be.revertedWith(
            'Your time never reach, do the calms!'
        )
    })

    it('should allow only the owner to withdraw funds', async function () {
        await faucet.connect(owner).depositFunds({ value: ethers.parseUnits('1', 'ether') })

        await expect(faucet.connect(owner).withdrawFunds())
            .to.emit(faucet, 'FundsWithdrawn')
            .withArgs(await owner.getAddress(), ethers.parseUnits('1', 'ether'))
    })

    it('should not allow non-owners to withdraw funds', async function () {
        await faucet.connect(owner).depositFunds({ value: ethers.parseUnits('1', 'ether') })

        await expect(faucet.connect(user).withdrawFunds()).to.be.reverted
    })
})
