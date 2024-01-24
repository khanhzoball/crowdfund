import logo from './logo.svg';
import './App.css';
import Header from './components/header';
import CampaignFactory from './components/campaignFactory';
import { MoralisProvider } from 'react-moralis';
import "./components/components.css";

function App() {
  return (
    <MoralisProvider initializeOnMount={false}>
      <div className="App">
        <Header />
        <CampaignFactory />
      </div>
    </MoralisProvider>
  );
}

export default App;
