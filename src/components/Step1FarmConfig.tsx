import { useFormContext } from "react-hook-form"
import StepController from "./Controller";
import { POOLS, Strategy, Tokens } from "@/utils/constants";
import { useEffect, useState } from "react";
import { useTwapOracle } from "@/context/useTwap";



function Step1FarmConfig() {
    const [dropdown, setDropdown] = useState(false)
    const [dropdown0, setDropdown0] = useState(false)
    const { register, watch, formState: { errors }, setValue } = useFormContext()
    const [poolAddress, setPoolAddress] = useState(POOLS[0].address)
    const { price, updateTwap, isLoading } = useTwapOracle({ poolAddress })

    const [verifierSplit, yodaSplit, asset, lpIncentiveSplit, strategyType] = watch(['verifierIncentiveSplit', 'yieldYodaIncentiveSplit', 'asset', 'lpIncentiveSplit', "strategyType"]);

    useEffect(() => {
        const lpSplit = 100 - verifierSplit - yodaSplit;
        setValue('lpIncentiveSplit', lpSplit);
    }, [verifierSplit, yodaSplit])

    useEffect(() => {

    }, [poolAddress])


    return (
        <div className=" text-[var(--primary)]/80 border-1 text-sm space-y-4 border-[var(--primary)]/20 rounded-2xl p-6">
            <div>
                <p className=" text-[var(--primary)]">Set Farm Parameters</p>
            </div>
            <div>
                <label className="block mb-2 ">Farm Name</label>
                <input
                    {...register('farmName', { required: 'Required', maxLength: 50 })}
                    className="w-full p-2 py-4 bg-[var(--primary)]/15 rounded-xl"
                />
                {errors.farmName && <span className="text-red-500">{errors?.farmName?.message as string}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className=" flex justify-between items-center">
                        <label className=" mb-2 flex">Principal Asset</label>
                        {/* Price updates */}
                        <span className=" text-[var(--primary)]">{isLoading ? "...." : price.toFixed(4)} </span>
                    </div>
                    <div className=" w-full h-[50px] p-2 py-4 relative  bg-[var(--primary)]/15 rounded-xl block">
                        <div onClick={() => setDropdown((prev) => !prev)} className=" h-full w- w-full  rounded-xl flex gap-3 items-center">
                            <div>
                                <img src={`/${Tokens.find((t) => t.address == asset)?.name}.png`} width={30} alt="" />
                            </div>
                            <div>
                                {Tokens.find((t) => t.address == asset)?.name}
                            </div>
                        </div>
                        {
                            dropdown && <div className="absolute top-[110%] cursor-pointer right-0 left-0 h-fit  bg-[var(--background)] rounded-xl">
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
                    <div>

                    </div>
                    <div className=" w-full h-[50px] p-2 py-4 relative  bg-[var(--primary)]/15 rounded-xl block">
                        <div onClick={() => setDropdown0((prev) => !prev)} className=" h-full w- w-full px-2  rounded-xl flex gap-3 items-center">
                            <div>
                                {strategyType.toUpperCase()}
                            </div>
                        </div>
                        {
                            dropdown0 && <div className="absolute top-[110%] cursor-pointer right-0 left-0 h-fit px-4 bg-[var(--background)] rounded-xl">
                                {
                                    Strategy.map((t) => (
                                        <div key={t.type} onClick={() => {
                                            setValue("strategyType", t.type);
                                            setDropdown0(false);
                                        }} className=" w-full h-[80px] rounded-xl text-[var(--primary)] cursor-pointer py-2 flex flex-col gap-1 items-start">
                                            <div>
                                                {t.name}
                                            </div>
                                            <div className=" mb-2 text-xs text-[var(--primary)]/40">
                                                {t.description}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        }
                    </div>
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
                        className="w-full bg-[var(--primary)] "
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
                        className="w-full p-2 py-4 bg-[var(--primary)]/15 rounded-xl"
                    />
                    {errors.claimTokenName && <span className="text-red-500">{errors?.claimTokenName?.message as string}</span>}
                </div>
                <div>
                    <label className="block mb-2 ">Claim Token Symbol</label>
                    <input
                        {...register('claimTokenSymbol', { required: 'Required' })}
                        className="w-full p-2 py-4 bg-[var(--primary)]/15 rounded-xl"
                    />
                    {errors.claimTokenSymbol && <span className="text-red-500">{errors?.claimTokenSymbol?.message as string}</span>}
                </div>
            </div>
            <StepController />
        </div>
    )
}

export default Step1FarmConfig