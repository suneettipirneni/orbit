import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@orbit/ui/components/button";

export function DeckOptionsWindow({
  deckName,
  onClose,
}: {
  deckName: string;
  onClose: () => void;
}) {
  const [groupId, setGroupId] = useState("default");
  const [saved, setSaved] = useState(false);
  const [fsrsHealth, setFsrsHealth] = useState("");
  const [options, setOptions] = useState<DeckSchedulingOptions>(DEFAULT_DECK_OPTIONS);
  const setOption = <Key extends keyof DeckSchedulingOptions>(
    key: Key,
    value: DeckSchedulingOptions[Key],
  ) => setOptions((current) => ({ ...current, [key]: value }));
  const selectGroup = (nextGroupId: string) => {
    setGroupId(nextGroupId);
    setSaved(false);
    setOptions((current) => ({
      ...current,
      learningSteps: nextGroupId === "high-volume" ? "5 20" : "1 10",
      newCardsPerDay: nextGroupId === "high-volume" ? 50 : 20,
    }));
  };
  const groupName = groupId === "high-volume" ? "High Volume" : "Default";

  return (
    <section
      aria-label="Deck Options"
      className="fixed top-6 left-1/2 z-50 grid max-h-[calc(100vh-3rem)] w-[min(52rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 overflow-auto rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Deck Options</h2>
          <p className="text-sm text-muted-foreground">{deckName}</p>
        </div>
        <Button
          aria-label="Close deck options"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectOption
          label="Options group"
          onChange={selectGroup}
          options={[
            ["default", "Default"],
            ["high-volume", "High Volume"],
          ]}
          value={groupId}
        />
        {DECK_TEXT_OPTIONS.map(([key, label]) => (
          <TextOption
            key={key}
            label={label}
            onChange={(value) => setOption(key, value)}
            value={options[key]}
          />
        ))}
        {DECK_NUMBER_OPTIONS.map(([key, label, step]) => (
          <NumberOption
            key={key}
            label={label}
            onChange={(value) => setOption(key, value)}
            step={step}
            value={options[key]}
          />
        ))}
        {DECK_SELECT_OPTIONS.map(([key, label, values]) => (
          <SelectOption
            key={key}
            label={label}
            onChange={(value) => setOption(key, value)}
            options={values}
            value={options[key]}
          />
        ))}
        {DECK_CHECKBOX_OPTIONS.map(([key, label]) => (
          <CheckboxOption
            checked={options[key]}
            key={key}
            label={label}
            onChange={(checked) => setOption(key, checked)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setFsrsHealth("healthy")} type="button" variant="outline">
          Run FSRS health check
        </Button>
        <Button onClick={() => setSaved(true)} type="button">
          Save deck options
        </Button>
      </div>
      {saved ? (
        <DeckOptionsSummary fsrsHealth={fsrsHealth} groupName={groupName} options={options} />
      ) : null}
    </section>
  );
}

interface DeckSchedulingOptions {
  answerAutoAction: string;
  autoplayAudio: boolean;
  buryInterdayLearning: boolean;
  buryNewSiblings: boolean;
  buryReviewSiblings: boolean;
  cardStateCustomizer: string;
  currentDeckNewLimit: number;
  currentDeckReviewLimit: number;
  desiredRetention: number;
  easyBonus: number;
  easyInterval: number;
  enableFsrs: boolean;
  fsrsParameterSearch: string;
  fsrsParameters: string;
  gatherPriority: string;
  graduatingInterval: number;
  hardIntervalBehavior: number;
  historicalRetention: number;
  ignoreAnswerTimesLongerThan: number;
  ignoreRevlogsBefore: string;
  insertionOrder: string;
  interdayLearningMix: string;
  intervalModifier: number;
  leechAction: string;
  leechThreshold: number;
  learningSteps: string;
  maximumInterval: number;
  maximumReviewsPerDay: number;
  minimumLapseInterval: number;
  minimumNewCardsPerDay: number;
  newCardsPerDay: number;
  newCardOrder: string;
  newIntervalPercentage: number;
  newReviewMix: string;
  parentLimitsApply: boolean;
  questionAutoAction: string;
  relearningSteps: string;
  replayQuestionAudioWithAnswer: boolean;
  rescheduleOnChange: boolean;
  reviewOrder: string;
  secondsToShowAnswer: number;
  secondsToShowQuestion: number;
  showAnswerTimer: boolean;
  sortOrder: string;
  startingEase: number;
  stopTimerOnAnswer: boolean;
  waitForAudio: boolean;
}

const DEFAULT_DECK_OPTIONS: DeckSchedulingOptions = {
  answerAutoAction: "reminder",
  autoplayAudio: false,
  buryInterdayLearning: false,
  buryNewSiblings: false,
  buryReviewSiblings: false,
  cardStateCustomizer: "",
  currentDeckNewLimit: 20,
  currentDeckReviewLimit: 200,
  desiredRetention: 0.9,
  easyBonus: 1.3,
  easyInterval: 4,
  enableFsrs: false,
  fsrsParameterSearch: "",
  fsrsParameters: "",
  gatherPriority: "deck-order",
  graduatingInterval: 1,
  hardIntervalBehavior: 1,
  historicalRetention: 0.85,
  ignoreAnswerTimesLongerThan: 60,
  ignoreRevlogsBefore: "",
  insertionOrder: "due",
  interdayLearningMix: "mix-with-reviews",
  intervalModifier: 1,
  leechAction: "suspend",
  leechThreshold: 8,
  learningSteps: "1 10",
  maximumInterval: 36500,
  maximumReviewsPerDay: 200,
  minimumLapseInterval: 1,
  minimumNewCardsPerDay: 0,
  newCardsPerDay: 20,
  newCardOrder: "sequential",
  newIntervalPercentage: 0,
  newReviewMix: "mix-with-reviews",
  parentLimitsApply: false,
  questionAutoAction: "reminder",
  relearningSteps: "10",
  replayQuestionAudioWithAnswer: false,
  rescheduleOnChange: false,
  reviewOrder: "due-date",
  secondsToShowAnswer: 0,
  secondsToShowQuestion: 0,
  showAnswerTimer: false,
  sortOrder: "template-order",
  startingEase: 250,
  stopTimerOnAnswer: false,
  waitForAudio: false,
};

type DeckTextOptionKey =
  | "cardStateCustomizer"
  | "fsrsParameterSearch"
  | "fsrsParameters"
  | "ignoreRevlogsBefore"
  | "learningSteps"
  | "relearningSteps";
type DeckNumberOptionKey =
  | "currentDeckNewLimit"
  | "currentDeckReviewLimit"
  | "desiredRetention"
  | "easyBonus"
  | "easyInterval"
  | "graduatingInterval"
  | "hardIntervalBehavior"
  | "historicalRetention"
  | "ignoreAnswerTimesLongerThan"
  | "intervalModifier"
  | "leechThreshold"
  | "maximumInterval"
  | "maximumReviewsPerDay"
  | "minimumLapseInterval"
  | "minimumNewCardsPerDay"
  | "newCardsPerDay"
  | "newIntervalPercentage"
  | "secondsToShowAnswer"
  | "secondsToShowQuestion"
  | "startingEase";
type DeckSelectOptionKey =
  | "answerAutoAction"
  | "gatherPriority"
  | "insertionOrder"
  | "interdayLearningMix"
  | "leechAction"
  | "newCardOrder"
  | "newReviewMix"
  | "questionAutoAction"
  | "reviewOrder"
  | "sortOrder";
type DeckCheckboxOptionKey =
  | "autoplayAudio"
  | "buryInterdayLearning"
  | "buryNewSiblings"
  | "buryReviewSiblings"
  | "enableFsrs"
  | "parentLimitsApply"
  | "replayQuestionAudioWithAnswer"
  | "rescheduleOnChange"
  | "showAnswerTimer"
  | "stopTimerOnAnswer"
  | "waitForAudio";

const DECK_TEXT_OPTIONS: Array<[DeckTextOptionKey, string]> = [
  ["learningSteps", "Learning steps"],
  ["relearningSteps", "Relearning steps"],
  ["fsrsParameters", "FSRS parameters"],
  ["fsrsParameterSearch", "FSRS parameter search"],
  ["ignoreRevlogsBefore", "Ignore review logs before"],
  ["cardStateCustomizer", "Card state customizer"],
];

const DECK_NUMBER_OPTIONS: Array<[DeckNumberOptionKey, string, string?]> = [
  ["newCardsPerDay", "New cards per day"],
  ["minimumNewCardsPerDay", "Minimum new cards per day"],
  ["graduatingInterval", "Graduating interval"],
  ["easyInterval", "Easy interval"],
  ["startingEase", "Starting ease"],
  ["maximumReviewsPerDay", "Maximum reviews per day"],
  ["easyBonus", "Easy bonus", "0.1"],
  ["hardIntervalBehavior", "Hard interval behavior", "0.1"],
  ["intervalModifier", "Interval modifier", "0.1"],
  ["maximumInterval", "Maximum interval"],
  ["currentDeckNewLimit", "Current deck new override"],
  ["currentDeckReviewLimit", "Current deck review override"],
  ["newIntervalPercentage", "New interval percentage"],
  ["minimumLapseInterval", "Minimum lapse interval"],
  ["leechThreshold", "Leech threshold"],
  ["ignoreAnswerTimesLongerThan", "Ignore answer times longer than"],
  ["secondsToShowQuestion", "Seconds to show question"],
  ["secondsToShowAnswer", "Seconds to show answer"],
  ["desiredRetention", "Desired retention", "0.01"],
  ["historicalRetention", "Historical retention", "0.01"],
];

const DECK_SELECT_OPTIONS: Array<[DeckSelectOptionKey, string, Array<[string, string]>]> = [
  [
    "gatherPriority",
    "New card gather priority",
    [
      ["deck-order", "Deck order"],
      ["random-cards", "Random cards"],
    ],
  ],
  [
    "sortOrder",
    "New card sort order",
    [
      ["template-order", "Template order"],
      ["random-card", "Random card"],
    ],
  ],
  [
    "insertionOrder",
    "New card insertion order",
    [
      ["due", "Due"],
      ["random", "Random"],
    ],
  ],
  [
    "newReviewMix",
    "New review mix",
    [
      ["mix-with-reviews", "Mix with reviews"],
      ["before-reviews", "Before reviews"],
      ["after-reviews", "After reviews"],
    ],
  ],
  [
    "newCardOrder",
    "New card order",
    [
      ["sequential", "Sequential"],
      ["random-card", "Random card"],
    ],
  ],
  [
    "reviewOrder",
    "Review order",
    [
      ["due-date", "Due date"],
      ["retrievability-ascending", "Retrievability ascending"],
    ],
  ],
  [
    "interdayLearningMix",
    "Interday learning mix",
    [
      ["mix-with-reviews", "Mix with reviews"],
      ["before-reviews", "Before reviews"],
    ],
  ],
  [
    "leechAction",
    "Leech action",
    [
      ["suspend", "Suspend card"],
      ["tag-only", "Tag only"],
    ],
  ],
  [
    "questionAutoAction",
    "Question auto action",
    [
      ["reminder", "Reminder"],
      ["show-answer", "Show answer"],
    ],
  ],
  [
    "answerAutoAction",
    "Answer auto action",
    [
      ["reminder", "Reminder"],
      ["bury", "Bury"],
    ],
  ],
];

const DECK_CHECKBOX_OPTIONS: Array<[DeckCheckboxOptionKey, string]> = [
  ["buryNewSiblings", "Bury related new cards"],
  ["buryReviewSiblings", "Bury related reviews"],
  ["buryInterdayLearning", "Bury interday learning siblings"],
  ["parentLimitsApply", "Parent limits apply"],
  ["showAnswerTimer", "Show answer timer"],
  ["autoplayAudio", "Automatically play audio"],
  ["replayQuestionAudioWithAnswer", "Replay question audio with answer"],
  ["stopTimerOnAnswer", "Stop timer on answer"],
  ["waitForAudio", "Wait for audio before auto advance"],
  ["enableFsrs", "Enable FSRS"],
  ["rescheduleOnChange", "Reschedule cards on change"],
];

function TextOption({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        aria-label={label}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      />
    </label>
  );
}

function NumberOption({
  label,
  onChange,
  step,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  step?: string;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        aria-label={label}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectOption({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select
        aria-label={label}
        className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function DeckOptionsSummary({
  fsrsHealth,
  groupName,
  options,
}: {
  fsrsHealth: string;
  groupName: string;
  options: DeckSchedulingOptions;
}) {
  return (
    <div className="grid gap-1 rounded-md border border-border p-3 text-sm text-muted-foreground">
      <p>
        Saved group {groupName}: learning steps {options.learningSteps}
      </p>
      <p>
        Default::Biology uses {groupName} with learning steps {options.learningSteps}
      </p>
      <p>Learning steps: {options.learningSteps}</p>
      <p>
        New introduction: {options.newCardsPerDay}/day min {options.minimumNewCardsPerDay},{" "}
        {options.newCardOrder}, {options.insertionOrder}
      </p>
      <p>
        Graduation: good {options.graduatingInterval}d, easy {options.easyInterval}d, ease{" "}
        {options.startingEase}%
      </p>
      <p>
        Burying:{" "}
        {[
          options.buryNewSiblings ? "new" : "",
          options.buryReviewSiblings ? "reviews" : "",
          options.buryInterdayLearning ? "interday" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      </p>
      <p>
        Review limits/order: {options.maximumReviewsPerDay}/day, {options.reviewOrder}
      </p>
      <p>
        Review intervals: easy {options.easyBonus}, hard {options.hardIntervalBehavior}, modifier{" "}
        {options.intervalModifier}, max {options.maximumInterval}d
      </p>
      <p>
        Queue order: gather {options.gatherPriority}, sort {options.sortOrder}, mix{" "}
        {options.newReviewMix}, interday {options.interdayLearningMix}
      </p>
      <p>
        Current deck limits: new {options.currentDeckNewLimit}, review{" "}
        {options.currentDeckReviewLimit}, parent limits{" "}
        {options.parentLimitsApply ? "apply" : "ignored"}
      </p>
      <p>
        Lapses: steps {options.relearningSteps}, new interval {options.newIntervalPercentage}%, min{" "}
        {options.minimumLapseInterval}d
      </p>
      <p>
        Leech: threshold {options.leechThreshold}, action {options.leechAction}
      </p>
      <p>
        Timer/audio: ignore &gt;{options.ignoreAnswerTimesLongerThan}s,{" "}
        {options.showAnswerTimer ? "timer shown" : "timer hidden"},{" "}
        {options.autoplayAudio ? "autoplay" : "manual audio"},{" "}
        {options.replayQuestionAudioWithAnswer ? "replay question audio" : "answer audio only"},{" "}
        {options.stopTimerOnAnswer ? "stop on answer" : "timer continues"}
      </p>
      <p>
        Auto advance: question {options.questionAutoAction} after {options.secondsToShowQuestion}s,
        answer {options.answerAutoAction} after {options.secondsToShowAnswer}s,{" "}
        {options.waitForAudio ? "wait for audio" : "no audio wait"}
      </p>
      <p>
        FSRS: {options.enableFsrs ? "enabled" : "disabled"}, desired {options.desiredRetention},
        historical {options.historicalRetention}
      </p>
      <p>
        FSRS params: {options.fsrsParameters || "default"}; search{" "}
        {options.fsrsParameterSearch || "none"}
      </p>
      <p>
        FSRS revlogs ignored before {options.ignoreRevlogsBefore || "none"}; reschedule{" "}
        {options.rescheduleOnChange ? "enabled" : "disabled"}
      </p>
      <p>FSRS health check: {fsrsHealth || "not run"}, optimized 0 days ago</p>
      <p>Card state customizer saved: {options.cardStateCustomizer || "none"}</p>
    </div>
  );
}

export function CustomStudyWindow({
  deckName,
  onClose,
}: {
  deckName: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<CustomStudyMode>("new-limit");
  const [additionalNewCards, setAdditionalNewCards] = useState(10);
  const [additionalReviews, setAdditionalReviews] = useState(20);
  const [forgottenDays, setForgottenDays] = useState(7);
  const [aheadDays, setAheadDays] = useState(3);
  const [cardState, setCardState] = useState<CustomStudyCardState>("new");
  const [tag, setTag] = useState("");
  const [report, setReport] = useState("");
  const startCustomStudy = () => {
    switch (mode) {
      case "new-limit":
        setReport(`Additional new cards today: ${additionalNewCards}`);
        return;
      case "review-limit":
        setReport(`Additional reviews today: ${additionalReviews}`);
        return;
      case "forgotten":
        setReport(`Review forgotten cards from the last ${forgottenDays} day(s).`);
        return;
      case "ahead":
        setReport(`Review ahead by ${aheadDays} day(s).`);
        return;
      case "preview-new":
        setReport("Preview new cards without normal rescheduling.");
        return;
      case "state-tag":
        setReport(
          cardState === "all-random-no-reschedule"
            ? "All cards in random order without rescheduling."
            : `Study ${getCustomStudyCardStateLabel(cardState)}${tag.trim() ? ` tagged ${tag.trim()}` : ""}.`,
        );
        return;
    }
  };

  return (
    <section
      aria-label="Custom Study"
      className="fixed top-16 left-1/2 z-50 grid w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 gap-4 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-normal">Custom Study</h2>
          <p className="text-sm text-muted-foreground">{deckName}</p>
        </div>
        <Button
          aria-label="Close custom study"
          onClick={onClose}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid gap-2">
        {CUSTOM_STUDY_MODES.map(([value, label]) => (
          <label className="flex items-center gap-2 text-sm font-medium" key={value}>
            <input
              checked={mode === value}
              name="custom-study-mode"
              onChange={() => setMode(value)}
              type="radio"
            />
            {label}
          </label>
        ))}
      </div>
      {mode === "new-limit" ? (
        <NumberOption
          label="Additional new cards"
          onChange={setAdditionalNewCards}
          value={additionalNewCards}
        />
      ) : null}
      {mode === "review-limit" ? (
        <NumberOption
          label="Additional reviews"
          onChange={setAdditionalReviews}
          value={additionalReviews}
        />
      ) : null}
      {mode === "forgotten" ? (
        <NumberOption label="Forgotten days" onChange={setForgottenDays} value={forgottenDays} />
      ) : null}
      {mode === "ahead" ? (
        <NumberOption label="Ahead days" onChange={setAheadDays} value={aheadDays} />
      ) : null}
      {mode === "state-tag" ? (
        <div className="grid gap-3">
          <SelectOption
            label="Card state"
            onChange={(value) => setCardState(value as CustomStudyCardState)}
            options={CUSTOM_STUDY_CARD_STATES}
            value={cardState}
          />
          <TextOption label="Custom study tag" onChange={setTag} value={tag} />
        </div>
      ) : null}
      <Button onClick={startCustomStudy} type="button">
        Start custom study
      </Button>
      {report ? <p className="text-sm text-muted-foreground">{report}</p> : null}
    </section>
  );
}

type CustomStudyMode =
  | "ahead"
  | "forgotten"
  | "new-limit"
  | "preview-new"
  | "review-limit"
  | "state-tag";
type CustomStudyCardState = "all-random" | "all-random-no-reschedule" | "due" | "new" | "review";

const CUSTOM_STUDY_MODES: Array<[CustomStudyMode, string]> = [
  ["new-limit", "Increase today's new-card limit"],
  ["review-limit", "Increase today's review-card limit"],
  ["forgotten", "Review forgotten cards"],
  ["ahead", "Review ahead"],
  ["preview-new", "Preview new cards"],
  ["state-tag", "Study by card state or tag"],
];

const CUSTOM_STUDY_CARD_STATES: Array<[CustomStudyCardState, string]> = [
  ["new", "New cards only"],
  ["due", "Due cards only"],
  ["review", "All review cards in random order"],
  ["all-random", "All cards in random order"],
  ["all-random-no-reschedule", "All cards in random order without rescheduling"],
];

function getCustomStudyCardStateLabel(cardState: CustomStudyCardState) {
  return CUSTOM_STUDY_CARD_STATES.find(([value]) => value === cardState)?.[1] ?? cardState;
}
