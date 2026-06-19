import type { CardWithNote, ReviewRating } from "@orbit/api";

export type ReviewSide = "question" | "answer";

export interface ReviewFlowState {
  card: CardWithNote;
  side: ReviewSide;
}

export interface RatingButton {
  label: "Again" | "Hard" | "Good" | "Easy";
  value: ReviewRating["value"];
}

export interface TypedAnswerPrompt {
  error?: string;
  fieldName: string;
  prompt: string;
  side: "front" | "back";
  target?: string;
}

export interface TypedAnswerComparison {
  expected: string;
  isCorrect: boolean;
  supplied: string;
}

export interface AnswerTimer {
  cardId: string;
  startedAtMs: number;
  stoppedAtMs?: number;
}

export interface AnswerTimingOptions {
  maxAnswerMilliseconds?: number;
}

export interface ReviewAudioReference {
  filename: string;
  side: ReviewSide;
}

export interface ReviewAudioState extends ReviewAudioReference {
  positionSeconds: number;
  status: "paused" | "playing";
}

export interface OwnVoiceState {
  cardId: string;
  recordedAtMs: number;
  status: "playing" | "recorded";
}

const typedAnswerPattern = /\[\[type:([^\]]+)\]\]/u;
const clozePattern = /\{\{c(\d+)::(.*?)(?:::[^{}]*)?\}\}/gu;
const soundReferencePattern = /\[sound:([^\]]+)\]/u;

export function createReviewFlow(card: CardWithNote): ReviewFlowState {
  return {
    card,
    side: "question",
  };
}

export function revealAnswer(state: ReviewFlowState): ReviewFlowState {
  return {
    ...state,
    side: "answer",
  };
}

export function getRatingButtons(card: CardWithNote, side: ReviewSide): RatingButton[] {
  if (side === "question") {
    return [];
  }

  switch (getAnswerButtonCount(card)) {
    case 2:
      return [
        { label: "Again", value: 1 },
        { label: "Good", value: 4 },
      ];
    case 3:
      return [
        { label: "Again", value: 1 },
        { label: "Good", value: 4 },
        { label: "Easy", value: 5 },
      ];
    default:
      return [
        { label: "Again", value: 1 },
        { label: "Hard", value: 3 },
        { label: "Good", value: 4 },
        { label: "Easy", value: 5 },
      ];
  }
}

export function getTypedAnswerPrompt(card: CardWithNote): TypedAnswerPrompt | undefined {
  const frontPrompt = getTypedAnswerPromptForSide(card, "front");

  if (frontPrompt) {
    return frontPrompt;
  }

  return getTypedAnswerPromptForSide(card, "back");
}

export function removeTypedAnswerMarkers(value: string) {
  return value.replace(typedAnswerPattern, "");
}

export function compareTypedAnswer(
  suppliedValue: string,
  expectedValue: string,
): TypedAnswerComparison {
  const supplied = suppliedValue.trim();
  const expected = expectedValue.trim();

  return {
    expected,
    isCorrect: supplied.localeCompare(expected, undefined, { sensitivity: "accent" }) === 0,
    supplied,
  };
}

export function startAnswerTimer(cardId: string, nowMs: number): AnswerTimer {
  return {
    cardId,
    startedAtMs: nowMs,
  };
}

export function stopAnswerTimer(timer: AnswerTimer, nowMs: number): AnswerTimer {
  if (timer.stoppedAtMs !== undefined) {
    return timer;
  }

  return {
    ...timer,
    stoppedAtMs: nowMs,
  };
}

export function getTimerElapsedMilliseconds(timer: AnswerTimer, nowMs: number) {
  return Math.max(0, (timer.stoppedAtMs ?? nowMs) - timer.startedAtMs);
}

export function getTrackedAnswerMilliseconds(
  elapsedMilliseconds: number,
  options: AnswerTimingOptions,
) {
  const normalizedElapsedMilliseconds = Math.max(0, elapsedMilliseconds);

  if (options.maxAnswerMilliseconds === undefined) {
    return normalizedElapsedMilliseconds;
  }

  return Math.min(normalizedElapsedMilliseconds, Math.max(0, options.maxAnswerMilliseconds));
}

