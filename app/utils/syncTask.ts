let syncTask = Promise.resolve<unknown>(undefined)

export function enqueueSyncTask(task: () => Promise<unknown>) {
  syncTask = syncTask
    .catch(() => undefined)
    .then(task)
    .catch(e => console.error(e))

  return syncTask
}
