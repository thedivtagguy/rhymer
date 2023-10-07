/**
 * Taken from Melt UI
 */

import { cubicOut } from 'svelte/easing';

/**
 * A utility function that converts a style object to a string.
 *
 * @param style - The style object to convert
 * @returns The style object as a string
 */
function styleToString(style) {
	return Object.keys(style).reduce((str, key) => {
		if (style[key] === undefined) return str;
		return str + key + ':' + style[key] + ';';
	}, '');
}

function scaleConversion(valueA, scaleA, scaleB) {
	const [minA, maxA] = scaleA;
	const [minB, maxB] = scaleB;

	const percentage = (valueA - minA) / (maxA - minA);
	const valueB = percentage * (maxB - minB) + minB;

	return valueB;
}

function flyAndScale(node, options) {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	return {
		duration: options.duration || 150,
		delay: 0,
		css: function (t) {
			const y = scaleConversion(t, [0, 1], [options.y, 0]);
			const scale = scaleConversion(t, [0, 1], [options.start, 1]);

			return styleToString({
				transform: transform + ' translate3d(0, ' + y + 'px, 0) scale(' + scale + ')',
				opacity: t
			});
		},
		easing: cubicOut
	};
}

export { flyAndScale, styleToString };
