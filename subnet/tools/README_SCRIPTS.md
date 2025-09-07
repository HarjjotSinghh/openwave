# README for Scripts

This document provides an overview of the scripts available in the `nextjs-AVAX-subnet` project, detailing their purpose and usage.

## Scripts Overview

### 1. Subnet Scripts

- **create_subnet.sh**
  - **Purpose**: Automates the process of creating a new AVAX subnet.
  - **Usage**: Run this script to initialize a subnet with the specified configuration. Ensure that the necessary environment variables and configurations are set before execution.

- **deploy_chain.sh**
  - **Purpose**: Automates the deployment of a new blockchain within the created subnet.
  - **Usage**: Execute this script after creating a subnet to deploy a blockchain. It will use the subnet configuration to set up the blockchain parameters.

### 2. Fund and Transaction Scripts

- **fund_pchain.ts**
  - **Purpose**: Funds the P-Chain with AVAX to facilitate transaction fees and subnet creation.
  - **Usage**: Run this TypeScript script to transfer AVAX to the P-Chain. Ensure that your wallet is connected and has sufficient AVAX balance.

- **sign_tx.ts**
  - **Purpose**: Handles the signing of transactions to ensure they are valid before being sent to the network.
  - **Usage**: Use this script to sign transactions generated for subnet and blockchain operations. It ensures that all transactions are properly signed and ready for submission.

### 3. Infrastructure Scripts

- **docker-compose.yml**
  - **Purpose**: Defines the Docker configuration for running the AVAX node and associated services.
  - **Usage**: Use Docker Compose to spin up the necessary services for the AVAX network. This file contains the configuration for the node and any dependencies.

- **main.tf**
  - **Purpose**: Sets up the infrastructure needed for deploying the AVAX subnet and its components using Terraform.
  - **Usage**: Run this Terraform configuration to provision the required resources for your subnet deployment.

## Conclusion

These scripts are essential for managing the lifecycle of your AVAX subnet and its associated blockchains. Ensure to follow the usage instructions carefully to avoid any issues during execution. For further details on each script, refer to the specific script files in the project.