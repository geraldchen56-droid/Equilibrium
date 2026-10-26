import { makeGame } from "./game";

// Canonical games used across chapters. Payoffs are (Row, Column).

export const prisonersDilemma = makeGame({
  id: "pd",
  title: "Prisoner's Dilemma",
  players: ["You", "Partner"],
  rows: ["Stay silent", "Confess"],
  cols: ["Stay silent", "Confess"],
  // Payoffs = minus years in prison.
  payoffs: [
    [[-1, -1], [-10, 0]],
    [[0, -10], [-5, -5]],
  ],
});

/** A 3x3 game that needs several rounds of elimination to solve. */
export const eliminationPuzzle = makeGame({
  id: "ieds-3x3",
  title: "Three rounds of elimination",
  rows: ["Top", "Middle", "Bottom"],
  cols: ["Left", "Centre", "Right"],
  payoffs: [
    [[4, 3], [5, 1], [6, 2]],
    [[2, 1], [8, 4], [3, 6]],
    [[3, 0], [9, 6], [2, 8]],
  ],
});

export const advertisingWar = makeGame({
  id: "ads",
  title: "Advertising war",
  players: ["Coke", "Pepsi"],
  rows: ["Advertise", "Don't"],
  cols: ["Advertise", "Don't"],
  // Profits in $bn.
  payoffs: [
    [[3, 3], [6, 1]],
    [[1, 6], [5, 5]],
  ],
});

export const matchingPennies = makeGame({
  id: "pennies",
  title: "Matching Pennies",
  rows: ["Heads", "Tails"],
  cols: ["Heads", "Tails"],
  payoffs: [
    [[1, -1], [-1, 1]],
    [[-1, 1], [1, -1]],
  ],
});

export const battleOfSexes = makeGame({
  id: "bos",
  title: "Battle of the Sexes",
  rows: ["Opera", "Football"],
  cols: ["Opera", "Football"],
  payoffs: [
    [[3, 2], [0, 0]],
    [[0, 0], [2, 3]],
  ],
});

/** Two pure equilibria, no dominated strategies: elimination can't solve it, Nash can. */
export const equilibriumHunt = makeGame({
  id: "hunt-3x3",
  title: "Hunt the equilibria",
  rows: ["Top", "Middle", "Bottom"],
  cols: ["Left", "Centre", "Right"],
  payoffs: [
    [[3, 3], [0, 2], [1, 0]],
    [[2, 0], [2, 1], [0, 3]],
    [[0, 1], [1, 0], [4, 4]],
  ],
});

export const drivingSide = makeGame({
  id: "driving",
  title: "Which side of the road?",
  players: ["You", "Oncoming driver"],
  rows: ["Left", "Right"],
  cols: ["Left", "Right"],
  payoffs: [
    [[1, 1], [-9, -9]],
    [[-9, -9], [1, 1]],
  ],
});

export const stagHunt = makeGame({
  id: "stag",
  title: "Stag Hunt",
  players: ["Hunter 1", "Hunter 2"],
  rows: ["Stag", "Hare"],
  cols: ["Stag", "Hare"],
  payoffs: [
    [[4, 4], [0, 3]],
    [[3, 0], [3, 3]],
  ],
});

export const chicken = makeGame({
  id: "chicken",
  title: "Chicken",
  players: ["Driver 1", "Driver 2"],
  rows: ["Swerve", "Straight"],
  cols: ["Swerve", "Straight"],
  payoffs: [
    [[0, 0], [-1, 2]],
    [[2, -1], [-10, -10]],
  ],
});
