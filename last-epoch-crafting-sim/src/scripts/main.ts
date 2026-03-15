// main.ts - Main TypeScript entry point for the crafting simulator

import { Simulator } from './simulator';
import { updateItemDisplay, showCraftingResults } from './ui';

const simulator = new Simulator();

function init() {
    // Set up event listeners for user interactions
    const craftButton = document.getElementById('craft-button');
    if (craftButton) {
        craftButton.addEventListener('click', handleCrafting);
    }
}

function handleCrafting() {
    simulator.startCrafting();
    const results = simulator.getCraftingResults();
    showCraftingResults(results);
    updateItemDisplay();
}

document.addEventListener('DOMContentLoaded', init);