pragma solidity ^0.4.11;

contract TokenControllerHelper is TokenController {

	function proxyPayment(address _owner) payable returns(bool){
		return true;
	}

    function onTransfer(address _from, address _to, uint _amount) returns(bool){
    	return false;
    }
    function onApprove(address _owner, address _spender, uint _amount) returns(bool){
    	return true;
    }
}