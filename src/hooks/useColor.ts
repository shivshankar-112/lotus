"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { GameState, ColorChoice, Bet, RoundResult } from "@/types/colorGame";
import {
  DEFAULT_CONFIG,
  generateRoundId,
  fetchRoundResult,
  calculatePayout,
} from "@/lib/gameEngine";
import { useGetCurrentRoundQuery, useLazyGetCurrentRoundQuery, useLazyGetMyResultQuery, useLazyGetResultQuery, usePlaceBetMutation } from "@/app/store/apis/games/colorGameSlice";
import { toast } from "sonner";

const INITIAL_STATE: GameState = {
  isLoading: true,
  error: null,
  phase: "betting",
  currentRoundId: generateRoundId(),
  timeLeft: DEFAULT_CONFIG.roundDuration,
  totalSeconds: DEFAULT_CONFIG.roundDuration,
  balance: DEFAULT_CONFIG.startingBalance,
  currentBet: null,
  lastResult: null,
  history: [],
  betHistory: [],
  isWin: null,
};

export function useGameEngine() {
  const { data: currentRoundData, isLoading: roundLoading, error: roundError } = useGetCurrentRoundQuery({});
  const [getMyResult, { data: resultData, isLoading: resultLoading }] = useLazyGetMyResultQuery();
  const [getResult] = useLazyGetMyResultQuery();

  const [getNextRound, { data: nextRoundData, isLoading: nextRoundLoading }] = useLazyGetCurrentRoundQuery();

  const [placeBetApi] = usePlaceBetMutation();

  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<GameState["phase"]>("betting");
  const roundIdRef = useRef(INITIAL_STATE.currentRoundId);

  useEffect(() => {
    console.log(roundLoading, currentRoundData, roundError, "huma humma")
    if (!roundLoading) {
      let timeLeft = (new Date(currentRoundData.data.endTime)).getTime() - Date.now();
      setState((s) => ({
        ...s,
        isLoading: false,
        currentRoundId: currentRoundData.data._id,
        currentRoundNumber: currentRoundData.data.roundNumber,
        timeLeft: Math.floor(timeLeft / 1000)
      }))
    }
  }, [roundLoading])


  // Keep refs in sync with state
  useEffect(() => {
    phaseRef.current = state.phase;
    roundIdRef.current = state.currentRoundId;
  }, [state.phase, state.currentRoundId]);

  // ── Resolve round ──────────────────────────────────────────────────────────
  const resolveRound = useCallback(async (roundId: string, pendingBet: GameState["currentBet"], balance: number) => {
    setState((s) => ({ ...s, phase: "revealing" }));

    try {
      const { data: { round, bet } } = pendingBet ? await getMyResult(roundId).unwrap() : await getResult(roundId).unwrap();
      if (!round || !round.result) {
        throw "no data"
      }
      let result = round.result;

      let betRecord: Bet | null = null;
      let newBalance = balance;
      let isWin = bet?.status == "won" ? true : false ;

      if (pendingBet || bet) {
        betRecord = {
          id: `${bet._id}`,
          roundId,
          choice: {
            number: bet.number,
            size: bet.size,
            color: bet.color
          },

          amount: bet.amount,
          status: bet.status,
          payout: bet.winAmount,
          timestamp: Date.now(),
        };
      }

      // if (pendingBet) {
      //   const { won, payout } = calculatePayout(
      //     pendingBet.choice,
      //     data.result,
      //     pendingBet.amount,
      //     DEFAULT_CONFIG.multipliers
      //   );
      //   isWin = won;
      //   newBalance = balance - pendingBet.amount + payout;

      //   betRecord = {
      //     id: `${roundId}-${Date.now()}`,
      //     roundId,
      //     choice: pendingBet.choice,
      //     amount: pendingBet.amount,
      //     status: won ? "won" : "lost",
      //     payout,
      //     timestamp: Date.now(),
      //   };
      // }
      const { number, color, size } = result;

      setState((s) => ({
        ...s,
        phase: "result",
        lastResult: {
          roundId: round._id,
          roundNumber: round.roundNumber,
          number,
          color,
          bigSmall: size,
          timestamp: round.updatedAt
        },
        isWin,
        balance: newBalance,
        betHistory: betRecord ? [betRecord, ...s.betHistory].slice(0, 100) : s.betHistory,
      }));

      const { data: nextRound } = await getNextRound({}).unwrap();

      let startIn = (new Date(nextRound.startTime)).getTime() - Date.now()
      // Auto-advance to next round after 3s
      setTimeout(() => {
        // const nextId = generateRoundId();
        let timeLeft = (new Date(nextRound.endTime)).getTime() - Date.now()
        setState((s) => ({
          ...s,
          phase: "betting",
          currentRoundId: nextRound._id,
          timeLeft: Math.floor(timeLeft / 1000),
          currentBet: null,
          lastResult: s.lastResult,
          history: [result, ...s.history].slice(0, 50),
          isWin: null,
        }));
      }, startIn > 0 ? startIn : 3000);
    } catch (err) {
      console.log("Failed to resolve round:", err);
      // setState((s) => ({ ...s, phase: "revealing" }));
    }
  }, []);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.phase === "result") return s;
        if (s.phase === "revealing") {
          const { currentRoundId, currentBet, balance } = s;

          setTimeout(() => resolveRound(currentRoundId, currentBet, balance), 0);
          return { ...s, timeLeft: 0, phase: "revealing" };
        }

        const next = s.timeLeft - 1;

        // Lock bets when lockout threshold reached
        if (next <= DEFAULT_CONFIG.lockoutSeconds && s.phase === "betting") {
          return { ...s, phase: "locked", timeLeft: next };
        }

        // Time's up — trigger resolution
        if (next <= 0) {
          // Capture current values for async resolve
          const { currentRoundId, currentBet, balance } = s;
          // Kick off async resolve outside setState
          setTimeout(() => resolveRound(currentRoundId, currentBet, balance), 0);
          return { ...s, timeLeft: 0, phase: "revealing" };
        }

        return { ...s, timeLeft: next };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resolveRound]);

  // ── Place bet ──────────────────────────────────────────────────────────────
  const placeBet = useCallback(async (choice: { color: ColorChoice | null, size: "big" | "small" | null, number: number | null }, amount: number) => {
    try {
      const { data } = await placeBetApi({
        amount,
        choice
      }).unwrap();

      console.log(data);
      let amountMult = 0;
      if (choice.color) { amountMult++ };
      if (choice.number) amountMult++;
      if (choice.size) amountMult++;
      setState((s) => {
        if (s.phase !== "betting") return s;
        if (amount > s.balance) return s;
        return { ...s, currentBet: { choice, amount: amount * amountMult } };
      });

    } catch (error: any) {
      console.log("error in placing bet", error);
      toast.error(error.data?.message || "Falied placing bet !")
    }
  }, []);


  // ── Cancel bet ─────────────────────────────────────────────────────────────
  const cancelBet = useCallback(() => {
    toast.error("Feature comming soon ...")
  }, []);

  // ── Add demo funds ─────────────────────────────────────────────────────────
  const addFunds = useCallback((amount: number) => {
    setState((s) => ({ ...s, balance: s.balance + amount }));
  }, []);

  return { state, placeBet, cancelBet, addFunds, config: DEFAULT_CONFIG };
}
