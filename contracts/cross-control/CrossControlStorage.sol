// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract CrossControlStorage {
    bytes32 public constant ADMIN_ROLE = keccak256(bytes("admin_role"));
    bytes32 public constant MONITOR_ROLE = keccak256(bytes("monitor_role"));

    bool   _globalProhibit;
    EnumerableSet.UintSet   _setWLTokenPairIDs;
    EnumerableSet.UintSet   _setBLTokenPairIDs;
}
