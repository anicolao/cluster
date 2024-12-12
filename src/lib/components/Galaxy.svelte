<script lang="ts">
import type { Position, Star } from "$common/gamestate";
import { T, useFrame } from "@threlte/core";
import { OrbitControls, interactivity } from "@threlte/extras";
import { type PerspectiveCamera, Quaternion, Vector3 } from "three";

interactivity();

// biome-ignore lint/style/useConst: Svelte parameter.
export let stars: Star[] = [];

let frameCount = 0;

useFrame(() => {
  frameCount++;
});

const cameraPosition: [number, number, number] = [0, 0, 20];
let cameraRef: PerspectiveCamera;
let route: number[] = [];
let starColor: { [k: number]: string } = {};
const defaultStarColor = "#f85122";
function starHilight(i: number) {
  return () => {
    starColor[i] = "#FFEA00";
  };
}
function starUnhilight(i: number) {
  return () => {
    starColor[i] = defaultStarColor;
  };
}
function routeClick(i: number) {
  return () => {
    route.push(i);
    const closestColor = "#ffffff";
    for (const ck in starColor) {
      if (starColor[ck] === closestColor) {
        starColor[ck] = defaultStarColor;
      }
    }
    const starDistances = stars
      .map((p, j) => [dist(p.position, stars[i].position), j])
      .sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < 4; ++i) {
      starColor[starDistances[i][1]] = "#ffffff";
    }
    // biome-ignore lint/correctness/noSelfAssign: Threlte-reactivity
    starColor = starColor;
    // biome-ignore lint/correctness/noSelfAssign: Threlte-reactivity
    route = route;
    console.log(route);
    return;
  };
}

const aStar = Math.trunc(Math.random() * stars.length);
const bStar = Math.trunc(Math.random() * stars.length);
starColor[aStar] = "#0000ff";
starColor[bStar] = "#00ff00";
console.log("aStar", aStar);

const radii = [0.5, 1, 1.5, 2, 2.5, 3];

function dist(p0: Position, p1: Position): number {
  const v0 = new Vector3(...p0);
  const v1 = new Vector3(...p1);
  return v0.distanceTo(v1);
}
function midPoint(p0: Position, p1: Position): Position {
  const ret = p0.map((p, i) => (p + p1[i]) / 2) as Position;
  console.log(p0, p1, ret);
  return ret;
}
</script>

<T.Group >
  <T.PerspectiveCamera
    makeDefault
    position={cameraPosition}
    fov={15}
    on:create={({ ref }) => {
      ref.lookAt(0, 0, 0);
      cameraRef = ref;
    }}
  >
    <OrbitControls />
  </T.PerspectiveCamera>
</T.Group>


<!-- Floor -->
{#each radii as r}
  <T.Mesh>
    <T.CircleGeometry args={[r, 36]} />
    <T.MeshBasicMaterial color="#666666" wireframe />
  </T.Mesh>
{/each}

<T.DirectionalLight intensity={0.8} position.x={5} position.y={10} />
<T.AmbientLight intensity={0.4} />

{#each stars as star, i}
  {@const lastStar = route[route.length - 1]}
  {@const color =
    lastStar === i ? "#00ee00" : starColor[i] ? starColor[i] : defaultStarColor
    }
  {@const position = star.position}
  <T.Mesh
    {position}
    on:click={routeClick(i)}
    on:pointerenter={starHilight(i)}
    on:pointerleave={starUnhilight(i)}
  >
    <T.SphereGeometry args={[0.05, 32, 16]} />
    <T.MeshStandardMaterial {color} />
    {#if lastStar === i}
      <T.PointLight args={["#00ff00", 0]} />
    {/if}
  </T.Mesh>
{/each}
<!-- Draw route between stars -->
{#each route as starIndex, i}
  {#if i > 0}
    {@const priorIndex = route[i - 1]}
    {@const position = stars[starIndex].position}
    {@const prior = stars[priorIndex].position}
    {@const origin = midPoint(position, prior)}
    {@const v0 = new Vector3(...position)}
    {@const v1 = new Vector3(...prior)}
    {@const distance = v1.distanceTo(v0)}
    {@const dir = v0.sub(v1).normalize()}
    {@const zAxis = new Vector3(0, 1, 0)}
    {@const quaternion = new Quaternion().setFromUnitVectors(zAxis, dir)}
    <T.Mesh
      position={origin}
      quaternion.x={quaternion.x}
      quaternion.y={quaternion.y}
      quaternion.z={quaternion.z}
      quaternion.w={quaternion.w}
    >
      <T.CylinderGeometry args={[0.01, 0.01, distance]} />
      <T.MeshStandardMaterial color="#00ff00" } />
    </T.Mesh>
  {/if}
{/each}

<!-- Projection to Galactic Plane -->
{#each stars as star}
  {@const position = star.position}
  <T.Mesh
    position={[position[0], position[1], position[2] / 2]}
    rotation.x={Math.PI / 2}
  >
    <T.CylinderGeometry args={[0.001, 0.001, -position[2]]} />
    <T.MeshBasicMaterial color="#666666" wireframe />
  </T.Mesh>
{/each}
