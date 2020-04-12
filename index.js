const AvcServer = require("ws-avc-player/lib/server");
const path = require("path");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const spawn = require("child_process").spawn;
const { WebSocketServer } = require("@clusterws/cws");
const pwm = require("rpio-pwm");

app.use(express.static(path.resolve(__dirname, "./front-end/build")));

const width = 400,
  height = 300,
  fps = 15;

let speedPin,directionPin,speedCh,directionCh;

function initSpeedPin(pin=13, refresh=400, round=60){
  const cycleTimeUs = 1000 / refresh *1000, 
  stepTimeUs = cycleTimeUs / 100, 
  pwmCfg = {
    cycle_time_us: cycleTimeUs, 
    step_time_us: stepTimeUs, 
    delay_hw: 0
  };
  speedCh = pwm.create_dma_channel(13, pwmCfg),
  speedPin = speedCh.create_pwm(pin);
}

function initDirectionPin(pin=12, refresh=50){
  const cycleTimeUs = 1000 / refresh *1000, 
  stepTimeUs = cycleTimeUs / 100, 
  pwmCfg = {
    cycle_time_us: cycleTimeUs, 
    step_time_us: stepTimeUs, 
    delay_hw: 1
  };
  directionCh = pwm.create_dma_channel(14, pwmCfg),
  directionPin = directionCh.create_pwm(pin);
}

initSpeedPin();
initDirectionPin();

function setRound(pin, round) {
  pin.set_width( round);
}

process.on("SIGINT", function () {
  speedCh.shutdown();
  directionCh.shutdown();
  console.log("Goodbye!");
  process.exit();
});

const changeSpeed = function (v) {
  if (v == 0) {
    setRound(speedPin, 60);
  } else {
    setRound(speedPin, Math.round(60 + v * 20));
  }
};

const changeDirection = function (v) {
  if (v == 0) {
    setRound(directionPin, 7.5);
  } else {
    setRound(directionPin, Math.round(v * 2.5 + 7.5));
  }
};


changeSpeed(0);

const wss = new WebSocketServer({ server });
const avcServer = new AvcServer(wss, width, height);

avcServer.on("client_connected", () => {
  console.log("client connected");
});

avcServer.client_events.on("open camera", function (v) {
  console.log("open camera", v);
  if (v) {
    streamer || startStreamer();
  } else {
    streamer && streamer.kill("SIGTERM");
  }
});

avcServer.client_events.on("speed zero rate", (rate) => {
  console.log("speed zero rate", rate);
});

avcServer.client_events.on("speed rate", (v) => {
  console.log("speed", v);
  changeSpeed(v);
});

avcServer.client_events.on("direction rate", (v) => {
  console.log("direction", v);
  changeDirection(v);
});

avcServer.on("client_disconnected", () => {
  console.log("client disconnected");
  changeSpeed(0);
  if (avcServer.clients.size < 1) {
    if (!streamer) {
      return;
    }
    streamer.kill("SIGTERM");
  }
});

let streamer = null;

const startStreamer = () => {
  console.log("starting streamer");
  //  streamer = spawn("raspivid", [
  //    "-pf",
  //    "baseline",
  //    "-ih",
  //    "-t",
  //    "0",
  //    "-w",
  //    width,
  //    "-h",
  //    height,
  //    "-hf",
  //    "-fps",
  //    "15",
  //    "-g",
  //    "30",
  //    "-o",
  //    "-",
  //  ]);
  streamer = spawn("raspivid", [
    "-t",
    "0",
    "-o",
    "-",
    "-w",
    width,
    "-h",
    height,
    "-fps",
    fps,
    "-pf",
    "baseline",
  ]);
  streamer.on("close", () => {
    streamer = null;
  });

  avcServer.setVideoStream(streamer.stdout);
};

server.listen(8080);
