<script lang="ts">
import { auth, googleAuthProvider, signedIn, user } from "$lib/auth";
import { getVersion } from "$lib/version";
import { Signin } from "@ourway/svelte-firebase-auth";
</script>

<div class="top">
  {#if $signedIn}
    <slot />
  {:else}
    <p>Please sign in.</p>
    <Signin {auth} {googleAuthProvider} on:user_changed={user} />
    <div class="version">Version {getVersion()}</div>
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
</style>
