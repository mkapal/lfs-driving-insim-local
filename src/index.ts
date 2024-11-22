import "./env";
import { DashLights, InSim, OutGauge, OutGaugePack } from "node-insim";
import {
  InSimFlags,
  IS_ISI_ReqI,
  IS_MSL,
  IS_MST,
  MessageSound,
  PacketType,
} from "node-insim/packets";
import { log } from "./log";
import debounce from "debounce";

const inSim = new InSim();
inSim.connect({
  IName: "Driving InSim",
  Host: process.env.INSIM_HOST ?? "127.0.0.1",
  Port: process.env.INSIM_PORT ? parseInt(process.env.INSIM_PORT) : 29999,
  Admin: process.env.ADMIN ?? "",
  Flags: InSimFlags.ISF_LOCAL,
  ReqI: IS_ISI_ReqI.SEND_VERSION,
});

type State = {
  signals: "left" | "right" | "all" | "off";
  isSignalLightOn: boolean;
};

const state: State = {
  signals: "off",
  isSignalLightOn: false,
};

const outGauge = new OutGauge();

inSim.on(PacketType.ISP_VER, (packet) => {
  if (packet.ReqI !== IS_ISI_ReqI.SEND_VERSION) {
    return;
  }

  log(`Connected to LFS ${packet.Product} ${packet.Version}`);

  outGauge.connect({
    Host: process.env.OUTGAUGE_HOST ?? "127.0.0.1",
    Port: process.env.OUTGAUGE_PORT
      ? parseInt(process.env.OUTGAUGE_PORT)
      : 29998,
  });

  outGauge.on("connect", () => {
    log("OutGauge connected");

    inSim.send(
      new IS_MSL({
        Msg: "Driving InSim Local connected",
        Sound: MessageSound.SND_SYSMESSAGE,
      }),
    );
  });

  outGauge.on("packet", (packet) => {
    handleTurnSignals(packet);
  });
});

// Must be longer than interval between on and off states when blinking
const TURN_SIGNAL_INTERVAL_MS = 1100;

const turnSignalsOffWithDebounce = debounce((playerId: number) => {
  log("signals off");
  state.signals = "off";
  state.isSignalLightOn = false;
  inSim.send(new IS_MST({ Msg: `/i DL_SIGNAL_OFF ${playerId}` }));
}, TURN_SIGNAL_INTERVAL_MS);

function handleTurnSignals(packet: OutGaugePack) {
  // Turning on both signals
  if (
    (state.signals !== "all" || !state.isSignalLightOn) &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) > 0 &&
    (packet.ShowLights & DashLights.DL_SIGNAL_R) > 0
  ) {
    log("all signals on");
    turnSignalsOffWithDebounce(packet.PLID);

    if (state.signals !== "all") {
      inSim.send(new IS_MST({ Msg: `/i DL_SIGNAL_ALL ${packet.PLID}` }));
    }

    state.signals = "all";
    state.isSignalLightOn = true;
    return;
  }

  // Turning on left signal
  if (
    (state.signals !== "left" || !state.isSignalLightOn) &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) > 0 &&
    (packet.ShowLights & DashLights.DL_SIGNAL_R) === 0
  ) {
    log("left signal on");
    turnSignalsOffWithDebounce(packet.PLID);

    if (state.signals !== "left") {
      inSim.send(new IS_MST({ Msg: `/i DL_SIGNAL_L ${packet.PLID}` }));
    }

    state.signals = "left";
    state.isSignalLightOn = true;
    return;
  }

  // Turning off left signal
  if (
    state.signals === "left" &&
    state.isSignalLightOn &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) === 0
  ) {
    log("left signal off");
    state.isSignalLightOn = false;
    turnSignalsOffWithDebounce(packet.PLID);
    return;
  }

  // Turning on right signal
  if (
    (state.signals !== "right" || !state.isSignalLightOn) &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) === 0 &&
    (packet.ShowLights & DashLights.DL_SIGNAL_R) > 0
  ) {
    log("right signal on");
    turnSignalsOffWithDebounce(packet.PLID);

    if (state.signals !== "right") {
      inSim.send(new IS_MST({ Msg: `/i DL_SIGNAL_R ${packet.PLID}` }));
    }

    state.signals = "right";
    state.isSignalLightOn = true;
    return;
  }

  // Turning off right signal
  if (
    state.signals === "right" &&
    state.isSignalLightOn &&
    (packet.ShowLights & DashLights.DL_SIGNAL_R) === 0
  ) {
    log("right signal off");
    state.isSignalLightOn = false;
    turnSignalsOffWithDebounce(packet.PLID);
    return;
  }

  // Turning off all signals
  if (
    state.signals === "all" &&
    state.isSignalLightOn &&
    (packet.ShowLights & DashLights.DL_SIGNAL_R) === 0 &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) === 0
  ) {
    log("all signals off");
    state.isSignalLightOn = false;
    turnSignalsOffWithDebounce(packet.PLID);
    return;
  }
}

inSim.on("connect", () => log("InSim connected"));
inSim.on("disconnect", () => log("InSim disconnected"));

process.on("uncaughtException", (error) => {
  log(error);
  inSim.disconnect();
  outGauge.disconnect();
});
