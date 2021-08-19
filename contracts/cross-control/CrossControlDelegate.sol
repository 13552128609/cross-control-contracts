// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./CrossControlStorage.sol";

contract CrossControlDelegate is AccessControl, CrossControlStorage{
    using EnumerableSet for EnumerableSet.UintSet;
    constructor() public {
        _globalProhibit = false;
        // todo user A
        _setRoleAdmin(MONITOR_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function getGlobalProhibit()
    external
    view
    returns (bool)
    {
        return _globalProhibit;
    }
    // monitor and admin can turnOnProhibit
    function turnOnProhibit()
    external
    {
        require(!_globalProhibit, 'already turn on');
        require(hasRole(ADMIN_ROLE, _msgSender()) || hasRole(MONITOR_ROLE, _msgSender()), "Nether admin Nor Monitor");
        _globalProhibit = true;
        _removeAllTokenPairIDs();
    }

    // only admin can turnOffProhibit
    function turnOffProhibit()
    external
    {
        require(_globalProhibit, 'already turn off');
        require(hasRole(ADMIN_ROLE, _msgSender()), "Not admin");
        _globalProhibit = false;
    }

    function isValidTokenPair(uint256 tokenPairId_)
    external
    view
    returns (bool)
    {
        if (!_globalProhibit || _setWLTokenPairIDs.contains(tokenPairId_)) {
            return true;
        }
        return false;
    }

    function getAllWLTokenPairs()
    external
    view
    returns (uint256[] memory)
    {

        uint256[] memory ret = new uint[](_setWLTokenPairIDs.length());
        for (uint256 i = 0; i < _setWLTokenPairIDs.length(); i++) {
            ret[i] = _setWLTokenPairIDs.at(i);
        }
        return ret;
    }

    function addTokenPairId(uint256 tokenPairId_)
    external
    {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Not admin");
        require(_setWLTokenPairIDs.add(tokenPairId_), "Duplicate token pair ID");
    }

    function addTokenPairIDs(uint256[] memory tokenPairIDs_)
    external
    {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Not admin");
        for (uint256 i = 0; i < tokenPairIDs_.length; i++) {
            require(_setWLTokenPairIDs.add(tokenPairIDs_[i]), "Duplicate token pair ID");
        }
    }

    function removeTokenPairId(uint256 tokenPairId_)
    external
    {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Not admin");
        require(_setWLTokenPairIDs.remove(tokenPairId_), "No token pair ID");
    }

    function removeTokenPairIDs(uint256[] memory tokenPairIDs_)
    external
    {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Not admin");
        for (uint256 i = 0; i < tokenPairIDs_.length; i++) {
            require(_setWLTokenPairIDs.remove(tokenPairIDs_[i]), "No token pair ID");
        }
    }

    function clearWL()
    external
    {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Not admin");
        _removeAllTokenPairIDs();
    }

    function _removeAllTokenPairIDs()
    internal
    {
        for (uint256 i = 0; i < _setWLTokenPairIDs.length(); i++) {
            require(_setWLTokenPairIDs.remove(_setWLTokenPairIDs.at(i)), "No token pair ID");
        }
    }
}