# Kirby-Paris Hydra Game

[Web implementation of the Kirby-Paris Hydra game](https://frkns.github.io/HydraGame/)

<br>

The hydra game can be shown to always terminate in finite steps. However, it can't be proved in Peano Arithmetic. Good example of a *true but unprovable* statement in PA.

### Rules

The game starts at turn $t = 1$.<br>
Each turn, until the hydra is defeated:
1. Choose a leaf node $V$.
2. Delete $V$ from tree.
3. Then, attach $t$ copies of the subtree rooted at $V$'s parent to $V$'s grandparent*.
4. Increment $t$ by $1$.
<BR>
   *If it exists.

### Growth Rate

Define $\text{Hydra}(n)$ as the number of turns required to defeat a chain (linked-list-like) hydra of length $n$.<BR>

Asymptotically, $\text{Hydra}$<BR>
$>$ all functions provably total in PA.<BR>
$\approx f_{\epsilon_0}$, where $f$ is the fast-growing hierachy.<BR>


