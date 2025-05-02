import { useStepStore } from "@/context/StepContext"
import Step1FarmConfig from "./Step1FarmConfig"
import Step2FarmConfig from "./Step2FarmConfig"
import { Step3VerifierSettings } from "./Step3FarmConfig"
import { Step4FeeStructure } from "./Step4FeeStructure"
import { FARM_CREATION_STEPS } from "@/utils/constants"
import Step5DeploymentSummary from "./Step5DeploymentSumarry"
import { useFormContext } from "react-hook-form"






function FarmWizard() {
    const { step, move } = useStepStore();
    const {reset} = useFormContext()

    
    

    return (
        <div className=' form-wrapper sansation-regular w-full min-h-screen bg-[var(--background)] px-6 pt-20 '>
            <div className=" max-w-5xl w-full space-y-6 mx-auto">
                <div>
                    <p className=" font-medium text-[var(--primary)]/65"><span>Manager</span><span>- </span><span>Create Farm</span></p>
                </div>
                <div className=" flex justify-between items-center">
                    <h1 className=" text-[var(--primary)] font-medium text-4xl py-1">Farm Manager</h1>
                    <div className=" flex gap-8 items-end">
                        <div onClick={reset} className=" hover:bg-[var(--primary)]/30 px-6 py-1 border border-[var(--primary)]/20 rounded-xl ">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-80q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80Z" /></svg>
                        </div>
                        <div  className=" px-6 py-1 border border-[var(--primary)]/20 rounded-xl ">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>
                        </div>
                    </div>
                </div>
                <div className=" md:grid grid-cols-8 gap-4 antialiased">
                    <div className=" hidden md:block col-span-3">
                        <div id="marks" className=" p-3 border-1 space-y-8 border-[var(--primary)]/20 rounded-3xl">
                            {
                                FARM_CREATION_STEPS.map((s) => (
                                    <div onClick={() => move(s.id)} className=" cursor-pointer hover:bg-[var(--step)]/5 p-2 rounded-2xl flex gap-4 items-center">
                                        <div className={step == s.id ? " h-8 w-8 rounded-full bg-[var(--step)] text-black grid place-items-center font-medium" : " h-8 w-8 rounded-full bg-[var(--primary)]/30 text-[var(--primary)] grid place-items-center font-medium"}>{s.id}</div>
                                        <div className="font-medium text-sm">
                                            <div className=" text-[var(--primary)]/65 text-xs m-0">Step {s.id}</div>
                                            <div className={step == s.id ? " text-[var(--primary)]" : " text-[var(--primary)]/75"}>{s.description}</div>
                                        </div>
                                    </div>
                                ))
                            }

                           
                        </div>
                    </div>
                    <div className=" col-span-5">
                        {
                            step == 1 ? <Step1FarmConfig /> :
                                step == 2 ? <Step2FarmConfig /> :
                                    step == 3 ? <Step3VerifierSettings /> :
                                        step == 4 ? <Step4FeeStructure /> : <Step5DeploymentSummary />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FarmWizard