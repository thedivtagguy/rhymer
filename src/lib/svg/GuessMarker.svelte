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
</script>

<svg height={radius * 2} width={radius * 2}>
	<circle
		{cx}
		{cy}
		r={radius}
		fill={effectiveFill}
		stroke={effectiveStroke}
		stroke-width={strokeWidth}
	/>
</svg>
