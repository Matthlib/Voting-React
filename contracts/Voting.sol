// SPDX-License-Identifier: MIT
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "./Whitelist.sol";
import "./Ownable.sol";


contract Voting is Whitelist, Ownable{
address public Admin;
mapping(address => Voter) public voters;
event Proposer(string  names);

 
// Type pour une proposition.
struct Proposal {
string name;
uint voteCount;}


struct Voter {
bool isRegistered;
bool hasVoted;
uint votedProposalId;}


// Un tableau dynamique de structs `Proposal`.
Proposal[] public proposals;

event VoterRegistered(address voterAddress);
event ProposalsRegistrationStarted();
event ProposalsRegistrationEnded();
event ProposalRegistered(string name);
event VotingSessionStarted();
event VotingSessionEnded();
event Voted (address voter, uint proposalId);
event VoteAdded (Proposal Prop);
event VotesTallied();


enum WorkflowStatus {
RegisteringVoters,
ProposalsRegistrationStarted,
ProposalsRegistrationEnded,
VotingSessionStarted,
VotingSessionEnded,
VotesTallied}
      
	  // Le workflow par défaut,est le suivant :
WorkflowStatus public workflowStatus= WorkflowStatus.RegisteringVoters;

event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
 
function nextStage() public onlyOwner {
workflowStatus = WorkflowStatus((uint(workflowStatus) + 1));
   
   if (workflowStatus == WorkflowStatus(1)) { emit ProposalsRegistrationStarted();}
   if (workflowStatus == WorkflowStatus(2)) { emit ProposalsRegistrationEnded();}
   if (workflowStatus == WorkflowStatus(3)) { emit VotingSessionStarted();}
   if (workflowStatus == WorkflowStatus(4)) { emit VotingSessionEnded();}
   if (workflowStatus == WorkflowStatus(5)) { emit VotesTallied();}
emit WorkflowStatusChange(
WorkflowStatus(uint(workflowStatus)-1),WorkflowStatus( uint(workflowStatus) ) );}


   
function isRegistered(address voterAddress) public onlyOwner {
        Voter storage sender = voters[voterAddress];
        require(!sender.isRegistered, "usager deja enrengistre!");
       sender.isRegistered = true;
	   //appel à une fct du contrat parent 
        super.whitelist(voterAddress);
        emit VoterRegistered(voterAddress); }    

function getStatus() public view returns (WorkflowStatus) {
    return workflowStatus;}


function proposer(string  memory names) public {
   Voter storage sender = voters[msg.sender];
  assert(sender.isRegistered);
  assert((workflowStatus ==WorkflowStatus(1)));
   require(!(workflowStatus == WorkflowStatus(2)),   "le depot n est plus possible");
   proposals.push(Proposal({name: names,voteCount: 0})  );
   emit ProposalRegistered(names); 
            }
			
    function  getPrp() public view  returns (Proposal[] memory names)
{    return proposals ;
}
 
 
 
 function voting(address voterAddress,uint votedProposalId) public {
        Voter storage sender = voters[msg.sender];
		require((workflowStatus == WorkflowStatus(3)),"le vote n'a pas encore commence");
		require(!(workflowStatus == WorkflowStatus(4)),"le vote est deja fini");
		require(!sender.hasVoted, "a deja vote.");
 	    sender.hasVoted= true;
        sender.votedProposalId = votedProposalId;

        // Si `votedProposalId` n'est pas un index valide,
        // une erreur sera levée et l'exécution annulée

        proposals[votedProposalId].voteCount += 1;
		emit Voted (voterAddress, votedProposalId);
    }
	
	
 function getVote() public view returns (uint votedProposalId) {
         return proposals[votedProposalId].voteCount;

    }     	


 function getYourVote(address voterAddress) public view returns (uint votedProposalId) {
         return voters[voterAddress].votedProposalId;

    } 


 function gethasVoted(address voterAddress) public view returns (bool hasVoted) {
         return voters[voterAddress].hasVoted;

    } 

    ///  Calcule la proposition gagnante
    /// en prenant tous les votes précédents en compte.
	
    function winningProposalID() public view
            returns (uint winningProposalID_)
    {require((workflowStatus == WorkflowStatus(5)),
	         "le comptage n est pas possible pour le moment");
            uint winningVoteCount = 0;
               for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposalID_ = p;
             } 
        }
    }
	
	  function winnerName() public view
            returns (string memory winnerName_){
        winnerName_ = proposals[winningProposalID()].name;
    }
}
