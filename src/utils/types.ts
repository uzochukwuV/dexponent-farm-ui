
// TypeScript interface for all form values
export interface FarmFormValues {
    // Step 1: Farm Configuration
    farmName: string;
    asset: string; // Token address
    strategyType: 'yield' | 'liquidity' | 'arbitrage' | 'lending';
    verifierIncentiveSplit: number;
    yieldYodaIncentiveSplit: number;
    lpIncentiveSplit:number;
    
    // Step 2: Strategy Parameters
    targetAPY: number;
    maturityDays: number;
    collateralAssets: {
      address: string;
      allocation: number;
      slippageTolerance?: number;
    }[];
    maxDrawdown: number;
    volatilityThreshold?: number;
  
    // Step 3: Verifier Requirements
    minVerifierStake: number; // DXP amount
    stakeLockupDays: number;
    minVerifierScore: number;
    requiredExperience?: string[];
  
    // Step 4: Fee Structure
    performanceFee: number;
    managementFee: number;
    feeRecipient: string;
    feeDistribution: 'instant' | 'weekly' | 'monthly';
  
    // Step 5: Review & Deployment
    termsAccepted: boolean;
    claimTokenName: string;
    claimTokenSymbol:string;
    farmOwner: string | `0x${string}`;
  }