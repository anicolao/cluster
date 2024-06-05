<script>
import { auth, googleAuthProvider, user } from "$lib/auth";
import { Signin } from "@ourway/svelte-firebase-auth";
</script>

  <div class="main">
    <h1>Cluster</h1>
    <p>Cluster is a space conquest game.</p>
      <p>Your games are: ....</p>
      <p>  1</p>
      <p>  2</p>
      <p>  3</p>
    <p>Cluster is an obsessive slow real-time strategy
    game in which you compete to dominate the galaxy, but in which no
    single player has the resources or power to win on their own, making diplomacy
    and cooperation key to establishing a winning alliance or a winning play.</p>

    <Signin {auth} {googleAuthProvider} on:user_changed={user}/>
  </div>

<style>
  h1 {
    margin-top: 0;
  }
  .main {
    padding-left: 2em;
    padding-right: 2em;
  }
</style>