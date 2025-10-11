import React, { useEffect, useState } from "react";
import { getHealthStatus } from "../services/api";

const Home: React.FC = () => {
  const [status, setStatus] = useState<string>("checking...");

  useEffect(() => {
    getHealthStatus()
      .then(() => setStatus("Backend online :)"))
      .catch(() => setStatus("Backend offline :("));
  }, []);

  return (
    <main style={{ textAlign: "center", marginTop: "10vh" }}>
      <h1>FitVibe</h1>
      <p>{status}</p>
    </main>
  );
};

export default Home;
