<script>
	export let fill = '#F6D682';
	export let stroke = '#D6B336';
	export let radius = 10;
	export let strokeWidth = 2;
	export let userId;
	export let playerId;
	export let gameFinished = false;

	let defaultFill = '#D3D3D3';
	let defaultStroke = '#808080';
	let cx = radius;
	let cy = radius;

	$: effectiveFill = playerId === userId || gameFinished ? fill : defaultFill;
	$: effectiveStroke = playerId === userId || gameFinished ? stroke : defaultStroke;

	$: points = `
		${cx},${cy - radius}
		${cx + (Math.sqrt(3) / 2) * radius},${cy - radius / 2}
		${cx + (Math.sqrt(3) / 2) * radius},${cy + radius / 2}
		${cx},${cy + radius}
		${cx - (Math.sqrt(3) / 2) * radius},${cy + radius / 2}
		${cx - (Math.sqrt(3) / 2) * radius},${cy - radius / 2}
	`;
</script>

<svg height={radius * 2} width={radius * 2} transform="rotate(90deg)">
	<polygon {points} fill={effectiveFill} stroke={effectiveStroke} stroke-width={strokeWidth} />
</svg>
