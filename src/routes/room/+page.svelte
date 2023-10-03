<script>
	import GameLogic from '../../components/GameLogic.svelte';
	import { page } from '$app/stores';

	let roomId = $page.url.searchParams.get('id');
	console.log(roomId);
</script>

<GameLogic id={roomId} />
