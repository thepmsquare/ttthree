import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import LocalMultiplayer from "./pages/LocalMultiplayer";
import SinglePlayer from "./pages/SinglePlayer";
import OnlineMultiplayer from "./pages/OnlineMultiplayer";
import Stats from "./pages/Stats";
import "./stylesheets/App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/local" element={<LocalMultiplayer />} />
      <Route path="/single" element={<SinglePlayer />} />
      <Route path="/online" element={<OnlineMultiplayer />} />
      <Route path="/online/:roomCode" element={<OnlineMultiplayer />} />
      <Route path="/stats" element={<Stats />} />
    </Routes>
  );
}

export default App;
