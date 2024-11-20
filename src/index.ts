import "./env";
import { DashLights, InSim, OutGauge, OutGaugePack } from "node-insim";
import {
  InSimFlags, IS_ISI_ReqI,
  IS_MSL,
  IS_MST,
  MessageSound,
  PacketType,
} from "node-insim/packets";
import { log } from "./log";

const inSim = new InSim();
inSim.connect({
  IName: "Driving InSim",
  Host: process.env.HOST ?? "127.0.0.1",
  Port: process.env.INSIM_PORT ? parseInt(process.env.INSIM_PORT) : 29999,
  Admin: process.env.ADMIN ?? "",
  Flags: InSimFlags.ISF_LOCAL,
  ReqI: IS_ISI_ReqI.SEND_VERSION
});

let signalTimeout: NodeJS.Timeout | null = null;

type State = {
  signals: "left" | "right" | "off";
};

const state: State = {
  signals: "off",
};

const outGauge = new OutGauge();

inSim.on(PacketType.ISP_VER, (packet) => {
  if (packet.ReqI !== IS_ISI_ReqI.SEND_VERSION) {
    return;
  }

  log(`Connected to LFS ${packet.Product} ${packet.Version}`);

  outGauge.connect({
    Host: process.env.HOST ?? "127.0.0.1",
    Port: process.env.OUTGAUGE_PORT ? parseInt(process.env.OUTGAUGE_PORT) : 29998,
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


function handleTurnSignals(packet: OutGaugePack) {
  // Turning on left signal
  if (
    state.signals !== "left" &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) > 0
  ) {
    console.log('left on')
    if (signalTimeout) {
      clearInterval(signalTimeout);
      return;
    }

    state.signals = "left";
    //log("signals left");
    inSim.send(
      new IS_MST({
        Msg: "/i DL_SIGNAL_L",
      }),
    );
    return;
  }

  // Turning off left signal
  if (
    state.signals === "left" &&
    (packet.ShowLights & DashLights.DL_SIGNAL_L) === 0
  ) {
    const timeoutMs = 1100; // Must be longer than interval between on and off states when blinking
    console.log('left off')
    state.signals = "off";
   /* if (signalTimeout) {
      return;
    }*/

    // signalTimeout = setTimeout(() => {
    //   state.signals = "off";
    //   log("signals off");
    //   inSim.send(
    //     new IS_MST({
    //       Msg: "/i DL_SIGNAL_OFF",
    //     }),
    //   );
    // }, timeoutMs);
  }
}

inSim.on("connect", () => log("InSim connected"));
inSim.on("disconnect", () => log("InSim disconnected"));

process.on("uncaughtException", (error) => {
  log(error);
  inSim.disconnect();
  outGauge.disconnect();
});
