import { useEffect, useState } from "react";
import BoardHeader from "../components/BoardHeader";
import Board from "../components/Board";
import BoardMobile from "../components/BoardMobile";
import ListView from "../components/ListView";
import { useApp } from "../context/AppContext";
import "../styles/pages/home.css";

export default function Home() {
  const { view } = useApp();
  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width: 700px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="home">
      <BoardHeader />
      <div className="home__board-wrap">
        {view === "lista" ? <ListView /> : isMobile ? <BoardMobile /> : <Board />}
      </div>
    </div>
  );
}