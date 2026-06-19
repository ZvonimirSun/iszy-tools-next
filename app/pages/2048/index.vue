<script setup lang="ts">
import type { GameRefs, GameState, GameUiState, GameView } from './children/2048.types'
import GameManager from './children/ts/GameManager'

const gameStore = use2048Store()
const settingsStore = useSettingsStore()
const state = shallowRef<GameUiState | null>(null)
const gameManager = shallowRef<GameManager | null>(null)

const tileContainer = useTemplateRef<HTMLElement>('tileContainer')
const scoreContainer = useTemplateRef<HTMLElement>('scoreContainer')
const bestContainer = useTemplateRef<HTMLElement>('bestContainer')
const messageContainer = useTemplateRef<HTMLElement>('messageContainer')
const retryButton = useTemplateRef<HTMLElement>('retryButton')
const restartButton = useTemplateRef<HTMLElement>('restartButton')
const keepPlayingButton = useTemplateRef<HTMLElement>('keepPlayingButton')
const gameContainer = useTemplateRef<HTMLElement>('gameContainer')

function getGameRefs(): GameRefs {
  if (!tileContainer.value || !scoreContainer.value || !bestContainer.value || !messageContainer.value || !retryButton.value || !restartButton.value || !keepPlayingButton.value || !gameContainer.value) {
    throw new Error('2048 game refs are not ready')
  }

  return {
    tileContainer: tileContainer.value,
    scoreContainer: scoreContainer.value,
    bestContainer: bestContainer.value,
    messageContainer: messageContainer.value,
    retryButton: retryButton.value,
    restartButton: restartButton.value,
    keepPlayingButton: keepPlayingButton.value,
    gameContainer: gameContainer.value,
  }
}

onMounted(() => {
  const view: GameView = {
    refs: getGameRefs(),
    get gameState() {
      return gameStore.gameState
    },
    get bestScore() {
      return settingsStore.modules['2048'].bestScore
    },
    get state() {
      return state.value
    },
    set state(value: GameUiState | null) {
      state.value = value
    },
    setBestScore: gameStore.setBestScore,
    setGameState: (gameState?: GameState) => gameStore.setGameState(gameState),
    clearGameState: gameStore.clearGameState,
  }

  gameManager.value = new GameManager(4, view)
})

onBeforeUnmount(() => {
  gameManager.value?.destroy()
  gameManager.value = null
})
</script>

<template>
  <!-- eslint-disable vue/no-unused-refs -->
  <div>
    <div class="panel">
      <div class="wrapper">
        <div class="orientation-tip">
          <div class="orientation-tip-title">
            建议竖屏游玩
          </div>
          <div class="orientation-tip-text">
            当前横屏高度较小，竖屏可以获得更完整的棋盘和操作空间。
          </div>
        </div>
        <div class="above-game">
          <div class="scores-container">
            <div
              ref="scoreContainer"
              class="score-container"
            >
              0
            </div>
            <div
              ref="bestContainer"
              class="best-container"
            >
              0
            </div>
          </div>
          <a
            ref="restartButton"
            class="restart-button"
          >新游戏</a>
        </div>
        <div
          ref="gameContainer"
          class="game-container"
        >
          <div
            ref="messageContainer"
            class="game-message"
          >
            <p />
            <div class="lower">
              <a
                ref="keepPlayingButton"
                class="keep-playing-button"
              >继续挑战</a>
              <a
                ref="retryButton"
                class="retry-button"
              >重新开始</a>
            </div>
          </div>
          <div class="grid-container">
            <div
              v-for="item in 16"
              :key="item"
              class="grid-cell"
            />
          </div>
          <div
            ref="tileContainer"
            class="tile-container"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "sass:math";
@use "sass:list";
@use "sass:color";
@use "children/style/helpers" as *;

