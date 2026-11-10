
import { useEffect, useState } from "react";

import BoardHeader from "../components/BoardHeader";
import Board from "../components/Board";
import BoardMobile from "../components/BoardMobile";
import ListView from "../components/ListView";
import TaskSelection from "../components/TaskSelection";

import { useApp } from "../context/AppContext";

import "../styles/pages/home.css";

export default function Home() {
  const {
    view,
    activeCategory,
    filters,
    currentUser,
  } = useApp();

  const [isMobile, setIsMobile] = useState(
    window.matchMedia("(max-width: 700px)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 700px)",
    );

    const handler = (event) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);

  return (
    <div className="home">
      <BoardHeader />

      <div className="home__board-wrap">
        {view === "lista" ? (
          <ListView />
        ) : (
          <TaskSelection
            key={JSON.stringify([
              activeCategory,
              filters,
              currentUser?.id,
              currentUser?.accountType,
            ])}
          >
            {isMobile ? (
              <BoardMobile />
            ) : (
              <Board />
            )}
          </TaskSelection>
        )}
      </div>
    </div>
  );
}
