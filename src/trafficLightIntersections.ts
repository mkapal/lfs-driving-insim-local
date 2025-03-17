import { type InSim } from "node-insim";

import * as trafficLights from "./trafficLights";

const GO_WAIT_S = 2;
const GO_S = 30;
const STOP_WAIT_S = 3;
const STOP_S = 5;

export function createTrafficLightIntersections(inSim: InSim) {
  const trafficLightController = trafficLights.initialize(inSim);

  trafficLightController.createIntersection(
    [1, 2],
    [
      { states: ["STOP_____", "STOP_____"], time: STOP_S },
      { states: ["GO_WAIT__", "STOP_____"], time: GO_WAIT_S },
      { states: ["GO_______", "STOP_____"], time: GO_S },
      { states: ["STOP_WAIT", "STOP_____"], time: STOP_WAIT_S },
      { states: ["STOP_____", "STOP_____"], time: STOP_S },
      { states: ["STOP_____", "GO_WAIT__"], time: GO_WAIT_S },
      { states: ["STOP_____", "GO_______"], time: GO_S },
      { states: ["STOP_____", "STOP_WAIT"], time: STOP_WAIT_S },
    ],
  );
}
