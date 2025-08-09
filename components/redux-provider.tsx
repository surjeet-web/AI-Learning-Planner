"use client"

import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { store } from "@/lib/store"
import { ClientOnly } from "./client-only"

export function ReduxProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ClientOnly>
        {children}
      </ClientOnly>
    </Provider>
  )
}
