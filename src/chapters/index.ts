import { renderCh01 } from "./ch01-dominance";
import { renderCh02 } from "./ch02-nash";
import { renderCh03 } from "./ch03-mixed";
import { renderCh04 } from "./ch04-sequential";
import { renderCh05 } from "./ch05-commitment";
import { renderCh06 } from "./ch06-repeated";
import { renderCh07 } from "./ch07-evolution";
import { renderCh08 } from "./ch08-signalling";
import { renderCh09 } from "./ch09-auctions";
import { renderCh10 } from "./ch10-bargaining";

export interface Chapter {
  num: number;
  part: string;
  title: string;
  blurb: string;
  /** Present once the chapter is built. */
  render?: (root: HTMLElement) => void;
}

export const PARTS = ["Static games", "Dynamics", "Information", "Design"];

export const CHAPTERS: Chapter[] = [
  { num: 1, part: PARTS[0], title: "Dominance and the Prisoner's Dilemma", blurb: "Why two rational people end up worse off than two cooperative ones.", render: renderCh01 },
  { num: 2, part: PARTS[0], title: "Nash equilibrium", blurb: "When nobody wants to move, given what everyone else is doing.", render: renderCh02 },
  { num: 3, part: PARTS[0], title: "Mixed strategies", blurb: "Penalty kicks, poker bluffs and the art of being unpredictable.", render: renderCh03 },
  { num: 4, part: PARTS[1], title: "Sequential games", blurb: "Look forward, reason backward.", render: renderCh04 },
  { num: 5, part: PARTS[1], title: "Commitment and credibility", blurb: "Why burning your bridges can win the battle.", render: renderCh05 },
  { num: 6, part: PARTS[1], title: "Repeated games", blurb: "How cooperation survives when the game never ends.", render: renderCh06 },
  { num: 7, part: PARTS[1], title: "Evolution", blurb: "Strategies that breed, compete and take over a population.", render: renderCh07 },
  { num: 8, part: PARTS[2], title: "Signalling", blurb: "Degrees, dividends and other costly ways to prove you're good.", render: renderCh08 },
  { num: 9, part: PARTS[2], title: "Auctions", blurb: "How to bid, and why the seller often doesn't care which format.", render: renderCh09 },
  { num: 10, part: PARTS[2], title: "Bargaining", blurb: "Splitting a pie that shrinks while you argue.", render: renderCh10 },
  { num: 11, part: PARTS[3], title: "Mechanism design", blurb: "Writing the rules so that telling the truth is the best move." },
  { num: 12, part: PARTS[3], title: "Matching", blurb: "Doctors, schools and kidneys: stable pairings without prices." },
];

export const chapter = (n: number) => CHAPTERS.find((c) => c.num === n);
