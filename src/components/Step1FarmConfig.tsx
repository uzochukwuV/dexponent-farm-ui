import { useFormContext } from "react-hook-form"
import StepController from "./Controller";
import { POOLS, Tokens } from "@/utils/constants";
import { useEffect, useState } from "react";
import { useTwapOracle } from "@/context/useTwap";



function Step1FarmConfig() {
    const [dropdown, setDropdown] = useState(false)
    const { register, watch, formState: { errors }, setValue } = useFormContext()
    const [poolAddress, setPoolAddress] = useState(POOLS[0].address)
    const { price, updateTwap, isLoading } = useTwapOracle({ poolAddress })

    const [verifierSplit, yodaSplit, asset, lpIncentiveSplit] = watch(['verifierIncentiveSplit', 'yieldYodaIncentiveSplit', 'asset', 'lpIncentiveSplit']);

    useEffect(() => {
        const lpSplit = 100 - verifierSplit - yodaSplit;
        setValue('lpIncentiveSplit', lpSplit);
    }, [verifierSplit, yodaSplit])

    useEffect(() => {

    }, [poolAddress])


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
                    <div className=" flex justify-between items-center">
                        <label className=" mb-2 flex">Principal Asset</label>
                        {/* Price updates */}
                        <span className=" text-white">{isLoading ? "...." : price.toFixed(4)} </span>
                    </div>
                    <div className=" w-full h-[50px] p-2 py-4 relative  bg-white/15 rounded-xl block">
                        <div onClick={() => setDropdown((prev) => !prev)} className=" h-full w- w-full  rounded-xl flex gap-3 items-center">
                            <div>
                                <img src={`/${Tokens.find((t) => t.address == asset)?.name}.png`} width={30} alt="" />
                            </div>
                            <div>
                                {Tokens.find((t) => t.address == asset)?.name}
                            </div>
                        </div>
                        {
                            dropdown && <div className="absolute top-[110%] cursor-pointer right-0 left-0 h-fit  bg-[#131313] rounded-xl">
                                {
                                    Tokens.map((t) => (
                                        <div key={t.address} onClick={() => {
                                            setValue("asset", t.address);
                                            setDropdown(false)
                                            setPoolAddress(POOLS.find((p) => p.name == `${t.name}/USDT`)?.address!)
                                            console.log(POOLS.find((p) => p.name == `${t.name}/USDT`))
                                            updateTwap(POOLS.find((p) => p.name == `${t.name}/USDT`)?.address!)

                                        }} className=" w-full h-[50px] rounded-xl cursor-pointer flex gap-4 items-center">
                                            <div>
                                                <img src={`/${t.name}.png`} width={30} alt="" />
                                            </div>
                                            <div>
                                                {t.name}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        }
                    </div>
                </div>

                <div>
                    <label className="block mb-2">Strategy Type</label>
                    <select
                        {...register('strategyType')}

                        className="w-full p-2 py-4  bg-white/15 rounded-xl block"
                    >
                        <option value="yield" className=" bg-black ">
                            Yield Farming
                        </option>
                        <option value="liquidity" className=" bg-black ">Liquidity Provision</option>
                        <option value="arbitrage" className=" bg-black ">Arbitrage</option>
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
                    <span className="font-medium">LPs: {lpIncentiveSplit}%</span>
                    <p className="text-sm text-gray-600">Automatically calculated</p>
                </div>
                <div>
                    <label className="block mb-2 ">Claim Token Name</label>
                    <input
                        {...register('claimTokenName', { required: 'Required' })}
                        className="w-full p-2 py-4 bg-white/15 rounded-xl"
                    />
                    {errors.claimTokenName && <span className="text-red-500">{errors?.claimTokenName?.message as string}</span>}
                </div>
                <div>
                    <label className="block mb-2 ">Claim Token Symbol</label>
                    <input
                        {...register('claimTokenSymbol', { required: 'Required' })}
                        className="w-full p-2 py-4 bg-white/15 rounded-xl"
                    />
                    {errors.claimTokenSymbol && <span className="text-red-500">{errors?.claimTokenSymbol?.message as string}</span>}
                </div>
            </div>
            <StepController />
        </div>
    )
}

export default Step1FarmConfig