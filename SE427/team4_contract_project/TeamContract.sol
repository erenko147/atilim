// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

interface HillContract {
    // Existing methods in the interface
    function getTotalCalls() external view returns (uint);
    function getMyTeamCount() external view returns (int);
    function showLeaderBoard_Calls() external view returns (string memory);
    function showLeaderBoard_Occupations() external view returns (string memory);
    function showLeaderBoard() external view returns (string memory);
    function setCellsFromContract(int256 x, int256 y, bytes32 nonce) external payable returns (bytes32);
    function setMyTeamContract(address contractAddress) external;
    function getMyTeamNumber() external view returns (int);
    function getMyTeamContract() external view returns (address);
    function getCellHash(int256 x, int256 y) external view returns (bytes32);
    function getCellRank(int256 x, int256 y) external view returns (int256);
    function getCellUpper(int256 x, int256 y) external view returns (int256);
    function getCellTeamNumber(int256 x, int256 y) external view returns (int);
}

contract TeamContract {
    HillContract centralContract;
    address public owner;

    event CellOccupied(int256 x, int256 y, bytes32 nonce, address indexed owner);

    constructor(address _centralContractAddress) {
        centralContract = HillContract(_centralContractAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Function to occupy a cell
    function occupyCell(int256 x, int256 y, bytes32 nonce) public payable onlyOwner {
        require(msg.value == 100000000000000, "Must send exactly 0.0001 ether");
        centralContract.setCellsFromContract{value: msg.value}(x, y, nonce);
        emit CellOccupied(x, y, nonce, msg.sender);
    }

    // Fetch data for all cells in the 10x10 grid
    function getCellData(int256 gridSize)
        public
        view
        returns (
            bytes32[] memory hashes,
            int256[] memory ranks,
            int256[] memory uppers,
            int[] memory teamNumbers
        )
    {
        uint256 totalCells = uint256(gridSize * gridSize);
        hashes = new bytes32[](totalCells);
        ranks = new int256[](totalCells);
        uppers = new int256[](totalCells);
        teamNumbers = new int[](totalCells);

        uint256 index = 0;
        for (int256 x = 0; x < gridSize; x++) {
            for (int256 y = 0; y < gridSize; y++) {
                hashes[index] = centralContract.getCellHash(x, y);
                ranks[index] = centralContract.getCellRank(x, y);
                uppers[index] = centralContract.getCellUpper(x, y);
                teamNumbers[index] = centralContract.getCellTeamNumber(x, y);
                index++;
            }
        }
        return (hashes, ranks, uppers, teamNumbers);
    }

    // Get the total calls made to the central contract
    function getTotalCalls() public view returns (uint) {
        return centralContract.getTotalCalls();
    }

    // Get the count of cells owned by your team
    function getMyTeamCount() public view returns (int) {
        return centralContract.getMyTeamCount();
    }

    // Get the leaderboard based on the number of calls made
    function showLeaderBoard_Calls() public view returns (string memory) {
        return centralContract.showLeaderBoard_Calls();
    }

    // Get the leaderboard based on the number of occupations
    function showLeaderBoard_Occupations() public view returns (string memory) {
        return centralContract.showLeaderBoard_Occupations();
    }

    // Get the general leaderboard of the teams
    function showLeaderBoard() public view returns (string memory) {
        return centralContract.showLeaderBoard();
    }

    // Function to get the team contract address from the central contract
    function getMyTeamContract() public view returns (address) {
        return centralContract.getMyTeamContract();
    }
}
