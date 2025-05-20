"use client";

import { BACKEND_URL } from "@/app/config";
import { Appbar } from "@/components/Appbar";
import { Input } from "@/components/input";
import { ZapCell } from "@/components/ZapCell";
import { LinkButton } from "@/components/buttons/LinkButton";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function useAvailableActionsAndTriggers() {
    const [availableActions, setAvailableActions] = useState([]);
    const [availableTriggers, setAvailableTriggers] = useState([]);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/api/v1/trigger/available`)
            .then(x => setAvailableTriggers(x.data.availableTriggers))
            console.log(availableTriggers)
        axios.get(`${BACKEND_URL}/api/v1/action/available`)
            .then(x => setAvailableActions(x.data.availableActions))
            console.log()
    }, [])

    return {
        availableActions,
        availableTriggers
    }
}

export default function() {
    const router = useRouter();
    const { availableActions, availableTriggers } = useAvailableActionsAndTriggers();
    const [selectedTrigger, setSelectedTrigger] = useState<{
        id: string;
        name: string;
    }>();

    const [selectedActions, setSelectedActions] = useState<{
        index: number;
        availableActionId: string;
        availableActionName: string;
        metadata: any;
    }[]>([]);
    const [selectedModalIndex, setSelectedModalIndex] = useState<null | number>(null);

    return <div>
        <Appbar />
        <div className="flex justify-end bg-slate-200 p-4">
            <PrimaryButton onClick={async () => {
                if (!selectedTrigger?.id) {
                    return;
                }

                const response = await axios.post(`${BACKEND_URL}/api/v1/zap`, {
                    "availableTriggerId": selectedTrigger.id,
                    "triggerMetadata": {},
                    "actions": selectedActions.map(a => ({
                        availableActionId: a.availableActionId,
                        actionMetadata: a.metadata
                    }))
                }, {
                    headers: {
                        Authorization: localStorage.getItem("token")
                    }
                })
                
                router.push("/dashboard");

            }}>Publish</PrimaryButton>
        </div>
        <div className="w-full min-h-screen bg-slate-200 flex flex-col justify-center">
            <div className="flex justify-center w-full">
                <ZapCell onClick={() => {
                    setSelectedModalIndex(1);
                }} name={selectedTrigger?.name ? selectedTrigger.name : "Trigger"} index={1} />
            </div>
            <div className="w-full pt-2 pb-2">
                {selectedActions.map((action, index) => <div className="pt-2 flex justify-center"> <ZapCell onClick={() => {
                    setSelectedModalIndex(action.index);
                }} name={action.availableActionName ? action.availableActionName : "Action"} index={action.index} /> </div>)}
            </div>
            <div className="flex justify-center">
                <div>
                    <PrimaryButton onClick={() => {
                        setSelectedActions(a => [...a, {
                            index: a.length + 2,
                            availableActionId: "",
                            availableActionName: "",
                            metadata: {}
                        }])
                    }}><div className="text-2xl">
                        +
                    </div></PrimaryButton>
                </div>
            </div>
        </div>
        {selectedModalIndex && <Modal availableItems={selectedModalIndex === 1 ? availableTriggers : availableActions} onSelect={(props: null | { name: string; id: string; metadata: any; }) => {
            if (props === null) {
                setSelectedModalIndex(null);
                return;
            }
            if (selectedModalIndex === 1) {
                setSelectedTrigger({
                    id: props.id,
                    name: props.name
                })
            } else {
                setSelectedActions(a => {
                    let newActions = [...a];
                    newActions[selectedModalIndex - 2] = {
                        index: selectedModalIndex,
                        availableActionId: props.id,
                        availableActionName: props.name,
                        metadata: props.metadata
                    }
                    return newActions
                })
            }
            setSelectedModalIndex(null);
        }} index={selectedModalIndex} />}
    </div>
}

function Modal({ index, onSelect, availableItems }: { index: number, onSelect: (props: null | { name: string; id: string; metadata: any; }) => void, availableItems: {id: string, name: string, image: string;}[] }) {
    const [step, setStep] = useState(0);
    const [selectedAction, setSelectedAction] = useState<{
        id: string;
        name: string;
    }>();
    const isTrigger = index === 1;
     const [showGoogleFormPopup, setShowGoogleFormPopup] = useState(false);
    return <div className="fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-slate-100 bg-opacity-70 flex">
        <div className="relative p-4 w-full max-w-2xl max-h-full">
            <div className="relative bg-white rounded-lg shadow ">
                <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t ">
                    <div className="text-xl">
                        Select {index === 1 ? "Trigger" : "Action"}
                    </div>
                    <button onClick={() => {
                        onSelect(null);
                    }} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center" data-modal-hide="default-modal">
                        <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                </div>
                
                <div className="p-4 md:p-5 space-y-4">
                    {step === 1 && selectedAction?.name === "email" && <EmailSelector setMetadata={(metadata) => {
                        console.log(metadata)
                        onSelect({
                            ...selectedAction,
                            metadata
                        })
                    }} />}

                    {(step === 1 && selectedAction?.name === "solana") && <SolanaSelector setMetadata={(metadata) => {
                        console.log(metadata)
                        onSelect({
                            ...selectedAction,
                            metadata
                        })
                    }} />}

                    {step === 0 && Array.isArray(availableItems) &&<div>{availableItems?.map(({id, name, image}) => {  
                            return <div key={id} onClick={() => {
                                if (isTrigger) {
                                    if (name === "google-form") {
                              // if google-form trigger selected
                              setShowGoogleFormPopup(true);
                            } else {
                                    onSelect({
                                        id,
                                        name,
                                        metadata: {}
                                    })}
                                } else {
                                    setStep(s => s + 1);
                                    setSelectedAction({
                                        id,
                                        name
                                    })
                                }
                            }} className="flex border p-4 cursor-pointer hover:bg-slate-100">
                                <img src={image} width={30} className="rounded-full" /> <div className="flex flex-col justify-center"> {name} </div>
                            </div>
                        })}</div>}                    
                </div>
            </div>
        </div>
         {showGoogleFormPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-100 bg-opacity-70 z-60">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">
             Steps to set up webhook on google form
            </h2>
             <ol className="list-decimal pl-5 text-gray-700 space-y-2 mb-4 text-sm">
                <li>Open your Google Form.</li>
                <li>Click on the 3 dots (⋮) in the top-right corner and select <strong>'Script Editor'</strong>.</li>
                <li>In the Apps Script editor, paste the provided code snippet.</li>
                <li>Replace the webhook URL in the code with your generated Zapier clone webhook URL.</li>
                <li>Save the script.</li>
                <li>Go to <strong>Triggers</strong> (clock icon on left sidebar) → Click 'Add Trigger'.</li>
                <li>Select the <strong>'onFormSubmit'</strong> function, Event type <strong>'On form submit'</strong>, and save.</li>
                <li>Now every time someone submits the form, it'll send data to your Zap.</li>
             </ol>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowGoogleFormPopup(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // continue selecting trigger with metadata (or empty)
                  onSelect({
                    id: "google-form-id", // replace with real id if needed
                    name: "google-form",
                    metadata: {},
                  });
                  setShowGoogleFormPopup(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
}

function EmailSelector({setMetadata}: {
    setMetadata: (params: any) => void;
}) {
    const [email, setEmail] = useState("");
    const [body, setBody] = useState("");

    return <div>
        <Input label={"To"} type={"text"} placeholder="To" onChange={(e) => setEmail(e.target.value)}></Input>
        <Input label={"Body"} type={"text"} placeholder="Body" onChange={(e) => setBody(e.target.value)}></Input>
        <div className="pt-2">
            <PrimaryButton onClick={() => {
                setMetadata({
                    email,
                    body
                })
            }}>Submit</PrimaryButton>
        </div>
    </div>
}

function SolanaSelector({setMetadata}: {
    setMetadata: (params: any) => void;
}) {
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");    

    return <div>
        <Input label={"To"} type={"text"} placeholder="To" onChange={(e) => setAddress(e.target.value)}></Input>
        <Input label={"Amount"} type={"text"} placeholder="To" onChange={(e) => setAmount(e.target.value)}></Input>
        <div className="pt-4">
        <PrimaryButton onClick={() => {
            setMetadata({
                amount,
                address
            })
        }}>Submit</PrimaryButton>
        </div>
    </div>
}