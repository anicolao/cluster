import { c as create_ssr_component, d as createEventDispatcher, o as onDestroy, b as validate_component } from "../../chunks/ssr.js";
import { initializeApp } from "@firebase/app";
import { getFirestore } from "@firebase/firestore";
import { configureStore, createAction, createReducer } from "@reduxjs/toolkit";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyD8RehkUFLhOZU7gzUVrlbB_dE9fLH40JM",
  authDomain: "cluster-7c384.firebaseapp.com",
  projectId: "cluster-7c384",
  storageBucket: "cluster-7c384.appspot.com",
  messagingSenderId: "311902599737",
  appId: "1:311902599737:web:cbeaebcd033f6770a1ebe8",
  measurementId: "G-HZRX1LJR44"
};
const app = initializeApp(firebaseConfig);
getFirestore();
function svelteStoreEnhancer(createStoreApi) {
  return function(reducer2, initialState2) {
    const reduxStore = createStoreApi(reducer2, initialState2);
    return {
      ...reduxStore,
      subscribe(fn) {
        fn(reduxStore.getState());
        return reduxStore.subscribe(() => {
          fn(reduxStore.getState());
        });
      }
    };
  };
}
function configureSvelteStore(reducer2) {
  return configureStore({
    reducer: reducer2,
    enhancers: [svelteStoreEnhancer],
    devTools: { maxAge: 1e5 }
  });
}
const login = createAction("login");
const logout = createAction("logout");
const initialState = {
  users: {}
};
const users = createReducer(initialState, (r) => {
  r.addCase(login, (state, action) => {
    state.users[action.payload.uid] = action.payload;
  });
  r.addCase(logout, (state, action) => {
    delete state.users[action.payload];
  });
});
const reducer = {
  users
};
configureSvelteStore(reducer);
const Signin = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { auth } = $$props;
  let { googleAuthProvider } = $$props;
  createEventDispatcher();
  onDestroy(() => {
  });
  if ($$props.auth === void 0 && $$bindings.auth && auth !== void 0)
    $$bindings.auth(auth);
  if ($$props.googleAuthProvider === void 0 && $$bindings.googleAuthProvider && googleAuthProvider !== void 0)
    $$bindings.googleAuthProvider(googleAuthProvider);
  return `${`<button data-svelte-h="svelte-1c9w0yl">Sign In</button>`}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const auth = getAuth(app);
  console.log("AUTH: ", auth);
  const googleAuthProvider = new GoogleAuthProvider();
  return `<h1 data-svelte-h="svelte-qgzpnk">Cluster</h1> <p data-svelte-h="svelte-gu42co">Please sign in.</p> ${validate_component(Signin, "Signin").$$render($$result, { auth, googleAuthProvider }, {}, {})}`;
});
export {
  Page as default
};
