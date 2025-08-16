package main

import (
	"context"
	"fmt"
	"log"

	"github.com/ava-labs/avalanche-tooling-sdk-go/client"
	"github.com/ava-labs/avalanche-tooling-sdk-go/models"
)

func main() {
    // Initialize the Avalanche client
    avaxClient, err := client.NewClient("https://api.avax.network", "YOUR_API_KEY")
    if err != nil {
        log.Fatalf("Failed to create Avalanche client: %v", err)
    }

    // Define the subnet configuration
    subnetConfig := models.SubnetConfig{
        Name:        "MySubnet",
        Description: "This is an example subnet",
        ChainID:    12345,
        TokenSymbol: "MYTOKEN",
        GasFee:     0.0001,
    }

    // Create the subnet
    subnetID, err := avaxClient.CreateSubnet(context.Background(), subnetConfig)
    if err != nil {
        log.Fatalf("Failed to create subnet: %v", err)
    }

    fmt.Printf("Subnet created successfully with ID: %s\n", subnetID)

    // Example of creating a blockchain within the subnet
    chainConfig := models.ChainConfig{
        SubnetID:   subnetID,
        VMID:       "SubnetEVM",
        Genesis:    "genesis.json",
    }

    chainID, err := avaxClient.CreateChain(context.Background(), chainConfig)
    if err != nil {
        log.Fatalf("Failed to create chain: %v", err)
    }

    fmt.Printf("Chain created successfully with ID: %s\n", chainID)
}