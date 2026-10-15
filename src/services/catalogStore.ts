/**
 * Petit store observable, indépendant de React, qui garde l'état courant et exécute les tâches
 * asynchrones (imports) l'une après l'autre.
 *
 * Pourquoi : un import est asynchrone (lecture des fichiers). Si deux imports se chevauchent et
 * partent chacun de l'état capturé au moment de l'appel, le second écrase le premier. Ici, chaque
 * tâche attend la fin de la précédente et lit l'état *courant* au moment où elle s'exécute.
 */
export interface Store<T> {
  getState: () => T
  setState: (update: (current: T) => T) => void
  subscribe: (listener: () => void) => () => void
  /** Exécute la tâche après toutes celles déjà en file ; une tâche en échec ne bloque pas les suivantes. */
  enqueue: <R>(task: () => Promise<R>) => Promise<R>
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()
  let queue: Promise<unknown> = Promise.resolve()

  return {
    getState: () => state,
    setState(update) {
      const next = update(state)
      if (next === state) return
      state = next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    enqueue(task) {
      const run = queue.then(task, task)
      queue = run.catch(() => undefined)
      return run
    },
  }
}
