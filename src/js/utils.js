export function getNiceTickInterval(range, maxTicks) {
    const roughInterval = range / maxTicks;
    const p = Math.floor(Math.log10(roughInterval));
    const p10 = Math.pow(10, p);
    let v = roughInterval / p10; // Normalized between 1 and 10

    let niceV;
    if (v < 1.5) niceV = 1;
    else if (v < 2.2) niceV = 2;
    else if (v < 3.5) niceV = 2.5;
    else if (v < 7.5) niceV = 5;
    else niceV = 10;

    return niceV * p10;
}

export function getMousePos(evt, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}