import BoardHeader from "../components/BoardHeader";
import Board from "../components/Board";
import ListView from "../components/ListView";
import { useApp } from "../context/AppContext";
import "../styles/pages/home.css";

export default function Home() {
  const { view } = useApp();
  return (
    <div className="home">
      <BoardHeader />
      {view === "tablero" ? <Board /> : <ListView />}
    </div>
  );
}