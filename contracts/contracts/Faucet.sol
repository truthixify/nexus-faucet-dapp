// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenFaucet is Ownable {
    uint256 public claimAmount;
    uint256 public cooldownTime = 1 days; // Users can claim once per day
    mapping(address => uint256) public lastClaimTime;

    event TokensClaimed(address indexed user, uint256 amount);
    event FundsDeposited(address indexed owner, uint256 amount);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    constructor(uint256 _claimAmount) Ownable(msg.sender) {
        claimAmount = _claimAmount;
    }

    /** @dev Allows only the owner to deposit funds into the faucet */
    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Try water the floor if you wan tele tutu");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /** @dev Allows users to claim tokens with a cooldown period */
    function claimTokens() external {
        require(address(this).balance >= claimAmount, "Faucet is broke ASF");
        require(block.timestamp >= lastClaimTime[msg.sender] + cooldownTime, "Your time never reach, do the calms!");

        lastClaimTime[msg.sender] = block.timestamp;
        (bool success, ) = msg.sender.call{value: claimAmount}("");
        require(success, "Something don spoil oooo, run am later");

        emit TokensClaimed(msg.sender, claimAmount);
    }

    /** @dev Allows only the owner to withdraw all remaining funds */
    function withdrawFunds() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Shibor no dey");

        payable(owner()).transfer(balance);
        emit FundsWithdrawn(owner(), balance);
    }

    /** @dev Allows the owner to update the claim amount */
    function setClaimAmount(uint256 _newAmount) external onlyOwner {
        claimAmount = _newAmount;
    }

    /** @dev Allows the owner to update the cooldown period */
    function setCooldownTime(uint256 _newCooldown) external onlyOwner {
        cooldownTime = _newCooldown;
    }
}