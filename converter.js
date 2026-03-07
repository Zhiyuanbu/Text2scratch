document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const convertButton = document.getElementById('convertButton');
    const outputText = document.getElementById('outputText');

    if (convertButton && inputText && outputText) {
        convertButton.addEventListener('click', () => {
            const text = inputText.value;
            // This is a placeholder for actual Scratch block conversion logic.
            // For now, it just echoes the text with a simple "Scratch-like" prefix.
            outputText.textContent = `say "${text}" for 2 seconds`;
        });
    }
});
