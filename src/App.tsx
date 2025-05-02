import FarmWizard from "./components/FarmWizard"

import { useForm, FormProvider, type Resolver } from "react-hook-form"

import Header from "./components/Header";
import { WalletContextProvider } from "./context/WalletContext";
import type { FarmFormValues } from "./utils/types";


// Custom resolver with comprehensive validation
export const farmResolver: Resolver<FarmFormValues> = async (values) => {
  const errors: Record<string, any> = {};

  // Step 1 Validations
  if (!values.farmName || values.farmName.length < 3) {
    errors.farmName = {
      type: 'required',
      message: 'Farm name must be at least 3 characters'
    };
  }

  if (!values.asset && !/^0x[a-fA-F0-9]{40}$/.test(values.asset)) {
    errors.asset = {
      type: 'required',
      message: 'Principal asset is required'
    };
  }

  const totalSplits = (values.verifierIncentiveSplit || 0) +
    (values.yieldYodaIncentiveSplit || 0);

  if (totalSplits > 100) {
    errors.verifierIncentiveSplit = {
      type: 'validate',
      message: 'Total incentive splits cannot exceed 100%'
    };
    errors.yieldYodaIncentiveSplit = {
      type: 'validate',
      message: 'Total incentive splits cannot exceed 100%'
    };
  }

  // Step 2 Validations
  if (!values.targetAPY || values.targetAPY <= 0) {
    errors.targetAPY = {
      type: 'min',
      message: 'Target APY must be positive'
    };
  }

  if (!values.maturityDays || values.maturityDays < 7) {
    errors.maturityDays = {
      type: 'min',
      message: 'Minimum maturity period is 7 days'
    };
  }

  if (values.collateralAssets) {
    const totalAllocation = values.collateralAssets.reduce(
      (sum, asset) => sum + (asset.allocation || 0), 0
    );

    if (Math.abs(totalAllocation - 100) > 0.1) { // Allow for floating point imprecision
      errors.collateralAssets = {
        type: 'validate',
        message: 'Asset allocations must sum to 100%'
      };
    }
  }

  // Step 3 Validations
  if (!values.minVerifierStake || values.minVerifierStake < 100) {
    errors.minVerifierStake = {
      type: 'min',
      message: 'Minimum verifier stake is 100 DXP'
    };
  }

  // Step 4 Validations
  if (values.performanceFee && values.performanceFee > 30) {
    errors.performanceFee = {
      type: 'max',
      message: 'Performance fee cannot exceed 30%'
    };
  }
  // Assuming 'values' is an object containing form values and 'errors' is an object to store validation errors

// Validation for Claim Token Address
if (values.claimTokenName ) {
  errors.claimToken = {
    type: 'required',
    message: 'Invalid Claim Token name is required'
  };
}
// You might also want a 'required' validation if the claim token is mandatory
if (!values.claimTokenSymbol) {
  errors.claimToken = {
    type: 'required',
    message: 'Claim Token symbol is required.'
  };
}


// Validation for Farm Owner Address
if (values.farmOwner && !/^0x[a-fA-F0-9]{40}$/.test(values.farmOwner)) {
  errors.farmOwner = {
    type: 'pattern',
    message: 'Invalid Farm Owner address. Must be a valid Ethereum address.'
  };
}
// The farm owner is typically the connected wallet address, so it might always be present,
// but a 'required' check can be added for robustness if needed.
if (!values.farmOwner) {
  errors.farmOwner = {
    type: 'required',
    message: 'Farm Owner address is required.'
  };
}
  if (values.feeRecipient && !/^0x[a-fA-F0-9]{40}$/.test(values.feeRecipient)) {
    errors.feeRecipient = {
      type: 'pattern',
      message: 'Invalid Ethereum address'
    };
  }

  // Step 5 Validations
  if (!values.termsAccepted) {
    errors.termsAccepted = {
      type: 'required',
      message: 'You must accept the terms to proceed'
    };
  }

  return {
    values: Object.keys(errors).length === 0 ? values : {},
    errors
  };
};

// Custom hook to use the form
export const useFarmForm = () => {
  return useForm<FarmFormValues>({
    resolver: farmResolver,
    defaultValues: {
      strategyType: 'yield',
      verifierIncentiveSplit: 10,
      yieldYodaIncentiveSplit: 5,
      performanceFee: 15,
      managementFee: 1,
      feeDistribution: 'weekly',
      collateralAssets: [],
      termsAccepted: false,
      claimTokenName: "",
      claimTokenSymbol:"",
      farmOwner:""
    },
    mode: 'onBlur'
  });
};

function App() {
  const methods = useFarmForm();
  const onSubmit = (data: any) => console.log(data);

  return (
    <WalletContextProvider>
      <Header />
      <FormProvider {...methods} >
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <FarmWizard />
        </form>
      </FormProvider>
    </WalletContextProvider>
  )
}

export default App
