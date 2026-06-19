import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  Ban,
  Bookmark,
  CalendarDays,
  Copy,
  FastForward,
  Flag,
  Info,
  Mic,
  Pause,
  PlayCircle,
  MoreHorizontal,
  Pencil,
  Rewind,
  RotateCcw,
  Settings,
  Trash,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { CardWithNote } from "@orbit/api";
import { Badge } from "@orbit/ui/components/badge";
import { Button } from "@orbit/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@orbit/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orbit/ui/components/dropdown-menu";
import { Textarea } from "@orbit/ui/components/textarea";
import { useUpdateCardMutation } from "@/lib/mutations/card";
import { useDeleteNoteMutation, useUpdateNoteMutation } from "@/lib/mutations/note";
import { useSubmitReviewMutation } from "@/lib/mutations/review";
import { dueCardsQueryOptions } from "@/lib/queries/review";
import {
  formatAnswerElapsedTime,
  compareTypedAnswer,
  getRatingButtons,
  pauseReviewAudio,
  queueReviewAudio,
  recordOwnVoice,
  replayOwnVoice,
  seekReviewAudio,
  getTimerElapsedMilliseconds,
  getTrackedAnswerMilliseconds,
  getTypedAnswerPrompt,
  removeTypedAnswerMarkers,
  startAnswerTimer,
  stopAnswerTimer,
  type AnswerTimer,
  type OwnVoiceState,
  type ReviewAudioState,
  type ReviewSide,
} from "./review-flow";

const maxTrackedAnswerMilliseconds = 60_000;
const autoAdvanceAnswerDelayMs = 600;
const autoAdvanceQuestionDelayMs = 600;
type AutoAdvanceQuestionAction = "reminder" | "show-answer";
type AutoAdvanceAnswerAction = "again" | "bury-card" | "good" | "hard";
const flagColors = [
  { label: "Flag red", value: 1 },
  { label: "Flag orange", value: 2 },
  { label: "Flag green", value: 3 },
  { label: "Flag blue", value: 4 },
  { label: "Flag pink", value: 5 },
  { label: "Flag turquoise", value: 6 },
  { label: "Flag purple", value: 7 },
] as const;

export interface ReviewPanelProps {
  deckId?: string;
  onCreateCopy?: (card: CardWithNote) => void;
  onFinished?: () => void;
}

