<script>
	import GameLogic from '../../../components/GameLogic.svelte';
	export let data;
</script>

<GameLogic id={data.slug} />
