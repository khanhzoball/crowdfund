// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


error Campaign__NotOwner();

/** @title Campaign smart contract
 *  @author Khanh Nguyen
 *  @notice This contract is to create a decentralized campaign smart contract
 *  @dev
*/

contract Campaign {

    // Type Declarations


    // State variables
    string public i_campaignName;
    address public immutable i_owner; // Campaign owner
    mapping(address => bool) public funders; // Did this address fund?
    uint256 public fundersCount = 0; // Funders count
    Request[] public requests; // List of requests
    mapping(string requestName => mapping(address => bool)) requestTofundersToApproval;

    struct Request {
        string name;
        string description;
        uint256 requestAmount;
        uint256 approvalCount;
        bool fulfilled;
    }

    // Events

    // Modifiers
    // modifier onlyOwner() {
    //     require(msg.sender == i_owner, "Must be campaign owner");
    //     _;
    // }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    // On creation, set campaign owner and campaign name
    constructor(address owner, string memory _campaignName) {
        i_owner = owner;
        i_campaignName = _campaignName;
    }

    // Funds the campaign
    function fund(address funder) public payable {
        require(funder != i_owner, "Owner cannot fund own campaign");
        require(msg.value >= 1e15, "Must send at least .001 eth");

        funders[funder] = true;
        fundersCount += 1;

    }

    // Creates a request for campaign
    function createRequest(address sender, string memory name, string memory description, uint256 requestAmount) public  {
        require(sender == i_owner, "Must be campaign owner");

        Request memory newRequest = Request ({
            name: name,
            description: description,
            requestAmount: requestAmount,
            approvalCount: 0,
            fulfilled: false
        });

        requests.push(newRequest);
    }

    // Adds approval for a request after several checks are passed
    function addApproval(address funder, uint256 requestIndex) public {
        Request storage request = requests[requestIndex];

        require(funder != i_owner, "Campaign owner cannot approve own request.");
        require(funders[funder], "Must be a funder to vote.");
        require(!requestTofundersToApproval[request.name][funder], "You have already approved this request");

        request.approvalCount++;
        requestTofundersToApproval[request.name][funder] = true;
    }

    // Campaign owner can fulfill a request, ending it and getting the money as a result
    function fulfillRequest(address sender, uint256 requestIndex) public {
        require(sender == i_owner, "Must be campaign owner");

        Request storage request = requests[requestIndex];
        require(request.approvalCount > fundersCount/2, "Need majority of funder approval");
        require(address(this).balance > request.requestAmount, "Not enough money to complete request");
        require(!request.fulfilled, "Request has already been fulfilled");

        bool sendSuccess = payable(i_owner).send(request.requestAmount);
        require(sendSuccess, "Payment sent");

        request.fulfilled = true;
    }
    

    function getSummary() public view returns (address, string memory, address, uint256, uint256) {
        return (
            address(this),
            i_campaignName,
            i_owner,
            address(this).balance,
            fundersCount
        );
    }

    function getAllRequests() public view returns (Request[] memory) {
        return requests;
    }

    function addressToFunder(address funder) public view returns (bool) {
        return funders[funder];
    }

    // returns an array to see which request has been approved by funder
    function checkIfApproved(address funder) public view returns(bool[] memory) {
        bool[] memory result = new bool[](requests.length);
        for (uint i = 0; i < requests.length; i++) {
            
            // request --> funder --> did this funder approve?
            result[i] = (requestTofundersToApproval[requests[i].name][funder]);
        }

        return result;
    }
}

