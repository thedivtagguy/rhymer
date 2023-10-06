<script>
	export let fill = '#F6D682';
	export let stroke = '#D6B336';
	export let radius = 10;
	export let strokeWidth = 1;
	export let opacity = 1;

	let cx = radius;
	let cy = radius;
</script>

<svg height={radius * 2} width={radius * 2}>
	<circle {cx} {cy} r={radius} {fill} {stroke} stroke-width={strokeWidth} {opacity} />
</svg>
