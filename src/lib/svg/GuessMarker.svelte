<script>
	export let category = 'nope';
	export let userId;
	export let playerId = userId;
	export let gameFinished = false;
	export let radius = 10;

	const categories = {
		okay: {
			fill: '#F6D682',
			stroke: '#D6B336'
		},
		good: {
			fill: '#C8D5BB',
			stroke: '#A0BE83'
		},
		great: {
			fill: '#A14EBF',
			stroke: '#632B78'
		},
		nope: {
			fill: '#3C3744',
			stroke: '#1E1B22'
		}
	};

	let defaultFill = '#D3D3D3';
	let defaultStroke = '#808080';
	let strokeWidth = 2;
	let cx = radius + 2;
	let cy = radius + 2;

	$: effectiveFill = playerId === userId || gameFinished ? categories[category].fill : defaultFill;
	$: effectiveStroke =
		playerId === userId || gameFinished ? categories[category].stroke : defaultStroke;

	$: points = `
        ${cx},${cy - radius}
        ${cx + (Math.sqrt(3) / 2) * radius},${cy - radius / 2}
        ${cx + (Math.sqrt(3) / 2) * radius},${cy + radius / 2}
        ${cx},${cy + radius}
        ${cx - (Math.sqrt(3) / 2) * radius},${cy + radius / 2}
        ${cx - (Math.sqrt(3) / 2) * radius},${cy - radius / 2}
    `;
</script>

<svg height={radius * 2.4} width={radius * 2.2} transform="rotate(90deg)">
	<polygon {points} fill={effectiveFill} stroke={effectiveStroke} stroke-width={strokeWidth} />
</svg>
