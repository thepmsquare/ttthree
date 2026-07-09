import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import LocalMultiplayer from "./pages/LocalMultiplayer";
import "./stylesheets/App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/local" element={<LocalMultiplayer />} />
    </Routes>
  );
}

export default App;
