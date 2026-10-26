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
