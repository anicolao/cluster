<script lang="ts">
import type { Position, Star } from "$common/gamestate";
import { T, useFrame } from "@threlte/core";
import {
  Float,
  HTML,
  OrbitControls,
  Stars,
  interactivity,
} from "@threlte/extras";
import { linear } from "svelte/easing";
import { tweened } from "svelte/motion";
import { type PerspectiveCamera, Quaternion, Vector3 } from "three";
import vertexShader from "./dynamic-vertex-shader.glsl?raw";
import fragmentShader from "./noise-grainy-fragment.glsl?raw";

interactivity();

// biome-ignore lint/style/useConst: Svelte parameter.
export let starIds: { [k: string]: Star } = {};

let frameCount = 0;

useFrame(() => {
  if (frameCount % 60000 === 0) {
    shaderTime.set(0, { duration: 0 });
    shaderTime.set(1, { duration: 1000000 });
  }
  frameCount++;
  // biome-ignore lint/correctness/noSelfAssign: trigger svelte to recalculate star name positions
  cameraRef = cameraRef;
});

const cameraPosition: [number, number, number] = [0, 0, 20];
let cameraRef: PerspectiveCamera;
let route: string[] = [];
let starColor: { [k: string]: number } = {};
function starHilight(id: string) {
  return () => {
    starColor[id] = 0xffea00;
  };
}
function starUnhilight(id: string) {
  return () => {
    starColor[id] = colorFromType(starIds[id]);
  };
}
function routeClick(id: string) {
  return () => {
    route.push(id);
    const closestColor = 0xffffff;
    for (const ck in starColor) {
      if (starColor[ck] === closestColor) {
        starColor[ck] = colorFromType(starIds[ck]);
      }
    }
    /*
    const starDistances = stars
      .map((p, j) => [dist(p.position, stars[i].position), j])
      .sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < 4; ++i) {
      starColor[starDistances[i][1]] = 0xffffff;
    }
    */
    // biome-ignore lint/correctness/noSelfAssign: Threlte-reactivity
    starColor = starColor;
    // biome-ignore lint/correctness/noSelfAssign: Threlte-reactivity
    route = route;
    console.log(route);
    return;
  };
}

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
const shaderTime = tweened(0, { easing: linear });

function vToPos(v: Vector3): Position {
  const ret: Position = [v.x, v.y, v.z];
  return ret;
}
const isHighlighted = (id: string) => starColor[id] === 0xffea00;
function colorFromType(s: Star) {
  return {
    O: 0x8080ff,
    B: 0x8888ff,
    A: 0xcccccc,
    F: 0xffffe0,
    G: 0xf0e68c,
    K: 0xfaa500,
    M: 0xff7f50,
  }[s.starClass];
}
</script>

<Stars />

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

{#each Object.keys(starIds) as starId, i}
  {@const star = starIds[starId]}
  {@const lastStar = route[route.length - 1]}
  {@const color =
    lastStar === starId ? 0x00ee00 : starColor[starId] ? starColor[starId] : colorFromType(star)
    }
  {@const position = star.position}
  {@const size = star.homeStarIndex !== undefined ? 0.1 : 0.03}
  {@const owner = star.owner}
  {@const tPosition = cameraRef?.localToWorld(cameraRef?.worldToLocal(new Vector3(...position)).add(new Vector3(0, -0.08, 0))) || new Vector3(...position)}
  {@const textPosition = vToPos(tPosition)}
  {@const distance = Math.trunc(cameraRef?.position?.distanceTo(new Vector3(...position))*100)/100}
  {@const scale = Math.max(2/Math.sqrt(distance), 0.8)}
  <Float floatIntensity={0.2} >
  {#if distance <= 5 || isHighlighted(starId)}
    <HTML position={textPosition} center pointerEvents="none">
        <div style="text-align: center; width: 12em; scale: {scale}">
          <p>{star.name}</p>
          <p>1/0/4/1</p>
          <p><b>{owner}</b></p>
        </div>
    </HTML>
  {/if}
    <T.Mesh
      {position}
      on:click={routeClick(starId)}
      on:pointerenter={starHilight(starId)}
      on:pointerleave={starUnhilight(starId)}
    >
      <T.SphereGeometry args={[size, 32, 16]} />
      <T.ShaderMaterial
        {fragmentShader}
        {vertexShader}
        uniforms={{
          time: {
            value: i,
          },
          scale: {
            value: 100,
          },
          highColor: {
            value: 0x00ff0000,
          },
          lowColor: {
            value: 0x00000000,
          },
        }}
        uniforms.time.value={i + $shaderTime}
        uniforms.highColor.value={color}
      />
      {#if lastStar === starId}
        <T.PointLight args={["#00ff00", 0]} />
      {/if}
    </T.Mesh>
  </Float>
{/each}
<!-- Draw route between stars -->
{#each route as starId, i}
  {#if i > 0}
    {@const priorId = route[i - 1]}
    {@const position = starIds[starId].position}
    {@const prior = starIds[priorId].position}
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
{#each Object.keys(starIds) as starId}
  {@const star = starIds[starId]}
  {@const position = star.position}
  <T.Mesh
    position={[position[0], position[1], position[2] / 2]}
    rotation.x={Math.PI / 2}
  >
    <T.CylinderGeometry args={[0.001, 0.001, -position[2]]} />
    <T.MeshBasicMaterial color="#444444" wireframe />
  </T.Mesh>
{/each}

<style>
p {
  margin:0; 
  padding: 0;
}
</style>
