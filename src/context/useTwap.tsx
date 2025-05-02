import { UniswapV3TwapOracle } from "@/utils/uniswap";
import { useEthersProvider } from "./WalletContext";
import { useEffect, useState } from "react";

/**
 * Example usage function to demonstrate the oracle 
 * @returns {number} price
 */
export function useTwapOracle({poolAddress}:any): { price: number; updateTwap : (address:string)=>void, isLoading:boolean  } {
    const provider = useEthersProvider()
    const [price, setPrice]= useState(0)
    const [isLoading, setLoading] = useState(false)
    
    // Pool address for the token pair y ou want to track
    // Example: USDC/WETH pool on Ethereum mainnet with 0.05% fee
    // Replace with the actual pool address relevant to your Farm's principal asset and DXP
    useEffect(()=>{
        setLoading(true)
        const twapOracle = new UniswapV3TwapOracle({ provider, poolAddress });
        twapOracle.initialize().then(()=>{
            twapOracle.getCurrentPrice().then((value)=>{
                console.log(value)
                setPrice(value.price)
                setLoading(false)
            })
        })
    },[ ])

    const updateTwap = (address:string) =>{
        console.log(address)
        setLoading(true)
        const twapOracle = new UniswapV3TwapOracle({ provider, poolAddress:address });
        twapOracle.initialize().then(()=>{
            twapOracle.getCurrentPrice().then((value)=>{
                console.log(value)
                setPrice(value.price)
                setLoading(false)
            })
        })
    }



    return {
        price,
        updateTwap,
        isLoading
    }


}