export function formatAnswerElapsedTime(elapsedMilliseconds: number) {
  const totalSeconds = Math.floor(Math.max(0, elapsedMilliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getReviewAudioReference(
  card: CardWithNote,
  side: ReviewSide,
): ReviewAudioReference | undefined {
  const template = side === "question" ? card.front : card.back;
  const match = soundReferencePattern.exec(template);
  const filename = match?.[1]?.trim();

  if (!filename) {
    return undefined;
  }

  return {
    filename,
    side,
  };
}

export function queueReviewAudio(
  card: CardWithNote,
  side: ReviewSide,
): ReviewAudioState | undefined {
  const reference = getReviewAudioReference(card, side);

  if (!reference) {
    return undefined;
  }

  return {
    ...reference,
    positionSeconds: 0,
    status: "playing",
  };
}

export function pauseReviewAudio(audio: ReviewAudioState | undefined) {
  if (!audio) {
    return undefined;
  }

  return {
    ...audio,
    status: "paused" as const,
  };
}

export function seekReviewAudio(audio: ReviewAudioState | undefined, offsetSeconds: number) {
  if (!audio) {
    return undefined;
  }

  return {
    ...audio,
    positionSeconds: Math.max(0, audio.positionSeconds + offsetSeconds),
  };
}

export function recordOwnVoice(cardId: string, nowMs: number): OwnVoiceState {
  return {
    cardId,
    recordedAtMs: nowMs,
    status: "recorded",
  };
}

export function replayOwnVoice(voice: OwnVoiceState | undefined) {
  if (!voice) {
    return undefined;
  }

  return {
    ...voice,
    status: "playing" as const,
  };
}

function getAnswerButtonCount(card: CardWithNote) {
  if (card.ankiQueue === 1 || card.ankiType === 1) {
    return 2;
  }

  if (card.ankiQueue === 0 || card.ankiType === 0) {
    return 3;
  }

  if (card.ankiQueue === null && card.ankiType === null && card.repetitions === 0) {
    return 3;
  }

  return 4;
}

function getTypedAnswerPromptForSide(
  card: CardWithNote,
  side: "front" | "back",
): TypedAnswerPrompt | undefined {
  const template = card[side];
  const match = typedAnswerPattern.exec(template);

  if (!match) {
    return undefined;
  }

  const fieldName = match[1]?.trim() ?? "";
  const parsedField = parseTypedAnswerField(fieldName);
  const fieldValue = getCardFieldValue(card, parsedField.fieldName);

  if (fieldValue === undefined) {
    return {
      error: `Unknown typed-answer field "${parsedField.fieldName}".`,
      fieldName: parsedField.fieldName,
      prompt: removeTypedAnswerMarkers(template),
      side,
      target: undefined,
    };
  }

  const target =
    parsedField.mode === "cloze" ? getActiveClozeText(card, fieldValue) : fieldValue.trim();

  return {
    error: undefined,
    fieldName: parsedField.fieldName,
    prompt: removeTypedAnswerMarkers(template),
    side,
    target: target || undefined,
  };
}

function parseTypedAnswerField(value: string) {
  const normalizedValue = value.trim();

  if (normalizedValue.toLowerCase().startsWith("cloze:")) {
    return {
      fieldName: normalizedValue.slice("cloze:".length).trim(),
      mode: "cloze" as const,
    };
  }

  return {
    fieldName: normalizedValue,
    mode: "field" as const,
  };
}

function getCardFieldValue(card: CardWithNote, fieldName: string) {
  switch (fieldName.toLowerCase()) {
    case "front":
      return card.front;
    case "back":
      return card.back;
    default:
      return undefined;
  }
}

function getActiveClozeText(card: CardWithNote, fieldValue: string) {
  const activeClozeNumber = (card.ankiOrder ?? 0) + 1;

  for (const match of fieldValue.matchAll(clozePattern)) {
    if (Number(match[1]) === activeClozeNumber) {
      return (match[2] ?? "").trim();
    }
  }

  return "";
}
