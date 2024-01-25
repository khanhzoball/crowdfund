import React, { useEffect, useState } from 'react';
import { useWeb3Contract } from "react-moralis";
import {abi, contractAddresses} from "../constants";
import { useMoralis } from "react-moralis";
import Moralis from 'moralis-v1';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';

const CampaignFactory = () => {
    const {chainId: chainIdHex, isWeb3Enabled, account} = useMoralis()
    const [campaignFactory, setCampaignFactory] = useState([]);
    const [newCampaignName, setNewCampaignName] = useState("");
    const [refresh, setRefresh] = useState(false);

    // Determines the blockchain network
    const chainId = parseInt(chainIdHex); 
    // Address if the CampaignFactory smart contract for the network
    const contractAddress = chainId in contractAddresses ? contractAddresses[chainId][0]: null;

    // Retreives campaigns and summaries by making a function call to the deployed contract
    const {runContractFunction: getAllCampaignSummary} = useWeb3Contract({
        abi: abi,
        contractAddress: contractAddress,
        functionName: "getAllCampaignSummary",
        params: {

        },
    })

    // creates a new campaign
    const {runContractFunction: createCampaign} = useWeb3Contract({
        abi: abi,
        contractAddress: contractAddress,
        functionName: "createCampaign",
        params: {
            name: newCampaignName
        },
    })

    // on load, whenever refresh is called, or login/logout/network switch happens
    useEffect (() => {
        async function updateUI() {
            let campaigns = await getAllCampaignSummary();
            setCampaignFactory(campaigns);
        }
        
        if (isWeb3Enabled){
            updateUI()
        }
    }, [isWeb3Enabled, refresh])
    

    const CAMPAIGN_MAPPER = ({ i_campaignName, campaignAddress, campaignBalance, fundersCount, i_owner, campaignIndex }) => {
        const [fundAmount, setFundAmount] = useState(0); // amount user wants to fund campaign
        const [funded, setFunded] = useState(false); // is user a funder?
        const [openFund, setOpenFund] = useState(false); // open fund modal 
        const [openRequests, setOpenRequests] = useState(false); // open requests modal
        const [openCreateRequest, setOpenCreateRequest] = useState(false); // open request creation modal
        const [requestName, setRequestName] = useState(""); // name for new request
        const [requestDescription, setRequestDescription] = useState(""); // description for new request
        const [requestAmount, setRequestAmount] = useState(0); // amount of cryptocurrency to be requested
        const [requests, setRequests] = useState([]); // array for request for the campaign
        const isOwner = account.toLowerCase() === i_owner.toLowerCase();

        // onclick to close any modal
        const handleClose = () => {
            setOpenFund(false)
            setOpenRequests(false)
            setOpenCreateRequest(false)
        };

        // onclick to open the funding modal
        const handleOpenFund = () => {
            console.log(account)
            setOpenFund(true)
        };

        // onclick to open the request creation modal
        const handleOpenCreateRequest = () => {
            console.log(account)
            setOpenCreateRequest(true)
        };

        // opens request modal and fetches the requests for the selected campaign
        const handleOpenRequests = () => {
            async function updateUI() {
                try {
                    let temp = await Moralis.executeFunction(
                        {
                            abi: abi,
                            contractAddress: contractAddress,
                            functionName: "getAllRequestForCampaign",
                            params: {
                                campaignIndex: campaignIndex
                            },
                            gasLimit: 3000000000000,
                        }
                    );
                    setRequests(temp)
    
                } catch(e) {
                    console.log(e.message)
                }
            }
    
            updateUI()
            setOpenRequests(true)
        };

        // checks if user is a funder for the campaign
        async function checkIfFunder() {
            let temp = await Moralis.executeFunction({
                abi: abi,
                contractAddress: contractAddress,
                functionName: "addressToFunderForCampaign",
                params: {
                    campaignIndex: campaignIndex
                },
                gasLimit: 3000000000000,
            })
            setFunded(temp);
        }

        checkIfFunder()

        return (
            <div>
                <b>Campaign Name:</b> {i_campaignName} <br/>
                <b>Campaign Balance:</b> {campaignBalance/1000000000000000000} ether<br/>
                <b>Amount of Funders:</b> {fundersCount} <br/>
                <b>Campaign Address:</b> {campaignAddress.slice(0, 6)}...{campaignAddress.slice(campaignAddress.length - 6)} <br/>
                <b>Campaign Owner:</b> {i_owner.slice(0, 6)}...{i_owner.slice(i_owner.length - 6)} <br/>
                <div>
                    <Button onClick={() => {handleOpenRequests()}}>View requests</Button>
                    <Modal
                        open={openRequests}
                        onClose={handleClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box className="box">
                        <div style={{textAlign: 'center'}}>
                            <b>Requests</b>
                            <br/>
                            <b>Rules:</b><br/>
                            1 - Must be owner to fulfill request <br/>
                            2 - Need majority approve to fulfill request <br/>
                            3 - Must be funder to approve request <br/>
                            4 - Cannot approve request more than once
                        </div>
                            {
                                requests.map( (request, requestIndex) => {
                                    return <REQUEST_MAPPER
                                        campaignIndex={campaignIndex}
                                        requestIndex={requestIndex} 
                                        name={request.name}
                                        description={request.description}
                                        requestAmount={request.requestAmount.toNumber()}
                                        approvalCount={request.approvalCount.toNumber()}
                                        fundersCount={fundersCount}
                                        fulfilled={request.fulfilled}
                                        isOwner={isOwner}
                                        funded={funded}
                                    />
                                })
                            }
                        </Box>
                    </Modal>
                </div>
                {
                    isOwner ? (
                        <div>
                            <Button onClick={() => {handleOpenCreateRequest(campaignIndex)}}>Create a Request</Button>
                            <Modal
                                open={openCreateRequest}
                                onClose={handleClose}
                                id={campaignIndex}
                            >
                                <Box className="box">
                                <b>Request Name: </b><input type="text" value={requestName} onChange={(e) => {setRequestName(e.target.value)}} placeholder="name"/> <br/>
                                <b>Request description: </b><input type="text" value={requestDescription} onChange={(e) => {setRequestDescription(e.target.value)}}  placeholder="description"/> <br/>
                                <b>Request Amount: </b><input type="number"  value={requestAmount} onChange={(e) => {setRequestAmount(e.target.value)}} placeholder="request amount"/> wei<br/>
                                <button onClick={ () => {CreateRequest(campaignIndex, requestName, requestDescription, requestAmount)}}>Create Request</button>
                                </Box>
                            </Modal>
                        </div>      
                    ) : (
                        <div>
                            <Button onClick={() => {handleOpenFund(campaignIndex)}}>Fund</Button>
                            <Modal
                                open={openFund}
                                onClose={handleClose}
                                id={campaignIndex}
                            >
                                <Box className="box">
                                <input type="number" value={fundAmount} onChange={(e) => {setFundAmount(e.target.value)}} placeholder="amount to fund"/> wei<br/>
                                <button onClick={ () => {FundCampaign(campaignIndex, fundAmount)}}>Fund this campaign</button>
                                </Box>
                            </Modal>
                        </div>                        
                    )
                }

                <div>
                    {funded ? 
                        (<span> You are a funder !</span>) 
                        : 
                        ("")
                    }
                </div>
            </div>
        );
    };
    
    const REQUEST_MAPPER = ({campaignIndex, requestIndex, name, description, requestAmount, approvalCount, fundersCount, fulfilled, isOwner, funded}) => {

        const approveRequest = () => {
            async function updateUI() {
                try {
                    await Moralis.executeFunction(
                        {
                            abi: abi,
                            contractAddress: contractAddress,
                            functionName: "approveRequestForCampaign",
                            params: {
                                campaignIndex: campaignIndex,
                                requestIndex: requestIndex
                            },
                            gasLimit: 3000000000000,
                        }
                    )
                } catch(e) {
                    console.log(e.message)
                }
            }
            updateUI()
        };

        const fulfillRequest = () => {
            async function updateUI() {
                try {
                    await Moralis.executeFunction(
                        {
                            abi: abi,
                            contractAddress: contractAddress,
                            functionName: "fulfillRequestForCampaign",
                            params: {
                                campaignIndex: campaignIndex,
                                requestIndex: requestIndex
                            },
                            gasLimit: 3000000000000,
                        }
                    )
                } catch(e) {
                    console.log(e.message)
                }
            }
            updateUI()
        };


        return(
            <div className='request'>
                <div>
                    <b>{name}</b> : {description} <br/>
                    request amount: {requestAmount} wei
                </div>
                <div>
                    approvalCount: {approvalCount}
                    {!fulfilled ? 
                            funded ? (
                                <button onClick={ () => {approveRequest()}}>
                                    approve
                                </button>
                            ) : isOwner && approvalCount > (fundersCount / 2) ?  (
                                    <button onClick={ () => {fulfillRequest()}}>
                                        fulfill
                                    </button>
                            ) : (" ")
                    : (<div>
                        request filfilled
                    </div>)}
                </div>
            </div>
        )
    }

    const CreateCampaign = () => {
        async function updateUI() {
            try {
                let message = document.getElementById("message");
                await createCampaign()
                .then( () => {
                    message.innerHTML = "Successfully signed up<br/>";
                })
                setRefresh(!refresh);
                
            } catch(e) {
                console.log(e.message)
            }
        }
        updateUI();
    }

    const CreateRequest = (campaignIndex, name, description, requestAmount) => {
        const readOptions = {
            abi: abi,
            contractAddress: contractAddress,
            functionName: "createRequestForCampaign",
            params: {
                campaignIndex: campaignIndex,
                name: name,
                description: description,
                requestAmount: requestAmount

            },
            gasLimit: 3000000000000,
        }

        async function updateUI() {
            try {
                await Moralis.executeFunction(readOptions);
            } catch(e) {
                console.log(e.message)
            }
        }
        updateUI();
    }



    const FundCampaign = (index, fundAmount) => {
        console.log(index)
        const readOptions = {
            abi: abi,
            contractAddress: contractAddress,
            functionName: "fundCampaign",
            params: {
                campaignIndex: index
            },
            gasLimit: 3000000000000,
            msgValue: fundAmount,
        }

        async function updateUI() {
            try {
                await Moralis.executeFunction(readOptions);
            } catch(e) {
                console.log(e.message)
            }
        }
        updateUI()
    }


    return (
        <div>
            {isWeb3Enabled ? (
                <div>
                    CrowdFund
                    <br/>
                    <input type="text" placeholder="campaign name" value={newCampaignName} onChange={ (e) => {setNewCampaignName(e.target.value)} }/>
                    <button onClick={ () => {CreateCampaign()}}>create new campaign</button>
                    <br/>
                    <span id="message"></span>
                    <div className='campaign-factory'>
                    {
                        campaignFactory.map( (campaign, campaignIndex) => {
                            return <CAMPAIGN_MAPPER
                                campaignIndex={campaignIndex} 
                                campaignAddress={campaign.campaignAddress}
                                i_campaignName={campaign.i_campaignName}
                                campaignBalance={campaign.campaignBalance.toNumber()}
                                fundersCount={campaign.fundersCount.toNumber()}
                                i_owner={campaign.i_owner}
                            />
                        })
                    }
                    </div>
                </div>
            ) : (
                // Content to render when the boolean is false
                <div>
                    Please log in
                </div>
            )}
        </div>
    )
}

export default CampaignFactory