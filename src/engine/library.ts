import { GameTree, leaf, node } from "./tree";
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

/**
 * Penalty kick. Kicker (Row) aims at their natural side or the other side; keeper (Column)
 * dives one way. Payoffs are scoring chances in %, keeper gets 100 minus that. Rough figures
 * in line with studies of professional penalties: overall scoring near 80%.
 */
export const penaltyKick = makeGame({
  id: "penalty",
  title: "Penalty kick",
  players: ["Kicker", "Keeper"],
  rows: ["Natural", "Other"],
  cols: ["Natural", "Other"],
  payoffs: [
    [[70, 30], [95, 5]],
    [[92, 8], [55, 45]],
  ],
});

// ---------- Game trees (Chapter 4) ----------

/** Entry deterrence: the incumbent threatens a price war, but would it really fight? */
export const entryTree: GameTree = {
  id: "entry",
  title: "Market entry",
  players: ["Entrant", "Incumbent"],
  root: node(0, {
    Out: leaf(0, 4),
    In: node(1, { Fight: leaf(-2, -1), Share: leaf(1, 2) }, "inc"),
  }, "ent"),
};

/** Four-move centipede: the pot grows each time someone passes. */
export const centipedeTree: GameTree = {
  id: "centipede",
  title: "Centipede",
  players: ["Ava", "Ben"],
  root: node(0, {
    Take: leaf(2, 0),
    Pass: node(1, {
      Take: leaf(1, 3),
      Pass: node(0, {
        Take: leaf(4, 2),
        Pass: node(1, { Take: leaf(3, 5), Pass: leaf(6, 4) }, "c4"),
      }, "c3"),
    }, "c2"),
  }, "c1"),
};

/** Capacity race: the same game as a simultaneous one has two equilibria; moving first picks yours. */
export const leaderTree: GameTree = {
  id: "leader",
  title: "Capacity race",
  players: ["Leader", "Follower"],
  root: node(0, {
    Big: node(1, { Big: leaf(0, 0), Small: leaf(3, 1) }, "fb"),
    Small: node(1, { Big: leaf(1, 3), Small: leaf(2, 2) }, "fs"),
  }, "lead"),
};
