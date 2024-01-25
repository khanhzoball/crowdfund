// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Imports
import "./Campaign.sol"; 


contract CampaignFactory {
    
    Campaign[] campaigns;

    struct CampaignSummary {
        address campaignAddress;
        string i_campaignName;
        address i_owner;
        uint256 campaignBalance;
        uint256 fundersCount;
    }

    struct Request {
        string name;
        string description;
        uint256 requestAmount;
        uint256 approvalCount;
        bool fulfilled;
    }


    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    function createCampaign (string memory name) public {
        Campaign newCampaign = new Campaign(msg.sender, name);
        campaigns.push(newCampaign);
    }

    // funds a campaign
    // campaigns are stored in array, and campaignIndex is sort of like the unique Id
    // In the future, might implement campaign address as the unique indentifier and store campaigns in a map
    function fundCampaign (uint campaignIndex) public payable {
        address campaignAddress = address(campaigns[campaignIndex]);

        (bool success, ) = address(campaignAddress).call{value: msg.value}(
            abi.encodeWithSignature("fund(address)", msg.sender)
        );

        require(success, "Funding campaign failed");
    }

    function createRequestForCampaign (
        uint campaignIndex, 
        string memory name, 
        string memory description, 
        uint256 requestAmount) public {
        
        campaigns[campaignIndex].createRequest(msg.sender, name, description, requestAmount);
    }

    function approveRequestForCampaign (uint campaignIndex, uint256 requestIndex) public {
        campaigns[campaignIndex].addApproval(msg.sender, requestIndex);
    }

    function fulfillRequestForCampaign (uint campaignIndex, uint256 requestIndex) public {
        campaigns[campaignIndex].fulfillRequest(msg.sender, requestIndex);
    }

    function getAllCampaign() public view returns (Campaign[] memory) {
        return campaigns;
    }

    // gets the summaries from each campaign through looping
    // converts it to CampaignSummary type
    // adds to results array
    function getAllCampaignSummary () public view returns (CampaignSummary[] memory) {
        CampaignSummary[] memory campaignSummaries = new CampaignSummary[](campaigns.length);

        for (uint i = 0; i < campaigns.length; i++) {
            (
                address campaignAddress,
                string memory i_campaignName,
                address i_owner,
                uint256 campaignBalance,
                uint256 fundersCount
            ) = campaigns[i].getSummary();

            CampaignSummary memory newSummary = CampaignSummary({
                campaignAddress: campaignAddress,
                i_campaignName: i_campaignName,
                i_owner: i_owner,
                campaignBalance: campaignBalance,
                fundersCount: fundersCount
            });

            campaignSummaries[i] = newSummary;
        }

        return campaignSummaries;

    }

    function getAllRequestForCampaign (uint256 campaignIndex) public view returns (Request[] memory) {
        Campaign.Request[] memory requests = campaigns[campaignIndex].getAllRequests();
        Request[] memory results = new Request[](requests.length);

        for (uint i = 0; i < requests.length; i++) {
            results[i] = Request({
                name: requests[i].name,
                description: requests[i].description,
                requestAmount: requests[i].requestAmount,
                approvalCount: requests[i].approvalCount,
                fulfilled: requests[i].fulfilled
            });
        }

        return results;
    }
    
    // Checks if current user is a funder
    function addressToFunderForCampaign (uint256 campaignIndex) public view returns (bool) {
        return campaigns[campaignIndex].addressToFunder(msg.sender);
    }

    // check which requests current user has approved
    function checkIfApproved (uint256 campaignIndex) public view returns (bool[] memory) {
        return campaigns[campaignIndex].checkIfApproved(msg.sender);
    }
}