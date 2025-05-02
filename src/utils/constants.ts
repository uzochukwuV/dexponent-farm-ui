export const FARM_CREATION_STEPS = [
    {
      id: 1,
      name: "Farm Configuration",
      description: "Set basic farm parameters and incentive structure",
      key: 'configuration'
    },
    {
      id: 2,
      name: "Strategy Parameters",
      description: "Define investment strategy and risk parameters",
      key: 'strategy'
    },
    {
      id: 3,
      name: "Verifier Requirements",
      description: "Configure verifier staking and qualifications",
      key: 'verifiers'
    },
    {
      id: 4,
      name: "Fee Structure",
      description: "Set performance and management fees",
      key: 'fees'
    },
    {
      id: 5,
      name: "Review & Deploy",
      description: "Confirm all settings and deploy your farm",
      key: 'deploy'
    }
  ] as const;
  
  // TypeScript type for the steps
  export type FarmCreationStep = typeof FARM_CREATION_STEPS[number];




  export const Tokens = [
    {
      name:"USDC",
      address:"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    {
      name:"WBTC",
      address:"0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    {
      name:"DAI",
      address:"0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    {
      name:"ETH",
      address:'0x0000000000000000000000000000000000000000'
    }
    
  ]


  export const POOLS = [
    {
      name:"WBTC/USDT",
      address:"0x9Db9e0e53058C89e5B94e29621a205198648425B"
    },
    {
      name:"ETH/USDT",
      address: "0xc7bBeC68d12a0d1830360F8Ec58fA599bA1b0e9b"
    },
    {
      name:"DAI/USDT",
      address:"0x48DA0965ab2d2cbf1C17C09cFB5Cbe67Ad5B1406"
    },
    {
      name:"USDC/USDT",
      address:"0x3416cF6C708Da44DB2624D63ea0AAef7113527C6"
    }
  ]