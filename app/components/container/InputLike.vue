<template>
  <div
    class="
      rounded-md
      border-0
      appearance-none
      focus:outline-none
      disabled:cursor-not-allowed
      disabled:opacity-75
      transition-colors
      px-2.5 py-1.5
      text-sm text-highlighted
      gap-1.5
      bg-default
      ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
    "
  >
    <slot />
  </div>
</template>
