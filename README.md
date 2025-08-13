# 🐉 Kirby-Paris Hydra Slayer

A web-based implementation of the famous Kirby-Paris Hydra game - a mathematical puzzle that demonstrates principles from proof theory and ordinal analysis.

## What is the Kirby-Paris Hydra?

The Kirby-Paris Hydra is a mathematical object that appears to grow when you try to destroy it, but paradoxically, it can always be completely destroyed in finite time (though this may require an extraordinarily large number of steps).

## How to Play

1. **Objective**: Completely destroy the hydra by reducing it to just the root node (red node).

2. **Rules**:
   - You can only cut leaf nodes (orange nodes with no children)
   - You cannot cut the root node (red node)
   - When you cut a leaf, the hydra may grow according to the Kirby-Paris rules

3. **Kirby-Paris Rules**:
   - When you cut a leaf node, it is removed from the tree
   - If the parent of the cut leaf becomes a leaf itself, and that parent has a grandparent, then copies of that parent's subtree are added to the grandparent
   - The number of copies added depends on how many "steps up" you've made in previous cuts

## Game Features

- **Interactive Tree Visualization**: Click on orange leaf nodes to cut them
- **Dynamic Growth**: Watch the hydra grow and shrink according to mathematical rules
- **Multiple Hydras**: Generate new random hydra structures
- **Reset Function**: Return to the original hydra state
- **Move Counter**: Track your progress
- **Node Counter**: See how the hydra size changes

## Mathematical Significance

This game demonstrates several important mathematical concepts:

1. **Ordinal Analysis**: The hydra game is related to ordinal numbers and their arithmetic
2. **Proof Theory**: It illustrates principles from mathematical logic and proof theory
3. **Fast-Growing Functions**: The number of steps required can grow incredibly quickly
4. **Paris-Harrington Theorem**: This is related to unprovable statements in Peano arithmetic

## Color Coding

- **Red Node**: Root node (cannot be cut)
- **Blue Nodes**: Internal nodes with children (cannot be cut)
- **Orange Nodes**: Leaf nodes (can be cut)
- **Gray Nodes**: Non-interactive internal nodes on hover

## Files

- `index.html`: Main HTML structure
- `style.css`: Styling and animations
- `hydra.js`: Game logic and Kirby-Paris rule implementation
- `README.md`: This file

## Running the Game

Simply open `index.html` in a web browser. No server required!

## Mathematical Note

While the Hydra game always terminates in finite time, the upper bound on the number of steps required grows faster than any primitive recursive function. For some initial hydras, you might need more steps than there are atoms in the observable universe!

---

*"In mathematics, you don't understand things. You just get used to them."* - John von Neumann
