import { describe, expect, it, vi } from 'vitest'
import { createStore } from './catalogStore'

/** Promesse résolue à la demande, pour contrôler l'ordre de fin des tâches. */
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => (resolve = r))
  return { promise, resolve }
}

describe('createStore', () => {
  it('met à jour l’état et prévient les abonnés seulement s’il change', () => {
    const store = createStore({ count: 0 })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.setState((s) => ({ count: s.count + 1 }))
    expect(store.getState()).toEqual({ count: 1 })
    expect(listener).toHaveBeenCalledOnce()

    store.setState((s) => s)
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
    store.setState(() => ({ count: 2 }))
    expect(listener).toHaveBeenCalledOnce()
  })

  it('exécute les tâches l’une après l’autre, chacune sur l’état laissé par la précédente', async () => {
    const store = createStore<string[]>([])
    const slow = deferred()
    const first = store.enqueue(async () => {
      await slow.promise
      store.setState((s) => [...s, 'a'])
    })
    // Lancée avant la fin de la première : elle ne doit pas partir d'un état périmé.
    const second = store.enqueue(async () => store.setState((s) => [...s, 'b']))

    await Promise.resolve()
    expect(store.getState()).toEqual([])
    slow.resolve()
    await Promise.all([first, second])
    expect(store.getState()).toEqual(['a', 'b'])
  })

  it('poursuit la file après une tâche en échec, dont l’erreur est transmise à l’appelant', async () => {
    const store = createStore(0)
    const failing = store.enqueue(async () => {
      throw new Error('lecture impossible')
    })
    const next = store.enqueue(async () => {
      store.setState((n) => n + 1)
      return 'ok'
    })
    await expect(failing).rejects.toThrow('lecture impossible')
    await expect(next).resolves.toBe('ok')
    expect(store.getState()).toBe(1)
  })
})
