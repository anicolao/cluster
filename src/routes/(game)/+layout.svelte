<script lang="ts">
import { auth, googleAuthProvider, signedIn, user } from "$lib/auth";
import { getVersion } from "$lib/version";
import { Signin } from "@ourway/svelte-firebase-auth";
</script>

<div class="top">
  {#if $signedIn === true}
    <slot />
  {:else if $signedIn === false}
    <p>Please sign in.</p>
    <Signin {auth} {googleAuthProvider} on:user_changed={user} />
    <div class="version">Version {getVersion()}</div>
  {:else}
    <div class="loading">
      <div class="lds-ripple">
        <div></div>
        <div></div>
      </div>
      <div class="hidden">
        <Signin {auth} {googleAuthProvider} on:user_changed={user} />
      </div>
    </div>
  {/if}
</div>

<style>
  .top {
    height: 100vh;
    color: darkorchid;
    background-color: black;
  }
  .version {
    font-weight: bold;
  }
  .hidden {
    opacity: 0.0001;
    width: 0;
    height: 0;
  }
  .loading {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lds-ripple,
  .lds-ripple div {
    box-sizing: border-box;
    display: inline-block;
  }
  .lds-ripple {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }
  .lds-ripple div {
    position: absolute;
    border: 4px solid currentColor;
    opacity: 0;
    border-radius: 50%;
    animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }
  .lds-ripple div:nth-child(1) {
    animation-delay: 1.5s;
  }
  .lds-ripple div:nth-child(2) {
    animation-delay: 1.0s;
  }
  @keyframes lds-ripple {
    0% {
      top: 36px;
      left: 36px;
      width: 8px;
      height: 8px;
      opacity: 0;
    }
    4.9% {
      top: 36px;
      left: 36px;
      width: 8px;
      height: 8px;
      opacity: 0;
    }
    5% {
      top: 36px;
      left: 36px;
      width: 8px;
      height: 8px;
      opacity: 1;
    }
    100% {
      top: 0;
      left: 0;
      width: 80px;
      height: 80px;
      opacity: 0;
    }
  }
</style>
