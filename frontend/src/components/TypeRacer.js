import React from "react";
import { Navigate } from "react-router-dom";

import CountDown from "./CountDown";
import { DisplayWords } from "./DisplayWords";
import StartBtn from "./StartBtn";
import socket from "./socketConfig";
import { ProgressBar } from "./ProgressBar";
import { Form } from "./Form";
import { DisplayGameCode } from "./DisplayGameCode";
import { ScoreBoard } from "./ScoreBoard";
const findPlayer = (players) => {
  return players.find((player) => player.socketID === socket.id);
};
export const TypeRace = ({ gameState }) => {
  console.log(gameState);
  const { _id, players, words, isOpen, isOver } = gameState;
  const player = findPlayer(players);

  console.log(player);
  if (_id === "") return <Navigate to="/" />;
  // const wordstosend = words[0].split(" ");
  return (
    <>
      <div className="text-center">
        <DisplayWords words={words} player={player} />
        <ProgressBar
          players={players}
          player={player}
          wordsLength={words.length}
        />
        <Form isOpen={isOpen} isOver={isOver} gameID={_id} />
        <CountDown />
        <StartBtn player={player} gameID={_id} />
        <DisplayGameCode gameID={_id} />
        <ScoreBoard players={players} />
      </div>
    </>
  );
};
