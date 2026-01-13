export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
    },
    pageCard: {
      slots: {
        container: 'relative flex flex-col flex-1 lg:grid gap-x-8 gap-y-4 p-4 sm:p-6 w-full',
        wrapper: 'flex flex-col flex-1 items-start w-full overflow-hidden',
        body: 'flex-1 w-full',
        title: 'text-base text-pretty font-semibold text-highlighted w-full whitespace-nowrap truncate',
      },
    },
  },
  header: {
    to: '/',
    colorMode: true,
  },
  footer: {
    links: [],
  },
})
