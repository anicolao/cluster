import{s as c,n as f,u as _,p,q as d}from"../chunks/scheduler.1ccb5123.js";import{S as m,i as g,d as r,v,b as $,t as b}from"../chunks/index.2c9ab685.js";const w=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));function u(s){let o;const a=s[1].default,e=f(a,s,s[0],null),i={c:function(){e&&e.c()},l:function(t){e&&e.l(t)},m:function(t,l){e&&e.m(t,l),o=!0},p:function(t,[l]){e&&e.p&&(!o||l&1)&&_(e,a,t,t[0],o?d(a,t[0],l,null):p(t[0]),null)},i:function(t){o||($(e,t),o=!0)},o:function(t){b(e,t),o=!1},d:function(t){e&&e.d(t)}};return r("SvelteRegisterBlock",{block:i,id:u.name,type:"component",source:"",ctx:s}),i}function y(s,o,a){let{$$slots:e={},$$scope:i}=o;v("Layout",e,["default"]);const n=[];return Object.keys(o).forEach(t=>{!~n.indexOf(t)&&t.slice(0,2)!=="$$"&&t!=="slot"&&console.warn(`<Layout> was created with unknown prop '${t}'`)}),s.$$set=t=>{"$$scope"in t&&a(0,i=t.$$scope)},[i,e]}class L extends m{constructor(o){super(o),g(this,o,y,u,c,{}),r("SvelteRegisterComponent",{component:this,tagName:"Layout",options:o,id:u.name})}}export{L as component,w as universal};