export function ReviewPanel({ deckId, onCreateCopy, onFinished }: ReviewPanelProps) {
  const dueCards = useQuery(dueCardsQueryOptions({ deckId }));
  const currentCard = dueCards.data?.data[0];
  const review = useSubmitReviewMutation();
  const deleteNote = useDeleteNoteMutation();
  const updateCard = useUpdateCardMutation();
  const updateNote = useUpdateNoteMutation();
  const [answeredCardId, setAnsweredCardId] = useState<string>();
  const [cardInfoDialog, setCardInfoDialog] = useState<{
    card: CardWithNote;
    title: "Card Info" | "Previous Card Info";
  }>();
  const [dueDateInput, setDueDateInput] = useState("");
  const [editNoteDraft, setEditNoteDraft] = useState({ back: "", front: "" });
  const [isDeleteNoteOpen, setIsDeleteNoteOpen] = useState(false);
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [isAutoAdvanceEnabled, setIsAutoAdvanceEnabled] = useState(false);
  const [autoAdvanceQuestionAction, setAutoAdvanceQuestionAction] =
    useState<AutoAdvanceQuestionAction>("show-answer");
  const [autoAdvanceAnswerAction, setAutoAdvanceAnswerAction] =
    useState<AutoAdvanceAnswerAction>("good");
  const [isAutoAdvanceWaitForAudioEnabled, setIsAutoAdvanceWaitForAudioEnabled] = useState(false);
  const [autoAdvanceReminderCardId, setAutoAdvanceReminderCardId] = useState<string>();
  const [isForgetCardOpen, setIsForgetCardOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [timeboxLimitMilliseconds, setTimeboxLimitMilliseconds] = useState<number>();
  const [timeboxIntervalVersion, setTimeboxIntervalVersion] = useState(0);
  const [isTimeboxPromptOpen, setIsTimeboxPromptOpen] = useState(false);
  const [previousReviewedCard, setPreviousReviewedCard] = useState<CardWithNote>();
  const [answerTimer, setAnswerTimer] = useState<AnswerTimer>();
  const [answerTimerNowMs, setAnswerTimerNowMs] = useState(() => Date.now());
  const [typedAnswerInput, setTypedAnswerInput] = useState({ cardId: "", value: "" });
  const [reviewAudio, setReviewAudio] = useState<ReviewAudioState>();
  const [ownVoice, setOwnVoice] = useState<OwnVoiceState>();
  const side: ReviewSide = currentCard?.id === answeredCardId ? "answer" : "question";
  const isCurrentNoteMarked = currentCard?.ankiTags?.includes("marked") ?? false;
  const currentCardOwnVoice =
    currentCard && ownVoice?.cardId === currentCard.id ? ownVoice : undefined;
  const elapsedAnswerMilliseconds =
    currentCard && answerTimer?.cardId === currentCard.id
      ? getTimerElapsedMilliseconds(answerTimer, answerTimerNowMs)
      : 0;
  const typedAnswerPrompt = currentCard ? getTypedAnswerPrompt(currentCard) : undefined;
  const typedAnswerValue =
    currentCard && typedAnswerInput.cardId === currentCard.id ? typedAnswerInput.value : "";
  const typedAnswerComparison =
    side === "answer" && typedAnswerPrompt?.target
      ? compareTypedAnswer(typedAnswerValue, typedAnswerPrompt.target)
      : undefined;

  useEffect(() => {
    if (!currentCard) {
      setAnswerTimer(undefined);
      return undefined;
    }

    const startedAtMs = Date.now();
    setReviewAudio(undefined);
    setAutoAdvanceReminderCardId(undefined);
    setAnswerTimer(startAnswerTimer(currentCard.id, startedAtMs));
    setAnswerTimerNowMs(startedAtMs);

    const intervalId = window.setInterval(() => {
      setAnswerTimerNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentCard?.id]);

  useEffect(() => {
    if (!currentCard || !timeboxLimitMilliseconds || isTimeboxPromptOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsTimeboxPromptOpen(true);
    }, timeboxLimitMilliseconds);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentCard?.id, isTimeboxPromptOpen, timeboxIntervalVersion, timeboxLimitMilliseconds]);

  useEffect(() => {
    if (!currentCard || !isAutoAdvanceEnabled || side !== "question") {
      return undefined;
    }

    if (isAutoAdvanceWaitForAudioEnabled && reviewAudio?.status === "playing") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (autoAdvanceQuestionAction === "reminder") {
        setAutoAdvanceReminderCardId(currentCard.id);
      } else {
        revealCurrentAnswer();
      }
    }, autoAdvanceQuestionDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    autoAdvanceQuestionAction,
    currentCard?.id,
    isAutoAdvanceEnabled,
    isAutoAdvanceWaitForAudioEnabled,
    reviewAudio?.status,
    side,
  ]);

  useEffect(() => {
    if (!currentCard || !isAutoAdvanceEnabled || side !== "answer" || review.isPending) {
      return undefined;
    }

    if (isAutoAdvanceWaitForAudioEnabled && reviewAudio?.status === "playing") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (autoAdvanceAnswerAction === "bury-card") {
        updateCurrentCard({ buried: true });
        return;
      }

      const labelByAction = {
        again: "Again",
        good: "Good",
        hard: "Hard",
      } as const;
      const targetRating = ratingButtons.find(
        (rating) => rating.label === labelByAction[autoAdvanceAnswerAction],
      );

      if (targetRating) {
        submitRating(targetRating.value);
      }
    }, autoAdvanceAnswerDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    autoAdvanceAnswerAction,
    currentCard?.id,
    isAutoAdvanceEnabled,
    isAutoAdvanceWaitForAudioEnabled,
    review.isPending,
    reviewAudio?.status,
    side,
  ]);

  async function advanceAfterQueueMutation() {
    setAnsweredCardId(undefined);
    const result = await dueCards.refetch();

    if ((result.data?.data.length ?? 0) === 0) {
      onFinished?.();
    }
  }

  function submitRating(value: 1 | 2 | 3 | 4 | 5) {
    if (!currentCard) {
      return;
    }

    const reviewedCard = currentCard;
    const elapsedMilliseconds =
      answerTimer?.cardId === reviewedCard.id
        ? getTrackedAnswerMilliseconds(getTimerElapsedMilliseconds(answerTimer, Date.now()), {
            maxAnswerMilliseconds: maxTrackedAnswerMilliseconds,
          })
        : undefined;

    review.mutate(
      {
        cardId: reviewedCard.id,
        rating: {
          elapsedMilliseconds,
          value,
        },
      },
      {
        onSuccess() {
          setPreviousReviewedCard(reviewedCard);
          void advanceAfterQueueMutation();
        },
      },
    );
  }

  function updateCurrentCard(input: {
    buried?: boolean;
    dueAt?: string;
    flag?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
    forget?: true;
    suspended?: boolean;
  }) {
    if (!currentCard) {
      return;
    }

    updateCard.mutate(
      {
        cardId: currentCard.id,
        deckId: currentCard.deckId,
        input,
      },
      {
        onSuccess() {
          if (input.buried || input.dueAt || input.suspended) {
            void advanceAfterQueueMutation();
          } else {
            void dueCards.refetch();
          }
        },
      },
    );
  }

  function updateCurrentNote(input: { buried?: boolean; marked?: boolean; suspended?: boolean }) {
    if (!currentCard) {
      return;
    }

    updateNote.mutate(
      {
        noteId: currentCard.noteId,
        input,
      },
      {
        onSuccess() {
          if (input.buried || input.suspended) {
            void advanceAfterQueueMutation();
          } else {
            void dueCards.refetch();
          }
        },
      },
    );
  }

  function deleteCurrentNote() {
    if (!currentCard) {
      return;
    }

    deleteNote.mutate(
      {
        deckId: currentCard.deckId,
        noteId: currentCard.noteId,
      },
      {
        onSuccess() {
          setIsDeleteNoteOpen(false);
          void advanceAfterQueueMutation();
        },
      },
    );
  }

  function forgetCurrentCard() {
    updateCurrentCard({ forget: true });
    setIsForgetCardOpen(false);
  }

  function openDueDateDialog() {
    setDueDateInput(currentCard?.dueAt.slice(0, 10) ?? "");
    setIsDueDateOpen(true);
  }

  function setCurrentCardDueDate() {
    if (!dueDateInput) {
      return;
    }

    updateCurrentCard({ dueAt: new Date(`${dueDateInput}T00:00:00.000Z`).toISOString() });
    setIsDueDateOpen(false);
  }

  function revealCurrentAnswer() {
    if (!currentCard) {
      return;
    }

    const stoppedAtMs = Date.now();
    setAnsweredCardId(currentCard.id);
    setAutoAdvanceReminderCardId(undefined);
    setAnswerTimer((timer) =>
      timer?.cardId === currentCard.id ? stopAnswerTimer(timer, stoppedAtMs) : timer,
    );
    setAnswerTimerNowMs(stoppedAtMs);
  }

  function openEditNoteDialog() {
    if (!currentCard) {
      return;
    }

    setEditNoteDraft({ back: currentCard.back, front: currentCard.front });
    setIsEditNoteOpen(true);
  }

  function saveCurrentNoteEdit() {
    if (!currentCard) {
      return;
    }

    updateNote.mutate(
      {
        noteId: currentCard.noteId,
        input: editNoteDraft,
      },
      {
        onSuccess() {
          setIsEditNoteOpen(false);
          void dueCards.refetch();
        },
      },
    );
  }

  function replayCurrentAudio() {
    if (!currentCard) {
      return;
    }

    setReviewAudio(queueReviewAudio(currentCard, side));
  }

  function pauseCurrentAudio() {
    setReviewAudio((current) => pauseReviewAudio(current));
  }

  function seekCurrentAudio(offsetSeconds: number) {
    setReviewAudio((current) => seekReviewAudio(current, offsetSeconds));
  }

  function recordCurrentOwnVoice() {
    if (!currentCard) {
      return;
    }

    setOwnVoice(recordOwnVoice(currentCard.id, Date.now()));
  }

  function replayCurrentOwnVoice() {
    setOwnVoice((current) => replayOwnVoice(currentCardOwnVoice ?? current));
  }

  function enableShortTimebox() {
    setTimeboxLimitMilliseconds(1_000);
    setIsTimeboxPromptOpen(false);
    setTimeboxIntervalVersion((current) => current + 1);
  }

  function continueAfterTimebox() {
    setIsTimeboxPromptOpen(false);
    setTimeboxIntervalVersion((current) => current + 1);
  }

  function finishAfterTimebox() {
    setIsTimeboxPromptOpen(false);
    onFinished?.();
  }

  const ratingButtons = currentCard ? getRatingButtons(currentCard, side) : [];

  return (
    <section className="min-w-0" data-testid="review-panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">Review</h2>
          <p className="text-sm text-muted-foreground">Practice due cards from the active deck.</p>
        </div>
        <div className="flex items-center gap-2">
          {currentCard ? (
            <Badge aria-label="Answer timer" variant="outline">
              {formatAnswerElapsedTime(elapsedAnswerMilliseconds)}
            </Badge>
          ) : null}
          {isAutoAdvanceEnabled ? (
            <Badge aria-label="Auto Advance" variant="secondary">
              Auto Advance On
            </Badge>
          ) : null}
          {currentCard && getFlagLabel(currentCard.ankiFlags) ? (
            <Badge aria-label="Card flag" variant="secondary">
              {getFlagLabel(currentCard.ankiFlags)}
            </Badge>
          ) : null}
          {isCurrentNoteMarked ? (
            <Badge aria-label="Review mark" variant="secondary">
              Marked
            </Badge>
          ) : null}
          <Badge variant="outline">{dueCards.data?.pagination.total ?? 0} due</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More review actions"
                disabled={!currentCard || updateCard.isPending}
                size="icon-sm"
                type="button"
                variant="outline"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={openEditNoteDialog}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              {flagColors.map((flagColor) => (
                <DropdownMenuItem
                  key={flagColor.value}
                  onSelect={() => updateCurrentCard({ flag: flagColor.value })}
                >
                  <Flag className="size-4" />
                  {flagColor.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={() => updateCurrentCard({ flag: 0 })}>
                <X className="size-4" />
                Clear flag
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => updateCurrentCard({ buried: true })}>
                <Archive className="size-4" />
                Bury Card
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsForgetCardOpen(true)}>
                <RotateCcw className="size-4" />
                Forget Card
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={openDueDateDialog}>
                <CalendarDays className="size-4" />
                Set Due Date
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => updateCurrentNote({ buried: true })}>
                <Archive className="size-4" />
                Bury Note
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => updateCurrentCard({ suspended: true })}>
                <Ban className="size-4" />
                Suspend Card
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsOptionsOpen(true)}>
                <Settings className="size-4" />
                Options
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => updateCurrentNote({ suspended: true })}>
                <Ban className="size-4" />
                Suspend Note
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => updateCurrentNote({ marked: !isCurrentNoteMarked })}
              >
                <Bookmark className="size-4" />
                {isCurrentNoteMarked ? "Unmark Note" : "Mark Note"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsAutoAdvanceEnabled((current) => !current)}>
                <PlayCircle className="size-4" />
                Auto Advance
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAutoAdvanceQuestionAction("show-answer")}>
                <PlayCircle className="size-4" />
                Question Auto Show Answer
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAutoAdvanceQuestionAction("reminder")}>
                <Info className="size-4" />
                Question Auto Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAutoAdvanceAnswerAction("good")}>
                <PlayCircle className="size-4" />
                Answer Auto Good
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAutoAdvanceAnswerAction("hard")}>
                <PlayCircle className="size-4" />
                Answer Auto Hard
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAutoAdvanceAnswerAction("again")}>
                <RotateCcw className="size-4" />
                Answer Auto Again
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAutoAdvanceAnswerAction("bury-card")}>
                <Archive className="size-4" />
                Answer Auto Bury Current
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setIsAutoAdvanceWaitForAudioEnabled((current) => !current)}
              >
                <Volume2 className="size-4" />
                Wait For Audio
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={enableShortTimebox}>
                <Settings className="size-4" />
                Timebox 1s
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={replayCurrentAudio}>
                <Volume2 className="size-4" />
                Replay Audio
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!reviewAudio} onSelect={pauseCurrentAudio}>
                <Pause className="size-4" />
                Pause Audio
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!reviewAudio} onSelect={() => seekCurrentAudio(-5)}>
                <Rewind className="size-4" />
                Audio -5s
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!reviewAudio} onSelect={() => seekCurrentAudio(5)}>
                <FastForward className="size-4" />
                Audio +5s
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={recordCurrentOwnVoice}>
                <Mic className="size-4" />
                Record Own Voice
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!currentCardOwnVoice} onSelect={replayCurrentOwnVoice}>
                <Volume2 className="size-4" />
                Replay Own Voice
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (currentCard) {
                    onCreateCopy?.(currentCard);
                  }
                }}
              >
                <Copy className="size-4" />
                Create Copy
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (currentCard) {
                    setCardInfoDialog({ card: currentCard, title: "Card Info" });
                  }
                }}
              >
                <Info className="size-4" />
                Card Info
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!previousReviewedCard}
                onSelect={() => {
                  if (previousReviewedCard) {
                    setCardInfoDialog({
                      card: previousReviewedCard,
                      title: "Previous Card Info",
                    });
                  }
                }}
              >
                <Info className="size-4" />
                Previous Card Info
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsDeleteNoteOpen(true)}>
                <Trash className="size-4" />
                Delete Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!currentCard ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          No cards are due.
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{removeTypedAnswerMarkers(currentCard.front)}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {reviewAudio ? (
              <p
                aria-label="Review audio status"
                className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground"
              >
                {reviewAudio.status === "playing" ? "Playing" : "Paused"} {reviewAudio.side} audio{" "}
                {reviewAudio.filename} at {reviewAudio.positionSeconds}s
              </p>
            ) : null}
            {currentCardOwnVoice ? (
              <p
                aria-label="Own voice status"
                className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground"
              >
                Own voice {currentCardOwnVoice.status}
              </p>
            ) : null}
            {currentCard.id === autoAdvanceReminderCardId ? (
              <p
                aria-label="Auto Advance Reminder"
                className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground"
              >
                Still reviewing. Show the answer when ready.
              </p>
            ) : null}
            {side === "question" && typedAnswerPrompt?.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {typedAnswerPrompt.error}
              </p>
            ) : null}
            {side === "question" && typedAnswerPrompt?.target ? (
              <label className="grid gap-1 text-sm font-medium" htmlFor="review-typed-answer">
                Type answer
                <input
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="review-typed-answer"
                  onChange={(event) =>
                    setTypedAnswerInput({
                      cardId: currentCard.id,
                      value: event.currentTarget.value,
                    })
                  }
                  value={typedAnswerValue}
                />
              </label>
            ) : null}
            {side === "answer" ? (
              <div className="grid gap-3">
                <p className="min-h-24 rounded-md bg-muted p-3 leading-relaxed">
                  {removeTypedAnswerMarkers(currentCard.back)}
                </p>
                {typedAnswerComparison ? (
                  <section
                    aria-label="Typed answer feedback"
                    className="grid gap-1 rounded-md border border-border p-3 text-sm"
                  >
                    <p className="font-medium">
                      {typedAnswerComparison.isCorrect ? "Correct" : "Needs review"}
                    </p>
                    <p className="text-muted-foreground">
                      Your answer: {typedAnswerComparison.supplied || "(blank)"}
                    </p>
                    <p className="text-muted-foreground">
                      Expected: {typedAnswerComparison.expected}
                    </p>
                  </section>
                ) : null}
              </div>
            ) : null}
            {side === "question" ? (
              <Button onClick={revealCurrentAnswer} type="button">
                Show Answer
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ratingButtons.map((rating) => (
                  <Button
                    key={rating.value}
                    onClick={() => submitRating(rating.value)}
                    type="button"
                    variant={getRatingVariant(rating.label)}
                  >
                    {rating.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {currentCard && isDeleteNoteOpen ? (
        <section
          aria-label="Delete Note"
          className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">Delete Note</h3>
              <p className="mt-1 text-sm text-muted-foreground">{currentCard.front}</p>
            </div>
            <Button
              aria-label="Close delete note"
              onClick={() => setIsDeleteNoteOpen(false)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Delete this note and remove its cards from the review queue.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsDeleteNoteOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={deleteNote.isPending}
              onClick={deleteCurrentNote}
              type="button"
              variant="destructive"
            >
              Delete note
            </Button>
          </div>
        </section>
      ) : null}
      {currentCard && isEditNoteOpen ? (
        <section
          aria-label="Edit Note"
          className="fixed top-20 left-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">Edit Note</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the current review note without leaving the session.
              </p>
            </div>
            <Button
              aria-label="Close edit note"
              onClick={() => setIsEditNoteOpen(false)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <label className="grid gap-1 text-sm font-medium" htmlFor="review-note-front">
            Front
            <Textarea
              id="review-note-front"
              onChange={(event) => {
                const value = event.currentTarget.value;

                setEditNoteDraft((current) => ({
                  ...current,
                  front: value,
                }));
              }}
              value={editNoteDraft.front}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium" htmlFor="review-note-back">
            Back
            <Textarea
              id="review-note-back"
              onChange={(event) => {
                const value = event.currentTarget.value;

                setEditNoteDraft((current) => ({
                  ...current,
                  back: value,
                }));
              }}
              value={editNoteDraft.back}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsEditNoteOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={
                updateNote.isPending || !editNoteDraft.front.trim() || !editNoteDraft.back.trim()
              }
              onClick={saveCurrentNoteEdit}
              type="button"
            >
              Save
            </Button>
          </div>
        </section>
      ) : null}
      {currentCard && isForgetCardOpen ? (
        <section
          aria-label="Forget Card"
          className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">Forget Card</h3>
              <p className="mt-1 text-sm text-muted-foreground">{currentCard.front}</p>
            </div>
            <Button
              aria-label="Close forget card"
              onClick={() => setIsForgetCardOpen(false)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Reset this card's review history and return it to the new-card queue.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsForgetCardOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={updateCard.isPending} onClick={forgetCurrentCard} type="button">
              Forget card
            </Button>
          </div>
        </section>
      ) : null}
      {currentCard && isDueDateOpen ? (
        <section
          aria-label="Set Due Date"
          className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">Set Due Date</h3>
              <p className="mt-1 text-sm text-muted-foreground">{currentCard.front}</p>
            </div>
            <Button
              aria-label="Close set due date"
              onClick={() => setIsDueDateOpen(false)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <label className="grid gap-1 text-sm font-medium" htmlFor="review-card-due-date">
            Due date
            <input
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="review-card-due-date"
              onChange={(event) => setDueDateInput(event.currentTarget.value)}
              type="date"
              value={dueDateInput}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setIsDueDateOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={!dueDateInput || updateCard.isPending}
              onClick={setCurrentCardDueDate}
              type="button"
            >
              Set due date
            </Button>
          </div>
        </section>
      ) : null}
      {cardInfoDialog ? (
        <ReviewCardInfoDialog
          card={cardInfoDialog.card}
          onClose={() => setCardInfoDialog(undefined)}
          title={cardInfoDialog.title}
        />
      ) : null}
      {isOptionsOpen ? (
        <section
          aria-label="Deck Options"
          className="fixed top-24 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
          role="dialog"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-normal">Deck Options</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Review options for {currentCard?.deckName ?? "this deck"}.
              </p>
            </div>
            <Button
              aria-label="Close deck options"
              onClick={() => setIsOptionsOpen(false)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Auto Advance</dt>
            <dd>
              {isAutoAdvanceEnabled ? "Enabled" : "Disabled"}; question {autoAdvanceQuestionAction};
              answer {autoAdvanceAnswerAction}
            </dd>
            <dt className="text-muted-foreground">Wait For Audio</dt>
            <dd>{isAutoAdvanceWaitForAudioEnabled ? "Enabled" : "Disabled"}</dd>
            <dt className="text-muted-foreground">Answer Timer</dt>
            <dd>Shown</dd>
          </dl>
        </section>
      ) : null}
      {isTimeboxPromptOpen ? (
        <section
          aria-label="Timebox"
          className="fixed top-28 left-1/2 z-50 grid w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
          role="dialog"
        >
          <div>
            <h3 className="text-base font-semibold tracking-normal">Timebox</h3>
            <p className="mt-1 text-sm text-muted-foreground">This review timebox has ended.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={finishAfterTimebox} type="button" variant="ghost">
              Finish
            </Button>
            <Button onClick={continueAfterTimebox} type="button">
              Continue
            </Button>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function ReviewCardInfoDialog({
  card,
  onClose,
  title,
}: {
  card: CardWithNote;
  onClose: () => void;
  title: "Card Info" | "Previous Card Info";
}) {
  return (
    <section
      aria-label={title}
      className="fixed top-20 right-4 z-50 grid w-[min(28rem,calc(100vw-2rem))] gap-3 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-normal">{title}</h3>
          <p className="text-sm text-muted-foreground">Review log and scheduling metadata.</p>
        </div>
        <Button
          aria-label={`Close ${title.toLowerCase()}`}
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Card ID</dt>
        <dd className="wrap-anywhere">{card.id}</dd>
        <dt className="text-muted-foreground">Note ID</dt>
        <dd className="wrap-anywhere">{card.noteId}</dd>
        <dt className="text-muted-foreground">Deck</dt>
        <dd>{card.deckName}</dd>
        <dt className="text-muted-foreground">State</dt>
        <dd>{getCardStateName(card)}</dd>
        <dt className="text-muted-foreground">Due</dt>
        <dd>{formatDueDate(card.dueAt)}</dd>
        <dt className="text-muted-foreground">Interval</dt>
        <dd>{card.intervalDays} days</dd>
        <dt className="text-muted-foreground">Reviews</dt>
        <dd>{card.repetitions}</dd>
      </dl>
      <section className="grid gap-1 rounded-md border border-border p-3">
        <h4 className="text-sm font-medium">Review log</h4>
        <p className="text-sm text-muted-foreground">
          {card.repetitions > 0
            ? `${card.repetitions} prior review${card.repetitions === 1 ? "" : "s"} recorded.`
            : "No prior reviews recorded."}
        </p>
      </section>
      <section className="grid gap-1 rounded-md border border-border p-3">
        <h4 className="text-sm font-medium">Prompt</h4>
        <p className="text-sm">{card.front}</p>
      </section>
    </section>
  );
}

function getFlagLabel(flags: number | null) {
  const flag = (flags ?? 0) & 7;
  const flagColor = flagColors.find((color) => color.value === flag);

  return flagColor ? `${flagColor.label.replace("Flag ", "")} flag` : undefined;
}

function getRatingVariant(label: string) {
  switch (label) {
    case "Again":
      return "destructive";
    case "Hard":
      return "outline";
    case "Easy":
      return "secondary";
    default:
      return "default";
  }
}

function getCardStateName(card: CardWithNote) {
  switch (card.ankiQueue) {
    case -3:
      return "Buried sibling";
    case -2:
      return "Buried";
    case -1:
      return "Suspended";
    case 0:
      return "New";
    case 1:
      return "Learning";
    case 2:
      return "Review";
    case 3:
      return "Relearning";
    default:
      return "Unknown";
  }
}

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
