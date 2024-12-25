#!/bin/bash

mkdir -p public/images

# Download USDC logo
curl -o public/images/usdc-logo.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"

# Download SOL logo
curl -o public/images/sol-logo.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"

# Download Raydium logo
curl -o public/images/raydium-logo.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png"

# Download Orca logo
curl -o public/images/orca-logo.png "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE/logo.png"

# Download System Program logo
curl -o public/images/system-program.png "https://solscan.io/static/media/system-program.d4777cd3.png"

# Create placeholder images for others
convert -size 100x100 xc:purple public/images/moonpay-logo.svg
convert -size 100x100 xc:purple public/images/buy-crypto.svg
convert -size 100x100 xc:orange public/images/coin1.png
convert -size 100x100 xc:blue public/images/coin2.png
convert -size 100x100 xc:green public/images/coin3.png
convert -size 100x100 xc:red public/images/coin4.png 