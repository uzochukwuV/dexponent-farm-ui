import { useFormContext } from "react-hook-form"
import StepController from "./Controller";

function Step1FarmConfig() {
    const { register, watch, setValue, formState: { errors } } = useFormContext();

    const [verifierSplit, yodaSplit] = watch(['verifierIncentiveSplit', 'yieldYodaIncentiveSplit']);

    const lpSplit = 100 - verifierSplit - yodaSplit;
    return (
        <div className=" text-white/80 border-1 text-sm space-y-4 border-white/20 rounded-2xl p-6">
            <div>
                <p className=" text-white">Set Farm Parameters</p>
            </div>
            <div>
                <label className="block mb-2 ">Farm Name</label>
                <input
                    {...register('farmName', { required: 'Required', maxLength: 50 })}
                    className="w-full p-2 py-4 bg-white/15 rounded-xl"
                />
                {errors.farmName && <span className="text-red-500">{errors?.farmName?.message as string}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2">Principal Asset</label>
                    {/* <TokenSelector 
            onChange={(token) => setValue('asset', token.address)}
          /> */}
                </div>

                <div>
                    <label className="block mb-2">Strategy Type</label>
                    <select
                        {...register('strategyType')}
                        
                        className="w-full p-2 py-4  bg-white/15 rounded-xl block"
                    >
                        <option value="yield" className=" bg-transparent ">
                            <div className="py-2 inline-block">
                                Yield Farming
                            </div>
                        </option>
                        <option value="liquidity" className=" bg-transparent ">Liquidity Provision</option>
                        <option value="arbitrage" className=" bg-transparent ">Arbitrage</option>
                    </select>
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="font-semibold">Incentive Splits</h3>

                <div>
                    <label className="block mb-1">Verifiers: {verifierSplit}%</label>
                    <input
                        type="range"
                        min="0"
                        max="30"
                        {...register('verifierIncentiveSplit')}
                        className="w-full bg-transparent"
                    />
                </div>

                <div>
                    <label className="block mb-1">Yield Yodas: {yodaSplit}%</label>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        {...register('yieldYodaIncentiveSplit')}
                        className="w-full"
                    />
                </div>

                <div className=" bg-transparent rounded">
                    <span className="font-medium">LPs: {lpSplit}%</span>
                    <p className="text-sm text-gray-600">Automatically calculated</p>
                </div>
            </div>
            <StepController />
        </div>
    )
}

export default Step1FarmConfig