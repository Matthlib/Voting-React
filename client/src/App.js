import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Whitelist from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import "./App.css";
//import Web3ConnectionManager from './features/web3/Web3ConnectionManager';



class App extends Component {
  state = { web3: null, accounts: null, contract: null, getYourVoteValue: null, voteValue: null, connectedAdress: null, votingStatus: null, whitelist: null, getPrp: null, voting: null };

  componentWillMount = async () => {
    try {
      // Récupérer le provider web3
      const web3 = await getWeb3();

      // Utiliser web3 pour récupérer les comptes de l’utilisateur (MetaMask dans notre cas) 
      const accounts = await web3.eth.getAccounts();

      // Récupérer l’instance du smart contract “Whitelist” avec web3 et les informations du déploiement du fichier (client/src/contracts/Whitelist.json)
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Whitelist.networks[networkId];

      const instance = new web3.eth.Contract(
        Whitelist.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runInit);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`,
      );
      console.error(error);
    }
  };

  runInit = async () => {
    const { accounts, contract } = this.state;
    // récupérer la liste des comptes autorisés
    const whitelist = await contract.methods.getAddresses().call();
    var votingStatus = await contract.methods.getStatus().call();
    const adminAdress = await contract.methods.owner().call();
    const getPrp = await contract.methods.getPrp().call();
    const yourVote = await contract.methods.getYourVote(accounts[0]).call();
    const hasVoted = await contract.methods.gethasVoted(accounts[0]).call();
    console.log("runInit", yourVote);

    var getYourVoteValue = null;
    if (hasVoted) {
      getYourVoteValue = getPrp[yourVote].name;
    }
    else {
      getYourVoteValue = "";
    };

    
    var getResult = null;
    if (votingStatus > '4') {
      const winningProposalID = await contract.methods.winningProposalID().call();
      console.log("winningProposalID",winningProposalID,); 
      getResult = getPrp[winningProposalID].name;
    }
    else {
      getResult = "";
    };
    // Mettre à jour le state 
    /*
    if (votingStatus == '0') {
      votingStatus = 'RegisteringVoters';
    }
    else if (votingStatus == '1') {
      votingStatus = 'ProposalsRegistrationStarted';
      document.getElementById('Vote').style.display = "none";
      document.getElementById('Whitelist').style.display = "none";
    } else if (votingStatus == '2') {
      votingStatus = 'ProposalsRegistrationEnded';
      document.getElementById('Whitelist').style.display ="none";
    } else if (votingStatus == '3') {
      votingStatus = 'VotingSessionStarted';
      document.getElementById('Whitelist').style.display = "none";
    } else if (votingStatus == '4') {
      votingStatus = 'VotingSessionEnded';
      document.getElementById('Whitelist').style.display = "none";
      document.getElementById('Proposition').style.display= "none";
    } else {
      votingStatus = 'VotesTallied';
    };
    this.state.votingStatus 
    
   */

    // Event management
    contract.events.VoterRegistered().on('data', (event1) => this.doWhenEventVoteRegistered(event1)).on('error', console.error);

    contract.events.WorkflowStatusChange().on('data', (event2) => this.doWhenEventWorkflowStatusChange(event2)).on('error', console.error);


    contract.events.ProposalRegistered()
      .on('data', (event3) =>
        this.doWhenEventProposalRegistered(event3))
      .on('error', console.error);

    contract.events.Voted()
      .on('data', (event4) =>
        this.doWhenEventVoted(event4))
      .on('error', console.error);

    this.setState({ whitelist: whitelist, connectedAdress: accounts[0], votingStatus: votingStatus, 
      getYourVoteValue: getYourVoteValue, adminAdress: adminAdress, getPrp: getPrp,
      getResult : getResult });

  };

  doWhenEventWorkflowStatusChange = async (event) => {
    this.setState({ votingStatus: event.returnValues.newStatus });
  };



  doWhenEventProposalRegistered = async (event) => {
    const { getPrp } = this.state;
    // Insert a row in the table at row index 0
    getPrp.push({ name: event.returnValues.name, voteCount: 0 });
    this.setState({ getPrp: getPrp });
  };

  // quand la personne a voter rajouter une valeur dasn la liste
  doWhenEventVoted = async (event) => {
    const { accounts } = this.state;
    //ajoute une valeur dans le tableau getPrp
    console.log("doWhenEventVoted", event.returnValues);
    const list = this.state.getPrp;
    list.map((item, j) => {
      console.log("j", j);
      console.log("item", item);
      console.log("event.returnValues.proposalId", event.returnValues.proposalId);
      if (j == event.returnValues.proposalId) {
        console.log("entré");
        console.log("list[j].voteCount ", list[j].voteCount);
        list[j].voteCount = Math.floor(list[j].voteCount) + 1;
      };
    });

    console.log("list", list);
    console.log("event.returnValues.voter", event.returnValues.voter);
    console.log("accounts[0]", accounts[0]);
    if (accounts[0] === event.returnValues.voter) {
      var votingStat = event.returnValues.proposalId
    };
    console.log("votingStat", votingStat);

    this.setState({ getPrp: list, votingStatus: votingStat });

    // si cest soit ajouter une valeur dans getYourVoteValue

  }

  doWhenEventVoteRegistered = async (event) => {
    const { whitelist } = this.state;
    console.log("doWhenEventVoteRegistered", event.returnValues.voterAddress);
    whitelist.push(event.returnValues.voterAddress);
    this.setState({ whitelist: whitelist });
  };


  sendproposer = async () => {
    const { accounts, contract } = this.state;
    const proposition = this.proposition.value;
    await contract.methods.proposer(proposition).send({ from: accounts[0] });
  };

  sendVoter = async () => {
    const { accounts, contract } = this.state;
    var vote = this.state.voteValue;
    if (vote === null) {
      vote = '0';
    }
    await contract.methods.voting(accounts[0], vote).send({ from: accounts[0] });
  };

  // ajout d'un compte
  whitelist = async () => {
    const { accounts, contract } = this.state;
    const address = this.address.value;
    await contract.methods.isRegistered(address).send({ from: accounts[0] });
  };

  handleChange(event) {
    this.setState({ voteValue: event.target.value });

  };



  returnAdress() {
    const { accounts } = this.state;
    const connectedAdress = accounts[0];
  };

  setVotingStatus = async () => {
    const { accounts, contract } = this.state;
    await contract.methods.nextStage().send({ from: accounts[0] });
  };


  render() {
    const { connectedAdress, votingStatus, whitelist, adminAdress, getYourVoteValue, getPrp , getResult } = this.state;

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      /*Parti du haut*/
      <div>

        {/*Bandeau haut Connection */}
        <div style={{
          display: 'flex', justifyContent: 'right', backgroundColor: '#b1eafa',
          width: '100%',
          height: '100px',
          color: 'white'
        }}>
          <div>
            <Button variant="dark" > {connectedAdress} </Button>
          </div>

        </div>


        {/*Bandeau droite*/}
        <div>
          {this.getYourVoteValue}
        </div>

        <div>
          <br></br><br></br>
          <br></br>
          <br></br>


          {/* =================================================Whitelist ==================================================*/}
          <div id='Whitelist'>
            <h2 className="text-center">Système d'une liste blanche/whitelist</h2>
            <hr></hr>
            <br></br>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Card style={{ width: '50rem' }}>
                <Card.Header><strong>Liste des comptes autorisés</strong></Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>@</th>
                          </tr>
                        </thead>
                        <tbody>

                          {whitelist !== null &&
                            whitelist.map((a) => <tr><td>{a}</td></tr>)
                          }
                        </tbody>
                      </Table>
                    </ListGroup.Item>

                    <ListGroup.Item>


                      <Form.Group><strong>Autoriser un nouveau compte</strong>
                        <Form.Control type="text" id="address"
                          ref={(input) => { this.address = input }}
                        />
                      </Form.Group>
                      <Button onClick={this.whitelist} variant="dark" > Autoriser </Button>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
          </div>
          <br></br>
          <br></br>

          {/* =================================================Status en cours ==================================================*/}
          <div id='Status'>
            <h2 className="text-center">Status du Vote</h2>
            <hr></hr>
            <br></br>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Card style={{ width: '50rem' }}>
                <Card.Header><strong>Status Actuel:  {(() => {
                  if (votingStatus == "0") {
                    return "RegisteringVoters"
                  }
                  if (votingStatus == "1") {
                    return "ProposalsRegistrationStarted"
                  }
                  if (votingStatus == "2") {
                    return "ProposalsRegistrationEnded"
                  }
                  if (votingStatus == "3") {
                    return "VotingSessionStarted"
                  }
                  if (votingStatus == "4") {
                    return "VotingSessionEnded"
                  }
                  if (votingStatus == "5") {
                    return "VotesTallied"
                  }
                })()
                }


                </strong>
                </Card.Header>
                <Card.Body>
                  <ListGroup.Item>
                    <div className="d-grid gap-2">
                      <Button onClick={this.setVotingStatus} variant="dark" > Prochaine étape du vote </Button>
                    </div>
                  </ListGroup.Item>
                </Card.Body>
              </Card>
            </div>
          </div>
          <br></br><br></br>




          {/* =================================================enregistrement de la proposition de liste==========================*/}
          <div id='Proposition'>
            <h2 className="text-center">enregistrement de la proposition</h2>
            <hr></hr>
            <br></br>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Card style={{ width: '50rem' }}>
                <Card.Header><strong>List de proposition</strong></Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <Table striped bordered hover>

                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Proposal</th>
                            <th>Vote Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPrp !== null &&
                            getPrp.map((a, b) => <tr><td>{b}</td><td>{a.name}</td><td>{a.voteCount}</td></tr>)
                          }
                        </tbody>
                      </Table>
                    </ListGroup.Item>
                    <ListGroup.Item disabled={this.state.votingStatus !== '1'}>
                      <Form.Group><strong>Ajouter une proposition </strong>
                        <Form.Control type="text" id="proposition"
                          ref={(input) => { this.proposition = input }}
                        />
                      </Form.Group>
                      <Button onClick={this.sendproposer} variant="dark" disabled={this.state.votingStatus !== '1'} > Autoriser </Button>

                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </div>
            <br></br>
            <br></br>

          </div>
          <br></br><br></br>
          {/* =================================================Vote==================================================*/}
          <div id='Vote'>
            <h2 className="text-center">Resultat du Vote</h2>
            <hr></hr>
            <br></br>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Card style={{ width: '50rem' }}>
                <Card.Header><div>
                  <strong>votre vote : {this.state.getYourVoteValue} </strong>
                </div>
                  <div>
                    <strong>Resultat du vote  : {this.state.getResult}  </strong>
                    {/* {ResultOfVote}*/}
                  </div>
                </Card.Header>
                <Card.Body disabled={this.state.getYourVoteValue} >

                  <select value={this.voteValue} onChange={event => this.handleChange(event)}>
                    {getPrp !== null &&
                      getPrp.map((a, b) => <option value={b}>{a.name}</option>)}
                  </select>
                  <Button onClick={this.sendVoter} variant="dark" disabled={this.state.getYourVoteValue}  >Autoriser</Button>
                </Card.Body>
              </Card>
            </div>
          </div>
          <br></br><br></br>
        </div>
      </div>
    );
  }
}

export default App;


