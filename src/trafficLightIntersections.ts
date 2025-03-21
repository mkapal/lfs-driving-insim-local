import { type InSim } from "node-insim";

import * as trafficLights from "./trafficLights";

const GO_WAIT_S = 2;
const GO_S = 30;
const STOP_WAIT_S = 3;
const STOP_S = 5;

export function createTrafficLightIntersections(inSim: InSim) {
  const trafficLightController = trafficLights.initialize(inSim);

  trafficLightController.createIntersection(
    [1, 2, 3, 4, 5, 6, 7],
    [
      {
        states: ["STOP_", "STOP_", "STOP_", "STOP_", "STOP_", "STOP_", "OFF__"],
        time: STOP_S,
      },
      {
        states: ["GO*__", "STOP_", "GO*__", "STOP_", "STOP_", "STOP_", "OFF__"],
        time: GO_WAIT_S,
      },
      // Pedestrians 6 - GO
      {
        states: ["GO___", "STOP_", "GO___", "STOP_", "STOP_", "GO___", "STOP*"],
        time: 1,
      },
      {
        states: ["GO___", "STOP_", "GO___", "STOP_", "STOP_", "GO___", "OFF__"],
        time: 1,
      },
      {
        states: ["GO___", "STOP_", "GO___", "STOP_", "STOP_", "GO___", "STOP*"],
        time: 1,
      },
      {
        states: ["GO___", "STOP_", "GO___", "STOP_", "STOP_", "GO___", "OFF__"],
        time: 1,
      },
      {
        states: ["GO___", "STOP_", "GO___", "STOP_", "STOP_", "GO___", "STOP*"],
        time: 1,
      },
      // Pedestrians 6 - STOP
      {
        states: ["GO___", "STOP_", "GO___", "STOP_", "STOP_", "STOP_", "OFF__"],
        time: GO_S - 5,
      },
      {
        states: ["STOP*", "STOP_", "STOP*", "STOP_", "STOP_", "STOP_", "OFF__"],
        time: STOP_WAIT_S,
      },
      {
        states: ["STOP_", "STOP_", "STOP_", "STOP_", "STOP_", "STOP_", "OFF__"],
        time: STOP_S,
      },
      {
        states: ["STOP_", "STOP_", "STOP_", "STOP_", "GO*__", "STOP_", "OFF__"],
        time: GO_WAIT_S,
      },
      {
        states: ["STOP_", "GO___", "STOP_", "GO___", "GO___", "STOP_", "OFF__"],
        time: 5,
      },
      {
        states: ["STOP_", "STOP_", "STOP_", "STOP_", "GO___", "STOP_", "OFF__"],
        time: GO_S - 5,
      },
      {
        states: ["STOP_", "STOP_", "STOP_", "STOP_", "STOP*", "STOP_", "OFF__"],
        time: STOP_WAIT_S,
      },
    ],
  );
}