:deep(.panel) {

  $field-width: 31.25rem;
  $grid-spacing: .9375rem;
  $grid-row-cells: 4;
  $tile-size: math.div($field-width - $grid-spacing * ($grid-row-cells + 1), $grid-row-cells);
  $tile-border-radius: .1875rem;

  $mobile-threshold: $field-width + 1.25rem;

  $text-color: #776E65;
  $bright-text-color: #f9f6f2;

  $tile-color: #eee4da;
  $tile-gold-color: #edc22e;
  $tile-gold-glow-color: color.adjust($tile-gold-color, $lightness: 15%);

  $game-container-margin-top: 2.5rem;
  $game-container-background: #bbada0;

  $transition-speed: 100ms;

  @include keyframes(move-up) {
    0% {
      top: 1.5625rem;
      opacity: 1;
    }

    100% {
      top: -3.125rem;
      opacity: 0;
    }
  }

  .scores-container {
    display: flex;
    box-sizing: content-box;

    * + * {
      margin-left: .3125rem;
    }
  }

  .score-container, .best-container {
    $height: 1.5625rem;

    position: relative;
    display: inline-block;
    background: $game-container-background;
    padding: .9375rem 1.5625rem;
    font-size: $height;
    height: $height;
    line-height: $height + 1.375rem;
    font-weight: bold;
    border-radius: .1875rem;
    color: white;
    text-align: center;
    box-sizing: content-box;

    &:after {
      position: absolute;
      width: 100%;
      top: .625rem;
      left: 0;
      text-transform: uppercase;
      font-size: .8125rem;
      line-height: .8125rem;
      text-align: center;
      color: $tile-color;
      box-sizing: content-box;
    }

    .score-addition {
      position: absolute;
      right: 1.875rem;
      color: red;
      font-size: $height;
      line-height: $height;
      font-weight: bold;
      color: rgba($text-color, .9);
      z-index: 100;
      box-sizing: content-box;
      @include animation(move-up 600ms ease-in);
      @include animation-fill-mode(both);
    }
  }

  .score-container:after {
    content: "分数";
    box-sizing: content-box;
  }

  .best-container:after {
    box-sizing: content-box;
    content: "最高分";
  }

  p {
    margin-top: 0;
    margin-bottom: .625rem;
    line-height: 1.65;
  }

  a {
    color: $text-color;
    font-weight: bold;
    text-decoration: underline;
    cursor: pointer;
  }

  strong {
    &.important {
      text-transform: uppercase;
    }
  }

  hr {
    border: none;
    border-bottom: .0625rem solid color.adjust($text-color, $lightness: 40%);
    margin-top: 1.25rem;
    margin-bottom: 1.875rem;
  }

  .wrapper {
    font-family: var(--font-sans);
    font-size: 1.125rem;
    color: $text-color;
    width: $field-width;
    max-width: 100%;
    margin: 0 auto;
    container-type: inline-size;
  }

  .orientation-tip {
    display: none;
  }

  @include keyframes(fade-in) {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  // Styles for buttons
  @mixin button {
    display: inline-block;
    background: color.adjust($game-container-background, $lightness: -20%);
    border-radius: .1875rem;
    padding: 0 1.25rem;
    text-decoration: none;
    color: $bright-text-color;
    height: 2.5rem;
    line-height: 2.625rem;
  }

  .game-container {
    --grid-spacing: clamp(.5rem, 3cqw, #{$grid-spacing});
    --tile-size: calc((100cqw - var(--grid-spacing) * 5) / 4);
    --tile-step: calc(var(--tile-size) + var(--grid-spacing));

    margin-top: $game-container-margin-top;
    position: relative;
    padding: var(--grid-spacing);

    cursor: default;
    -webkit-touch-callout: none;
    -ms-touch-callout: none;

    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    -ms-touch-action: none;
    touch-action: none;

    background: $game-container-background;
    border-radius: $tile-border-radius * 2;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;

    .game-message {
      display: none;

      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: rgba($tile-color, .5);
      z-index: 100;

      text-align: center;

      p {
        font-size: 3.75rem;
        font-weight: bold;
        height: 3.75rem;
        line-height: 3.75rem;
        margin-top: 13.875rem;
        // height: $field-width;
        // line-height: $field-width;
      }

      .lower {
        display: block;
        margin-top: 3.6875rem;
      }

      a {
        @include button;
        margin-left: .5625rem;
        // margin-top: 3.6875rem;

        &.keep-playing-button {
          display: none;
        }
      }

      & {
        @include animation(fade-in 800ms ease $transition-speed * 12);
        @include animation-fill-mode(both);
      }

      &.game-won {
        background: rgba($tile-gold-color, .5);
        color: $bright-text-color;

        a.keep-playing-button {
          display: inline-block;
        }
      }

      &.game-won, &.game-over {
        display: block;
      }
    }
  }

  .grid-container {
    position: absolute;
    z-index: 1;
  }

  .grid-cell {
    width: var(--tile-size);
    height: var(--tile-size);
    margin-right: var(--grid-spacing);
    margin-bottom: var(--grid-spacing);
    float: left;

    border-radius: $tile-border-radius;

    background: rgba($tile-color, .35);

    &:nth-child(#{$grid-row-cells}n) {
      margin-right: 0;
    }

    &:nth-last-child(-n + #{$grid-row-cells}) {
      margin-bottom: 0;
    }
  }

  .tile-container {
    position: absolute;
    z-index: 2;
  }

  .tile {
    &, .tile-inner {
      width: var(--tile-size);
      height: var(--tile-size);
      line-height: var(--tile-size);
    }

    @for $x from 1 through $grid-row-cells {
      @for $y from 1 through $grid-row-cells {
        &.tile-position-#{$x}-#{$y} {
          $xSteps: $x - 1;
          $ySteps: $y - 1;
          @include transform(translate(
            calc(var(--tile-step) * #{$xSteps}),
            calc(var(--tile-step) * #{$ySteps})
          ));
        }
      }
    }
  }

  .tile {
    position: absolute; // Makes transforms relative to the top-left corner

    .tile-inner {
      border-radius: $tile-border-radius;

      background: $tile-color;
      text-align: center;
      font-weight: bold;
      z-index: 10;

      font-size: 3.4375rem;
    }

    & {
      // Movement transition
      @include transition($transition-speed ease-in-out);
      -webkit-transition-property: -webkit-transform;
      -moz-transition-property: -moz-transform;
      transition-property: transform;
    }

    $base: 2;
    $exponent: 1;
    $limit: 11;

    // Colors for all 11 states, false = no special color
    $special-colors: false false, // 2
    false false, // 4
    #f78e48 true, // 8
    #fc5e2e true, // 16
    #ff3333 true, // 32
    #ff0000 true, // 64
    false true, // 128
    false true, // 256
    false true, // 512
    false true, // 1024
    false true; // 2048

    // Build tile colors
    @while $exponent <= $limit {
      $power: pow($base, $exponent);

      &.tile-#{$power} .tile-inner {
        // Calculate base background color
        $gold-percent: math.div($exponent - 1, $limit - 1) * 100%;
        $mixed-background: color.mix($tile-gold-color, $tile-color, $gold-percent);

        $nth-color: list.nth($special-colors, $exponent);

        $special-background: list.nth($nth-color, 1);
        $bright-color: list.nth($nth-color, 2);

        @if $special-background {
          $mixed-background: color.mix($special-background, $mixed-background, 55%);
        }

        @if $bright-color {
          color: $bright-text-color;
        }

        // Set background
        background: $mixed-background;

        // Add glow
        $glow-opacity: max(#{$exponent} - 4, 0) / ($limit - 4);

        @if not $special-background {
          box-shadow: 0 0 1.875rem .625rem rgba($tile-gold-glow-color, $glow-opacity / 1.8),
          inset 0 0 0 .0625rem rgba(white, $glow-opacity / 3);
        }

        // Adjust font size for bigger numbers
        @if $power >= 100 and $power < 1000 {
          font-size: 2.8125rem;

          // Media queries placed here to avoid carrying over the rest of the logic
          @include smaller($mobile-threshold) {
            font-size: 1.5625rem;
          }
        } @else if $power >= 1000 {
          font-size: 2.1875rem;

          @include smaller($mobile-threshold) {
            font-size: .9375rem;
          }
        }
      }

      $exponent: $exponent + 1;
    }

    // Super tiles (above 2048)
    &.tile-super .tile-inner {
      color: $bright-text-color;
      background: color.mix(#333, $tile-gold-color, 95%);

      font-size: 1.875rem;

      @include smaller($mobile-threshold) {
        font-size: .625rem;
      }
    }
  }

  @include keyframes(appear) {
    0% {
      opacity: 0;
      @include transform(scale(0));
    }

    100% {
      opacity: 1;
      @include transform(scale(1));
    }
  }

  .tile-new .tile-inner {
    @include animation(appear 200ms ease $transition-speed);
    @include animation-fill-mode(backwards);
  }

  @include keyframes(pop) {
    0% {
      @include transform(scale(0));
    }

    50% {
      @include transform(scale(1.2));
    }

    100% {
      @include transform(scale(1));
    }
  }

  .tile-merged .tile-inner {
    z-index: 20;
    @include animation(pop 200ms ease $transition-speed);
    @include animation-fill-mode(backwards);
  }

  .above-game {
    width: 100%;
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
  }

  .game-intro {
    float: left;
    line-height: 2.625rem;
    margin-bottom: 0;
  }

  .restart-button {
    @include button;
    display: block;
    text-align: center;
    float: right;
  }

  .game-explanation {
    margin-top: 3.125rem;
  }

  @include smaller($mobile-threshold) {
    $grid-row-cells: 4;
    $tile-border-radius: .1875rem;
    $game-container-margin-top: 1.0625rem;

    .wrapper {
      font-size: .9375rem;
      width: $field-width;
      max-width: 100%;
      margin: 0 auto;
    }

    .score-container, .best-container {
      margin-top: 0;
      padding: .9375rem .625rem;
      min-width: 2.5rem;
    }

    // Show intro and restart button side by side
    .game-intro {
      width: 55%;
      display: block;
      box-sizing: border-box;
      line-height: 1.65;
    }

    .restart-button {
      width: 25%;
      padding: 0;
      display: block;
      box-sizing: border-box;
      margin-top: .125rem;
    }

    .game-container {
      margin-top: $game-container-margin-top;
      position: relative;
      padding: var(--grid-spacing);

      cursor: default;
      -webkit-touch-callout: none;
      -ms-touch-callout: none;

      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;

      -ms-touch-action: none;
      touch-action: none;

      background: $game-container-background;
      border-radius: $tile-border-radius * 2;
      width: 100%;
      height: auto;
      aspect-ratio: 1;
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;

      .game-message {
        display: none;

        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background: rgba($tile-color, .5);
        z-index: 100;

        text-align: center;

        p {
          font-size: 3.75rem;
          font-weight: bold;
          height: 3.75rem;
          line-height: 3.75rem;
          margin-top: 13.875rem;
          // height: $field-width;
          // line-height: $field-width;
        }

        .lower {
          display: block;
          margin-top: 3.6875rem;
        }

        a {
          @include button;
          margin-left: .5625rem;
          // margin-top: 3.6875rem;

          &.keep-playing-button {
            display: none;
          }
        }

        & {
          @include animation(fade-in 800ms ease $transition-speed * 12);
          @include animation-fill-mode(both);
        }

        &.game-won {
          background: rgba($tile-gold-color, .5);
          color: $bright-text-color;

          a.keep-playing-button {
            display: inline-block;
          }
        }

        &.game-won, &.game-over {
          display: block;
        }
      }
    }

    .grid-container {
      position: absolute;
      z-index: 1;
    }

    .grid-cell {
      width: var(--tile-size);
      height: var(--tile-size);
      margin-right: var(--grid-spacing);
      margin-bottom: var(--grid-spacing);
      float: left;

      border-radius: $tile-border-radius;

      background: rgba($tile-color, .35);

      &:nth-child(#{$grid-row-cells}n) {
        margin-right: 0;
      }

      &:nth-last-child(-n + #{$grid-row-cells}) {
        margin-bottom: 0;
      }
    }

    .tile-container {
      position: absolute;
      z-index: 2;
    }

    .tile {
      &, .tile-inner {
        width: var(--tile-size);
        height: var(--tile-size);
        line-height: var(--tile-size);
      }

      @for $x from 1 through $grid-row-cells {
        @for $y from 1 through $grid-row-cells {
          &.tile-position-#{$x}-#{$y} {
            $xSteps: $x - 1;
            $ySteps: $y - 1;
            @include transform(translate(
              calc(var(--tile-step) * #{$xSteps}),
              calc(var(--tile-step) * #{$ySteps})
            ));
          }
        }
      }
    }

    // Rest of the font-size adjustments in the tile class
    .tile .tile-inner {
      font-size: 2.1875rem;
    }

    .game-message {
      p {
        font-size: 1.875rem !important;
        height: 1.875rem !important;
        line-height: 1.875rem !important;
        margin-top: 5.625rem !important;
      }

      .lower {
        margin-top: 1.875rem !important;
      }
    }
  }

  @media (orientation: landscape) and (max-height: 30rem) and (hover: none) and (pointer: coarse) {
    .wrapper {
      width: min($field-width, 100%);
      padding: 0 .75rem;
      box-sizing: border-box;
    }

    .orientation-tip {
      display: block;
      margin: 0 auto;
      padding: .75rem .9rem;
      border-radius: .25rem;
      background: rgba($game-container-background, .22);
      color: $text-color;
      text-align: center;
    }

    .orientation-tip-title {
      font-size: 1rem;
      font-weight: 700;
      line-height: 1.25;
    }

    .orientation-tip-text {
      margin-top: .25rem;
      font-size: .78rem;
      line-height: 1.35;
    }

    .above-game, .game-container {
      display: none;
    }
  }
}
</style>
