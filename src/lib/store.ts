import { configureSvelteStore } from "@ourway/svelte-redux";
import type { Writable } from "svelte/store";
import { users } from "./users";

const reducer = {
  users,
};

const reduxStore = configureSvelteStore(reducer);

type ReduxStore = typeof reduxStore;
type GlobalState = ReturnType<typeof reduxStore.getState>;
type SvelteStore = Writable<GlobalState>;

export const store = reduxStore as ReduxStore & SvelteStore;
