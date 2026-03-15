export function updateItemDisplay(item) {
    const itemDisplay = document.getElementById('item-display');
    if (itemDisplay) {
        itemDisplay.innerHTML = `
            <h2>${item.name}</h2>
            <p>Type: ${item.type}</p>
            <p>Requirements: ${item.requirements.join(', ')}</p>
        `;
    }
}

export function showCraftingResults(results) {
    const resultsDisplay = document.getElementById('crafting-results');
    if (resultsDisplay) {
        resultsDisplay.innerHTML = `
            <h3>Crafting Results</h3>
            <ul>
                ${results.map(result => `<li>${result}</li>`).join('')}
            </ul>
        `;
    }
}