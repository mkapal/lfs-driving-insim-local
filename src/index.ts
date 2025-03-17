import "./env";
import { InSim, OutGauge } from "node-insim";
import {
  InSimFlags,
  IS_ISI_ReqI,
  IS_MSL,
  IS_MST,
  MessageSound,
  PacketType,
} from "node-insim/packets";
import { log } from "./log";
import { createTrafficLightIntersections } from "./trafficLightIntersections";
import { handleIndicators } from "./indicators";

const inSim = new InSim();
inSim.connect({
  IName: "Driving InSim",
  Host: process.env.INSIM_HOST ?? "127.0.0.1",
  Port: process.env.INSIM_PORT ? parseInt(process.env.INSIM_PORT) : 29999,
  Admin: process.env.ADMIN ?? "",
  Flags: InSimFlags.ISF_LOCAL,
  ReqI: IS_ISI_ReqI.SEND_VERSION,
});

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

    handleIndicators(inSim, outGauge);
    createTrafficLightIntersections(inSim);
  });

  outGauge.on("disconnect", () => {
    log("OutGauge disconnected");
  });
});

inSim.on("connect", () => log("InSim connected"));
inSim.on("disconnect", () => log("InSim disconnected"));

process.on("uncaughtException", (error) => {
  log(error);
  inSim.disconnect();
  outGauge.disconnect();
});
