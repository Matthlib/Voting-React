import React, { Fragment } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css';
import 
 from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";


state = { web3: null, accounts: null, contract: null, whitelist: null };

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
    // Mettre à jour le state 
    this.setState({ whitelist: whitelist });
  };



  runInitGetStatus = async () => {
    const { accounts, contract } = this.state;

    // récupérer la liste des comptes autorisés
    const votingStatus = await contract.methods.getStatus().call();
    // Mettre à jour le state 
    this.setState({ votingStatus: votingStatus });
  };



  whitelist = async () => {
    const { accounts, contract } = this.state;
    const address = this.address.value;

    // Interaction avec le smart contract pour ajouter un compte 
    await contract.methods.whitelist(address).send({ from: accounts[0] });
    // Récupérer la liste des comptes autorisés
    this.runInit();
  }

  voting = async () => {
    const { accounts, contract } = this.state;
    const address = this.address.value;

    // Interaction avec le smart contract pour ajouter un compte 
    //await contract.methods.nextStage();
    // Récupérer la liste des comptes autorisés
    this.runInitGetStatus();
  }





const Admin = ({ adress, age, children }) => {
    const Name = nom;
    return (
        <Fragment>
            <h2 style={{ 
                backgroundColor: age < 10 ? 'yellow' : 'purple',
             color: age < 10 ? 'black' : 'White' }}>
                Membre: {Name.toUpperCase()}: {age}
                </h2>
            {{ children } ? <p>{children}</p> : <p>NoName</p>}
        </Fragment>
    )

}






export default Admin