const express = require("express");
const app = express();

//const socketio = require("socket.io");
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
//const io = new Server(httpServer);

const mongoose = require("mongoose");
const cors = require("cors");
app.use(cors());

const Game = require("./models/Game");
const QuotableAPI = require("./QuotableAPI");

//Database Connection
mongoose.set("strictQuery", false);
const uri =
  "mongodb+srv://negia7265:7300789205@cluster0.ws32dt9.mongodb.net/KeepersApp?retryWrites=true&w=majority";
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
mongoose
  .connect(uri, options)
  .then(() => console.log("Connected to MongoDB Atlas!"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

const expressServer = app.listen(3001, () => {
  console.log("Listening on port 3001");
});
const io = new Server(expressServer, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  console.log("working");
  socket.on("userInput", async ({ userInput, gameID }) => {
    try {
      let game = await Game.findById(gameID);
      if (!game.isOpen && !game.isOver) {
        let player = game.players.find(
          (player) => player.socketID === socket.id
        );
        let word = game.words[player.currentWordIndex];
        if (word === userInput) {
          player.currentWordIndex++;
          if (player.currentWordIndex !== game.words.length) {
            game = await game.save();
            io.to(gameID).emit("updateGame", game);
          } else {
            let endTime = new Date().getTime();
            let { startTime } = game;
            player.WPM = calculateWPM(endTime, startTime, player);
            game = await game.save();
            socket.emit("done");
            io.to(gameID).emit("updateGame", game);
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
  socket.on("timer", async ({ gameID, playerID }) => {
    let countDown = 5;
    let game = await Game.findById(gameID);
    let player = game.players.id(playerID);
    if (player.isPartyLeader) {
      let timerID = setInterval(async () => {
        if (countDown >= 0) {
          io.to(gameID).emit("timer", { countDown, msg: "Starting Game" });
          countDown--;
        } else {
          game.isOpen = false;
          game = await game.save();
          io.to(gameID).emit("updateGame", game);
          startGameClock(gameID);
          clearInterval(timerID);
        }
      }, 1000);
    }
  });
  socket.on("join-game", async ({ gameID: _id, nickName }) => {
    try {
      let game = await Game.findById(_id);
      if (game.isOpen) {
        const gameID = game._id.toString();
        socket.join(gameID);
        let player = {
          socketID: socket.id,
          nickName,
        };
        game.players.push(player);
        game = await game.save();
        io.to(gameID).emit("updateGame", game);
      }
    } catch (err) {
      console.log(err);
    }
  });
  socket.on("create-game", async (nickName) => {
    try {
      const quotableData = await QuotableAPI();

      //dont bother about this code dealing with api fetched para

      let stringData = quotableData.data.toString();
      let substringToRemove = "<p>";
      let stringData2 = stringData.replace(substringToRemove, "");
      let substringToRemove2 = "</p>";
      let stringData3 = stringData2.replace(substringToRemove2, "");
      const wordstosend = stringData3.split(" ");
      let game = new Game();
      game.words = wordstosend;
      let player = {
        socketID: socket.id,
        isPartyLeader: true,
        nickName,
      };
      game.players.push(player);
      game = await game.save();
      const gameID = game._id.toString();
      socket.join(gameID);
      io.to(gameID).emit("updateGame", game);
    } catch (err) {
      console.log(err);
    }
  });

  // socket.emit("test", "this is from server");
  // socket.emit("patriot", "this is again from server");
});
const startGameClock = async (gameID) => {
  let game = await Game.findById(gameID);
  game.startTime = new Date().getTime();
  game = await game.save();
  let time = 120;
  let timerID = setInterval(
    (function gameIntervalFunc() {
      if (time >= 0) {
        const formatTime = calculateTime(time);
        io.to(gameID).emit("timer", {
          countDown: formatTime,
          msg: "Time Remaining",
        });
        time--;
      } else {
        (async () => {
          let endTime = new Date().getTime();
          let game = await Game.findById(gameID);
          let { startTime } = game;
          game.isOver = true;
          game.players.forEach((player, index) => {
            if (player.WPM === -1)
              game.players[index].WPM = calculateWPM(
                endTime,
                startTime,
                player
              );
          });
          game = await game.save();
          io.to(gameID).emit("updateGame", game);
          clearInterval(timerID);
        })();
      }
      return gameIntervalFunc;
    })(),
    1000
  );
};
const calculateTime = (time) => {
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
};
const calculateWPM = (endTime, startTime, player) => {
  let numOfWords = player.currentWordIndex;
  const timeInSeconds = (endTime - startTime) / 1000;
  const timeInMinutes = timeInSeconds / 60;
  const WPM = Math.floor(numOfWords / timeInMinutes);
  return WPM;
};
