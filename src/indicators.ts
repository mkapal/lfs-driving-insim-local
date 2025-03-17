import debounce from "debounce";
import { DashLights, InSim, OutGauge, OutGaugePack } from "node-insim";
import { IS_III, IS_MSL, IS_MST, PacketType } from "node-insim/packets";
import { log } from "./log";

type State = {
  signals: "left" | "right" | "all" | "off";
  isSignalLightOn: boolean;
};

const state: State = {
  signals: "off",
  isSignalLightOn: false,
};

export function handleIndicators(inSim: InSim, outGauge: OutGauge) {
  outGauge.on("packet", handleTurnSignals);
  inSim.on(PacketType.ISP_III, handleInSimHiddenMessage);

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

  function handleInSimHiddenMessage(packet: IS_III) {
    const args = packet.Msg.split(" ");

    switch (args[0]) {
      case "DL_SIGNAL_L": {
        const text = `left signal ON`;
        log(text);
        inSim.send(
          new IS_MSL({
            Msg: text,
          }),
        );
        break;
      }

      case "DL_SIGNAL_R": {
        const text = `right signal ON`;
        log(text);
        inSim.send(
          new IS_MSL({
            Msg: text,
          }),
        );
        break;
      }

      case "DL_SIGNAL_ALL": {
        const text = `all signals ON`;
        log(text);
        inSim.send(
          new IS_MSL({
            Msg: text,
          }),
        );
        break;
      }

      case "DL_SIGNAL_OFF": {
        const text = `signals OFF`;
        log(text);
        inSim.send(
          new IS_MSL({
            Msg: text,
          }),
        );
        break;
      }
    }
  }
}
